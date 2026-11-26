/* カート（ブラウザに保存。保存するのは商品IDと数量のみ） */
(function () {
  var KEY = "mukawa-cart";
  var memory = [];

  function clean(items) {
    return (Array.isArray(items) ? items : []).filter(function (i) {
      return i && CATALOG.findVariant(i.id) && Number.isInteger(i.qty) && i.qty > 0;
    });
  }

  function read() {
    try { return clean(JSON.parse(localStorage.getItem(KEY))); }
    catch (e) { return clean(memory); }
  }

  function write(items) {
    memory = items;
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) { /* 保存不可の環境 */ }
    document.dispatchEvent(new CustomEvent("cart:change"));
  }

  function set(id, qty) {
    var items = read();
    var index = items.findIndex(function (i) { return i.id === id; });
    qty = Math.min(qty, CATALOG.maxQuantity);
    if (qty <= 0) { if (index >= 0) items.splice(index, 1); }
    else if (index >= 0) items[index].qty = qty;
    else items.push({ id: id, qty: qty });
    write(items);
  }

  window.Cart = {
    items: read,
    set: set,
    add: function (id, qty) {
      var current = read().find(function (i) { return i.id === id; });
      set(id, (current ? current.qty : 0) + qty);
    },
    clear: function () { write([]); },
    count: function () {
      return read().reduce(function (n, i) { return n + i.qty; }, 0);
    },
    subtotal: function () {
      return read().reduce(function (sum, i) {
        return sum + CATALOG.findVariant(i.id).variant.price * i.qty;
      }, 0);
    }
  };

  window.yen = function (n) { return "¥" + n.toLocaleString("ja-JP"); };
})();
