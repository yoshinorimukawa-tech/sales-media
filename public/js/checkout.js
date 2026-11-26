/* ご注文手続き：入力フォーム → Stripe 決済画面 */
(function () {
  var $ = function (s) { return document.querySelector(s); };
  var form = $("#orderForm");
  var button = $("#payButton");
  var errorBox = $("#formError");
  /* パソコン内で確認しているときだけ「確認用表示」。公開サイトでは必ず実際の決済を呼びます */
  var isLocal = location.protocol === "file:" || ["localhost", "127.0.0.1"].indexOf(location.hostname) >= 0;

  function fill(name, list, placeholder) {
    var select = form.elements[name];
    if (placeholder) select.add(new Option(placeholder, ""));
    list.forEach(function (v) { select.add(new Option(v, v)); });
  }
  fill("pref", CATALOG.prefectures, "選択してください");
  fill("giftPref", CATALOG.prefectures, "選択してください");
  fill("period", CATALOG.deliveryPeriods, "選択してください");
  fill("time", CATALOG.timeSlots);
  fill("noshi", CATALOG.noshi);

  function destination() {
    return form.elements.isGift.checked ? form.elements.giftPref.value : form.elements.pref.value;
  }

  function render() {
    var items = Cart.items();
    $("#emptyState").hidden = items.length > 0;
    $("#checkoutGrid").hidden = items.length === 0;

    $("#summaryList").innerHTML = items.map(function (item) {
      var f = CATALOG.findVariant(item.id);
      return "<li><span>" + f.product.name + "<small>" + f.variant.label + " × " + item.qty +
        "</small></span><b>" + yen(f.variant.price * item.qty) + "</b></li>";
    }).join("");

    var subtotal = Cart.subtotal();
    var pref = destination();
    var fee = CATALOG.shippingFee(subtotal, pref);
    var known = pref !== "" || subtotal >= CATALOG.shipping.freeThreshold;
    $("#sumSubtotal").textContent = yen(subtotal);
    $("#sumShipping").textContent = known ? (fee === 0 ? "無料" : yen(fee)) : "お届け先を選択";
    $("#sumTotal").textContent = known ? yen(subtotal + fee) : yen(subtotal) + " ＋送料";
  }

  function toggleGift() {
    var on = form.elements.isGift.checked;
    var fields = $("#giftFields");
    fields.hidden = !on;
    fields.disabled = !on;
  }

  form.addEventListener("change", function () { toggleGift(); render(); });
  window.addEventListener("storage", render);

  function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = !message;
  }

  function reset() {
    button.disabled = false;
    button.textContent = "お支払いへ進む";
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    showError("");
    if (Cart.items().length === 0) return render();

    var order = Object.fromEntries(new FormData(form));
    order.isGift = form.elements.isGift.checked;

    if (isLocal) {
      var subtotal = Cart.subtotal();
      $("#demoTotal").textContent = yen(subtotal + CATALOG.shippingFee(subtotal, destination()));
      $("#demoDialog").showModal();
      return;
    }

    /* GitHub Pages は決済処理を動かせないため、送信せずに案内する */
    if (/\.github\.io$/.test(location.hostname)) {
      return showError("このページは表示確認用のため、ご注文・お支払いはできません。");
    }

    button.disabled = true;
    button.textContent = "決済画面へ移動しています…";

    fetch("/.netlify/functions/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: Cart.items(), order: order })
    })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok || !data.url) throw new Error(data.error || "");
          location.href = data.url;
        });
      })
      .catch(function (err) {
        /* 通信エラー等の英語メッセージは表示しない */
        var message = err && err.name === "Error" && err.message;
        showError(message || "決済画面を開けませんでした。通信状況を確認して、もう一度お試しください。");
        reset();
      });
  });

  /* Stripe画面から「戻る」で帰ってきたときにボタンを復帰 */
  window.addEventListener("pageshow", function () { reset(); toggleGift(); render(); });
})();
