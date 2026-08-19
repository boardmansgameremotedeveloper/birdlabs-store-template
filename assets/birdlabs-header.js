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
    // Horizon scrolls .page-wrapper on desktop, not the window (assets/base.css) — listen
    // to both so `.is-scrolled` fires whichever one is the scroller at this viewport.
    this.scrollBox = document.querySelector('.page-wrapper');
    window.addEventListener('scroll', this.onScroll, { passive: true });
    this.scrollBox?.addEventListener('scroll', this.onScroll, { passive: true });
    this.burger?.addEventListener('click', this.onBurger);
    this.cartBtn?.addEventListener('click', this.onCart);
    document.addEventListener('shopify:cart:lines-update', this.onCartUpdate);

    this.publishHeight();
    this.onScroll();

    // Republish on resize: the height changes with the viewport, and anything offsetting
    // against a sticky header needs the current value.
    if ('ResizeObserver' in window) {
      this.ro = new ResizeObserver(() => this.publishHeight());
      this.ro.observe(this);
    }
  }

  /**
   * Publish --header-height, which Horizon's own header sets and other code offsets
   * against. A custom header that omits it leaves the variable EMPTY — measured on this
   * page — so anchor scrolling silently loses its offset. Set it ourselves.
   */
  publishHeight() {
    const h = this.offsetHeight;
    if (h > 0) document.documentElement.style.setProperty('--header-height', `${h}px`);
  }

  disconnectedCallback() {
    this.ro?.disconnect();
    window.removeEventListener('scroll', this.onScroll);
    this.scrollBox?.removeEventListener('scroll', this.onScroll);
    this.burger?.removeEventListener('click', this.onBurger);
    this.cartBtn?.removeEventListener('click', this.onCart);
    document.removeEventListener('shopify:cart:lines-update', this.onCartUpdate);
  }

  onScroll() {
    const y = this.scrollBox ? this.scrollBox.scrollTop : 0;
    this.classList.toggle('is-scrolled', Math.max(window.scrollY, y) > 8);
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
    // `cart-drawer-component` has no open() of its own — it resolves
    // `this.closest('theme-drawer')` and drives that (assets/cart-drawer.js:22). So the
    // element to open is the theme-drawer WRAPPING the cart drawer, not the cart drawer.
    // Verified: cart-drawer-component's prototype exposes only constructor and the
    // connected/disconnected callbacks.
    const cart = document.querySelector('cart-drawer-component');
    const drawer = cart && cart.closest('theme-drawer');
    if (!drawer || typeof drawer.open !== 'function') return; // fall through to href=/cart
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
