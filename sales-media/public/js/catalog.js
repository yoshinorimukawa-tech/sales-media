/*
 * 武川農園 商品データ
 * ─────────────────────────────────────────
 * 価格・内容量・送料・お届け時期はこのファイルだけを直せば、
 * 画面表示と決済金額の両方に反映されます。価格はすべて税込（円）。
 * ※現在の数値はすべて「仮」です。公開前に必ず確認してください。
 */
(function (root) {
  var CATALOG = {
    season: "2027年度 先行予約",

    products: [
      {
        id: "shine",
        name: "シャインマスカット",
        en: "Shine Muscat",
        image: "assets/photo-shine-plate.jpg",
        badge: "当園の主役",
        lead: "翡翠色に輝く大粒。皮ごと頬張れば、弾ける果汁とマスカットの香りが広がります。",
        variants: [
          { id: "shine-1", label: "一房 桐箱入り", weight: "約700g", price: 8800 },
          { id: "shine-2", label: "二房 化粧箱", weight: "約1.3kg", price: 12800 },
          { id: "shine-3", label: "三房 化粧箱", weight: "約2kg", price: 17800 }
        ]
      },
      {
        id: "kyoho",
        name: "巨峰",
        en: "Kyoho",
        image: "assets/photo-kyoho.jpg",
        badge: "王道の味わい",
        lead: "深い紫に白い果粉をまとった大粒。濃厚な甘みとほどよい酸味が調和します。",
        variants: [
          { id: "kyoho-2", label: "二房 化粧箱", weight: "約900g", price: 5400 },
          { id: "kyoho-3", label: "三房 化粧箱", weight: "約1.4kg", price: 7600 }
        ]
      },
      {
        id: "assort",
        name: "翠紫 ─ 詰合せ",
        en: "Sui-Shi Assortment",
        image: "assets/photo-shine-plate.jpg",
        /* 詰合せは2枚を左右に並べて表示。専用の写真ができたら photos を消して image だけにします */
        photos: ["assets/photo-shine-plate.jpg", "assets/photo-kyoho.jpg"],
        badge: "贈答に人気の組合せ",
        lead: "翠のシャインマスカットと紫の巨峰。二色を一箱に収めた、晴れの日の贈りもの。",
        variants: [
          { id: "assort-2", label: "各一房 化粧箱", weight: "約1.1kg", price: 9800 },
          { id: "assort-4", label: "各二房 特製箱", weight: "約2.2kg", price: 18500 }
        ]
      }
    ],

    shipping: {
      standard: 1100,
      remote: 1900,
      remotePrefectures: ["北海道", "沖縄県"],
      freeThreshold: 20000
    },

    maxQuantity: 10,

    deliveryPeriods: ["8月下旬", "9月上旬", "9月中旬", "9月下旬", "10月上旬", "おまかせ（食べ頃を発送）"],
    timeSlots: ["指定なし", "午前中", "14時〜16時", "16時〜18時", "18時〜20時", "19時〜21時"],
    noshi: ["のし不要", "御中元", "残暑御見舞", "敬老の日", "御礼", "御祝", "内祝", "御供", "無地のし"],

    prefectures: [
      "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県", "茨城県", "栃木県", "群馬県",
      "埼玉県", "千葉県", "東京都", "神奈川県", "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県",
      "岐阜県", "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県",
      "鳥取県", "島根県", "岡山県", "広島県", "山口県", "徳島県", "香川県", "愛媛県", "高知県", "福岡県",
      "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
    ]
  };

  /* 商品IDから商品とサイズを探す */
  CATALOG.findVariant = function (variantId) {
    for (var i = 0; i < CATALOG.products.length; i++) {
      var product = CATALOG.products[i];
      for (var j = 0; j < product.variants.length; j++) {
        if (product.variants[j].id === variantId) {
          return { product: product, variant: product.variants[j] };
        }
      }
    }
    return null;
  };

  /* 送料計算（画面と決済で共通） */
  CATALOG.shippingFee = function (subtotal, prefecture) {
    var s = CATALOG.shipping;
    if (subtotal <= 0 || subtotal >= s.freeThreshold) return 0;
    return s.remotePrefectures.indexOf(prefecture) >= 0 ? s.remote : s.standard;
  };

  if (typeof module !== "undefined" && module.exports) module.exports = CATALOG;
  else root.CATALOG = CATALOG;
})(this);
