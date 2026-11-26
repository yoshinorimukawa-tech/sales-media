/* トップページ：商品一覧・カート・メニュー */
(function () {
  var $ = function (s) { return document.querySelector(s); };
  var s = CATALOG.shipping;

  $("[data-season]").textContent = CATALOG.season + " 受付中";
  $("[data-shipping-note]").textContent =
    "表示価格は税込です。" + yen(s.freeThreshold) + "以上のご注文で送料無料。";
  $("[data-shipping-detail]").textContent =
    "全国一律 " + yen(s.standard) + "（" + s.remotePrefectures.join("・") + "は " + yen(s.remote) + "）。" +
    yen(s.freeThreshold) + "以上で無料。";

  /* 商品カード */
  $("#productGrid").innerHTML = CATALOG.products.map(function (p) {
    var options = p.variants.map(function (v, i) {
      return '<label class="variant">' +
        '<input type="radio" name="v-' + p.id + '" value="' + v.id + '"' + (i === 0 ? " checked" : "") + ">" +
        "<span><b>" + v.label + "</b><small>" + v.weight + "</small></span>" +
        "<em>" + yen(v.price) + "</em></label>";
    }).join("");

    var quantities = "";
    for (var n = 1; n <= CATALOG.maxQuantity; n++) quantities += "<option>" + n + "</option>";

    return '<article class="product product-' + p.id + '">' +
      '<div class="product-image"><span class="badge">' + p.badge + "</span>" +
      '<div class="photos">' + (p.photos || [p.image]).map(function (src) {
        return '<img src="' + src + '" alt="' + p.name + 'のイメージ写真" width="600" height="600" loading="lazy">';
      }).join("") + "</div></div>" +
      '<div class="product-body">' +
      '<p class="en">' + p.en + "</p><h3>" + p.name + "</h3>" +
      '<p class="product-lead">' + p.lead + "</p>" +
      "<form data-product>" +
      "<fieldset><legend>内容を選ぶ</legend>" + options + "</fieldset>" +
      '<div class="buy-row"><label>数量 <select name="qty">' + quantities + "</select></label>" +
      '<button class="btn btn-dark" type="submit">カートに入れる</button></div>' +
      "</form></div></article>";
  }).join("");

  $("#productGrid").addEventListener("submit", function (e) {
    e.preventDefault();
    var form = e.target;
    var id = form.querySelector("input[type=radio]:checked").value;
    Cart.add(id, Number(form.elements.qty.value));
    openCart();
  });

  /* カートドロワー */
  var drawer = $("#cartDrawer");
  var overlay = $(".overlay");
  var lastFocus = null;

  function openCart() {
    lastFocus = document.activeElement;
    drawer.inert = false;
    drawer.classList.add("is-open");
    overlay.hidden = false;
    document.body.classList.add("no-scroll");
    drawer.querySelector(".drawer-close").focus();
  }

  function closeCart() {
    if (!drawer.classList.contains("is-open")) return;
    drawer.classList.remove("is-open");
    drawer.inert = true;
    overlay.hidden = true;
    document.body.classList.remove("no-scroll");
    if (lastFocus) lastFocus.focus();
  }

  document.querySelectorAll("[data-cart-open]").forEach(function (el) { el.addEventListener("click", openCart); });
  document.querySelectorAll("[data-cart-close]").forEach(function (el) { el.addEventListener("click", closeCart); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeCart(); });

  function render() {
    var items = Cart.items();
    var subtotal = Cart.subtotal();

    $("[data-cart-count]").textContent = Cart.count();
    $("#cartSubtotal").textContent = yen(subtotal);
    $("#checkoutLink").classList.toggle("is-disabled", items.length === 0);
    $("#cartHint").textContent = items.length === 0 ? "" :
      subtotal >= s.freeThreshold ? "送料無料でお届けします。" :
      "あと " + yen(s.freeThreshold - subtotal) + " で送料無料になります。";

    $("#cartList").innerHTML = items.length === 0
      ? '<li class="cart-empty">カートに商品はありません。</li>'
      : items.map(function (item) {
        var f = CATALOG.findVariant(item.id);
        return '<li class="cart-item" data-id="' + item.id + '">' +
          '<img src="' + f.product.image + '" alt="" width="72" height="72">' +
          "<div><b>" + f.product.name + "</b><small>" + f.variant.label + "・" + f.variant.weight + "</small>" +
          '<div class="stepper"><button type="button" data-step="-1" aria-label="数量を減らす">−</button>' +
          "<span>" + item.qty + "</span>" +
          '<button type="button" data-step="1" aria-label="数量を増やす">＋</button>' +
          '<button type="button" class="remove" data-remove>削除</button></div></div>' +
          "<em>" + yen(f.variant.price * item.qty) + "</em></li>";
      }).join("");
  }

  $("#cartList").addEventListener("click", function (e) {
    var button = e.target.closest("button");
    if (!button) return;
    var id = button.closest(".cart-item").dataset.id;
    var item = Cart.items().find(function (i) { return i.id === id; });
    if (!item) return;
    Cart.set(id, button.hasAttribute("data-remove") ? 0 : item.qty + Number(button.dataset.step));
  });

  document.addEventListener("cart:change", render);
  window.addEventListener("storage", render);
  window.addEventListener("pageshow", render);
  render();

  /* スマホメニュー */
  var menuButton = $("#menuButton");
  var nav = $("#nav");
  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    menuButton.setAttribute("aria-expanded", String(open));
  }
  menuButton.addEventListener("click", function () { setMenu(!nav.classList.contains("is-open")); });
  nav.addEventListener("click", function (e) { if (e.target.tagName === "A") setMenu(false); });

  window.addEventListener("scroll", function () {
    $("#header").classList.toggle("is-scrolled", window.scrollY > 20);
  }, { passive: true });
})();
