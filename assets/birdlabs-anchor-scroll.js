/**
 * birdlabs-anchor-scroll.js
 *
 * Smooth same-page anchor navigation for the Birdlabs one-page storefront.
 *
 * Why this exists as a standalone asset rather than inside a custom header:
 * FLTHQ welded its scroll behaviour into flt-header-1.liquid, which meant adopting the
 * one-pager meant adopting their header. Here the behaviour is independent, so a merchant
 * uses Shopify's STOCK header and sets ordinary menu links (/#products, /#story, /#contact)
 * the normal way in the theme editor. Any client store gets the behaviour without inheriting
 * someone else's header design. (Task 0003, OQ-2 option b.)
 *
 * Handles:
 *   - same-page "#id" and "/#id" links, including from the stock header and footer menus
 *   - offsetting the scroll so a sticky header does not cover the target heading
 *   - prefers-reduced-motion: jumps instead of animating
 *   - a #hash present on initial page load (arriving from another page)
 *   - updating the URL without the browser's own instant jump
 *
 * Loaded by the Birdlabs sections that need it. It is never loaded from layout/theme.liquid,
 * so no stock Horizon file is modified.
 */
(function () {
  if (window.__birdlabsAnchorScroll) return;
  window.__birdlabsAnchorScroll = true;

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)');

  /**
   * Horizon does NOT scroll the window on desktop.
   *
   * assets/base.css sets `html, body { height: 100dvh; overflow: hidden }` at >=990px and
   * makes `.page-wrapper` the scroll container (`overflow-y: auto`). So `window.scrollTo`
   * is silently a no-op there — verified: scrollTo(0, 1500) left window.scrollY at 0.
   * Below 990px the window scrolls normally. Resolve it at call time rather than caching,
   * because a viewport resize crosses that boundary.
   */
  function scroller() {
    var wrapper = document.querySelector('.page-wrapper');
    if (wrapper && wrapper.scrollHeight > wrapper.clientHeight + 1) {
      var overflowY = getComputedStyle(wrapper).overflowY;
      if (overflowY === 'auto' || overflowY === 'scroll') return wrapper;
    }
    return window;
  }

  /**
   * Horizon publishes the measured header height as --header-height on :root, set before
   * first paint and kept fresh by header.js. Reading it means we follow a transparent,
   * sticky or resized header instead of guessing a fixed offset.
   */
  function headerOffset() {
    var raw = getComputedStyle(document.documentElement).getPropertyValue('--header-height');
    var px = parseFloat(raw);
    if (!isNaN(px) && px > 0) return px;
    // Fall back to measuring a sticky/fixed header, since --header-height is only set by
    // Horizon's own header and a custom one may not publish it.
    var hdr = document.querySelector('.birdlabs-header--sticky, header[class*="header"]');
    if (hdr) {
      var pos = getComputedStyle(hdr).position;
      if (pos === 'sticky' || pos === 'fixed') return hdr.offsetHeight;
    }
    return 0;
  }

  function scrollToTarget(target, push) {
    if (!target) return;

    var box = scroller();
    var behavior = REDUCED.matches ? 'auto' : 'smooth';
    var top;

    if (box === window) {
      top = target.getBoundingClientRect().top + window.pageYOffset - headerOffset();
      window.scrollTo({ top: top < 0 ? 0 : top, behavior: behavior });
    } else {
      // Position of the target relative to the scroll container's current scroll offset.
      top =
        target.getBoundingClientRect().top -
        box.getBoundingClientRect().top +
        box.scrollTop -
        headerOffset();
      box.scrollTo({ top: top < 0 ? 0 : top, behavior: behavior });
    }

    // Move keyboard focus to the target so the jump is not sighted-users-only.
    // tabindex="-1" makes a non-interactive element focusable without adding it to
    // the tab order; preventScroll stops the browser undoing the smooth scroll.
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });

    if (push && target.id) {
      history.pushState(null, '', '#' + target.id);
    }
  }

  function resolveTarget(hash) {
    if (!hash || hash === '#') return null;
    try {
      return document.querySelector(hash);
    } catch (e) {
      return null; // hash is not a valid selector
    }
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest('a[href]');
    if (!link) return;
    if (link.target === '_blank' || event.metaKey || event.ctrlKey || event.shiftKey) return;

    var href = link.getAttribute('href');
    if (!href) return;

    // Same-page only: "#id", "/#id", or "/current-path#id".
    var hashIndex = href.indexOf('#');
    if (hashIndex === -1) return;

    var path = href.slice(0, hashIndex);
    var hash = href.slice(hashIndex);
    if (path && path !== '/' && path !== window.location.pathname) return;

    var target = resolveTarget(hash);
    if (!target) return; // let the browser handle links to sections that are not on this page

    event.preventDefault();
    scrollToTarget(target, true);
  });

  // A hash present on load: the browser has already jumped, so re-run the scroll once
  // layout has settled to apply the header offset.
  window.addEventListener('load', function () {
    if (!window.location.hash) return;
    var target = resolveTarget(window.location.hash);
    if (target) requestAnimationFrame(function () { scrollToTarget(target, false); });
  });

  // Back/forward between anchors.
  window.addEventListener('popstate', function () {
    var target = resolveTarget(window.location.hash);
    if (target) scrollToTarget(target, false);
  });
})();
