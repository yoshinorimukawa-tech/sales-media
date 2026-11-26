/*
 * Stripe Checkout の決済ページを作成するサーバー関数。
 * 金額はブラウザから受け取らず、必ず catalog.js の価格で計算します（改ざん防止）。
 * 必要な環境変数: STRIPE_SECRET_KEY（Netlify の管理画面で設定）
 */
const CATALOG = require("../../public/js/catalog.js");

const reply = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify(body)
});

const text = (value, max) => String(value == null ? "" : value).trim().slice(0, max);

function validate(input) {
  const items = Array.isArray(input.items) ? input.items : [];
  if (items.length === 0 || items.length > 20) throw new Error("カートの内容を確認してください。");

  const lines = items.map((item) => {
    const found = CATALOG.findVariant(item.id);
    const qty = Number(item.qty);
    if (!found || !Number.isInteger(qty) || qty < 1 || qty > CATALOG.maxQuantity) {
      throw new Error("商品または数量が正しくありません。");
    }
    return { ...found, qty };
  });

  const o = input.order || {};
  const order = {
    name: text(o.name, 50),
    email: text(o.email, 100),
    tel: text(o.tel, 20),
    zip: text(o.zip, 10),
    pref: text(o.pref, 10),
    address: text(o.address, 150),
    giftName: text(o.giftName, 50),
    giftTel: text(o.giftTel, 20),
    giftZip: text(o.giftZip, 10),
    giftPref: text(o.giftPref, 10),
    giftAddress: text(o.giftAddress, 150),
    period: text(o.period, 30),
    time: text(o.time, 20),
    noshi: text(o.noshi, 20),
    noshiName: text(o.noshiName, 30),
    message: text(o.message, 100),
    note: text(o.note, 200),
    isGift: o.isGift === true
  };

  const required = ["name", "email", "tel", "zip", "pref", "address"];
  if (order.isGift) required.push("giftName", "giftTel", "giftZip", "giftPref", "giftAddress");
  if (required.some((key) => !order[key])) throw new Error("必須項目が入力されていません。");

  const destination = order.isGift ? order.giftPref : order.pref;
  if (!CATALOG.prefectures.includes(destination)) throw new Error("お届け先の都道府県が正しくありません。");
  if (!CATALOG.deliveryPeriods.includes(order.period)) throw new Error("お届け時期を選択してください。");
  if (!CATALOG.timeSlots.includes(order.time)) throw new Error("時間帯が正しくありません。");
  if (!CATALOG.noshi.includes(order.noshi)) throw new Error("のしの指定が正しくありません。");

  return { lines, order, destination };
}

function buildParams({ lines, order, destination }, siteUrl) {
  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("locale", "ja");
  params.set("payment_method_types[0]", "card");
  params.set("customer_email", order.email);
  params.set("success_url", `${siteUrl}/thanks.html?session_id={CHECKOUT_SESSION_ID}`);
  params.set("cancel_url", `${siteUrl}/checkout.html`);

  let subtotal = 0;
  lines.forEach((line, i) => {
    const key = `line_items[${i}]`;
    subtotal += line.variant.price * line.qty;
    params.set(`${key}[quantity]`, String(line.qty));
    params.set(`${key}[price_data][currency]`, "jpy");
    params.set(`${key}[price_data][unit_amount]`, String(line.variant.price));
    params.set(`${key}[price_data][product_data][name]`, `${line.product.name}　${line.variant.label}`);
    params.set(`${key}[price_data][product_data][description]`, line.variant.weight);
  });

  const fee = CATALOG.shippingFee(subtotal, destination);
  params.set("shipping_options[0][shipping_rate_data][type]", "fixed_amount");
  params.set("shipping_options[0][shipping_rate_data][display_name]", fee === 0 ? "クール便（送料無料）" : "クール便");
  params.set("shipping_options[0][shipping_rate_data][fixed_amount][amount]", String(fee));
  params.set("shipping_options[0][shipping_rate_data][fixed_amount][currency]", "jpy");

  /* 注文内容は Stripe の管理画面（支払いの詳細）で確認できます */
  const meta = {
    "ご依頼主": order.name,
    "電話番号": order.tel,
    "メール": order.email,
    "ご依頼主住所": `〒${order.zip} ${order.pref}${order.address}`,
    "お届け先氏名": order.isGift ? order.giftName : order.name,
    "お届け先電話": order.isGift ? order.giftTel : order.tel,
    "お届け先住所": order.isGift
      ? `〒${order.giftZip} ${order.giftPref}${order.giftAddress}`
      : `〒${order.zip} ${order.pref}${order.address}`,
    "お届け時期": order.period,
    "時間帯": order.time,
    "のし": order.noshi,
    "のし名入れ": order.noshiName,
    "メッセージ": order.message,
    "備考": order.note,
    "注文内容": lines.map((l) => `${l.product.name} ${l.variant.label}×${l.qty}`).join(" / ").slice(0, 500)
  };
  Object.entries(meta).forEach(([key, value]) => {
    if (!value) return;
    params.set(`metadata[${key}]`, value);
    params.set(`payment_intent_data[metadata][${key}]`, value);
  });

  return params;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return reply(405, { error: "Method Not Allowed" });

  const secret = process.env.STRIPE_SECRET_KEY;
  const siteUrl = process.env.URL;
  if (!secret || !siteUrl) {
    return reply(503, { error: "ただいま決済の準備中です。お手数ですが農園までお問い合わせください。" });
  }

  let data;
  try {
    data = validate(JSON.parse(event.body || "{}"));
  } catch (err) {
    return reply(400, { error: err instanceof SyntaxError ? "送信内容を確認してください。" : err.message });
  }

  try {
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: buildParams(data, siteUrl).toString()
    });
    const session = await res.json();
    if (!res.ok) {
      console.error("Stripe error:", session.error && session.error.message);
      return reply(502, { error: "決済ページを作成できませんでした。時間をおいて再度お試しください。" });
    }
    return reply(200, { url: session.url });
  } catch (err) {
    console.error(err);
    return reply(502, { error: "決済サービスに接続できませんでした。" });
  }
};
