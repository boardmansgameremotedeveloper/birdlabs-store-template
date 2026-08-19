/**
 * birdlabs-header.js — behaviour for sections/birdlabs-header-1.liquid
 *
 * Three jobs:
 *   1. add `.is-scrolled` once the page moves, so a transparent header turns solid
 *   2. toggle the mobile menu
 *   3. keep the cart count fresh, and open Horizon's stock cart drawer instead of
 *      navigating to /cart
 *
 * A custom element rather than a bare script: the theme editor destroys and recreates
 * sections on edit, and connectedCallback/disconnectedCallback give correct setup and
 * teardown for free — no listener leaks, no shopify:section:load bookkeeping.
 */
class BirdlabsHeader extends HTMLElement {
  connectedCallback() {
    this.burger = this.querySelector('.birdlabs-header__burger');
    this.mobile = this.querySelector('.birdlabs-header__mobile');
    this.cartBtn = this.querySelector('[data-birdlabs-cart]');

    this.onScroll = this.onScroll.bind(this);
    this.onBurger = this.onBurger.bind(this);
    this.onCart = this.onCart.bind(this);
    this.onCartUpdate = this.onCartUpdate.bind(this);

    // passive: this listener never calls preventDefault, so the browser need not wait
    // for it before scrolling.
    window.addEventListener('scroll', this.onScroll, { passive: true });
    this.burger?.addEventListener('click', this.onBurger);
    this.cartBtn?.addEventListener('click', this.onCart);
    document.addEventListener('shopify:cart:lines-update', this.onCartUpdate);

    this.onScroll();
  }

  disconnectedCallback() {
    window.removeEventListener('scroll', this.onScroll);
    this.burger?.removeEventListener('click', this.onBurger);
    this.cartBtn?.removeEventListener('click', this.onCart);
    document.removeEventListener('shopify:cart:lines-update', this.onCartUpdate);
  }

  onScroll() {
    this.classList.toggle('is-scrolled', window.scrollY > 8);
  }

  onBurger() {
    const open = this.mobile.hasAttribute('hidden');
    if (open) {
      this.mobile.removeAttribute('hidden');
    } else {
      this.mobile.setAttribute('hidden', '');
    }
    this.burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  onCart(event) {
    // Only intercept when the drawer actually exists. Otherwise let the click follow
    // the href to /cart, which is why the markup uses a real link.
    const drawer = document.querySelector('cart-drawer-component');
    if (!drawer || typeof drawer.open !== 'function') return;
    event.preventDefault();
    drawer.open();
  }

  async onCartUpdate() {
    const el = this.querySelector('[data-cart-count]');
    if (!el) return;
    try {
      const res = await fetch(`${window.Shopify.routes.root}cart.js`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return;
      const cart = await res.json();
      el.textContent = cart.item_count;
    } catch (e) {
      /* a stale count is better than a broken header */
    }
  }
}

if (!customElements.get('birdlabs-header')) {
  customElements.define('birdlabs-header', BirdlabsHeader);
}
