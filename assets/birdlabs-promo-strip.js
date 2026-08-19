/**
 * birdlabs-promo-strip.js — add-to-cart for the compact promo strip.
 *
 * Same contract as the product cards: POST /cart/add.js so the page never navigates, then
 * dispatch Shopify's standard `shopify:cart:lines-update`, which Horizon's stock cart drawer
 * listens for (assets/cart-drawer.js:33). No second cart.
 */
(function () {
  if (window.__birdlabsPromoStrip) return;
  window.__birdlabsPromoStrip = true;

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.birdlabs-promo__btn');
    if (!btn || btn.disabled) return;

    var id = btn.dataset.variantId;
    if (!id) return;

    e.preventDefault();
    var original = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Adding…';

    fetch(window.Shopify.routes.root + 'cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ items: [{ id: Number(id), quantity: 1 }] })
    })
      .then(function (r) {
        if (!r.ok) throw new Error('add failed');
        return r.json();
      })
      .then(function () {
        var evt = new CustomEvent('shopify:cart:lines-update', { bubbles: true });
        evt.action = 'add';
        document.dispatchEvent(evt);
        btn.textContent = 'Added';
        setTimeout(function () { btn.textContent = original; btn.disabled = false; }, 1600);
      })
      .catch(function () {
        btn.textContent = 'Retry';
        btn.disabled = false;
        setTimeout(function () { btn.textContent = original; }, 1800);
      });
  });
})();
