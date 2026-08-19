/**
 * birdlabs-reveal.js
 *
 * Scroll-reveal for any element carrying `.birdlabs-reveal`.
 *
 * Why this is a shared asset and not per-section JS:
 * the reveal styles (`opacity: 0; transform: translateY(40px)`) live in the section
 * stylesheets, but the observer that adds `.is-in-view` originally lived only inside
 * birdlabs-products-1 and was scoped to that section's own root. Any OTHER section using
 * `.birdlabs-reveal` therefore stayed at opacity 0 forever — rendering correct HTML that
 * was invisible on screen. A document-level observer removes the whole class of bug.
 *
 * Handles sections added later by the theme editor via `shopify:section:load`.
 * Honours prefers-reduced-motion by revealing everything immediately.
 */
(function () {
  if (window.__birdlabsReveal) return;
  window.__birdlabsReveal = true;

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var observer = null;

  function revealNow(el) {
    el.classList.add('is-in-view');
  }

  function observe(scope) {
    var els = (scope || document).querySelectorAll('.birdlabs-reveal:not(.is-in-view)');
    if (!els.length) return;

    if (REDUCED || !('IntersectionObserver' in window)) {
      els.forEach(revealNow);
      return;
    }

    if (!observer) {
      observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              revealNow(entry.target);
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12 }
      );
    }

    els.forEach(function (el) {
      observer.observe(el);
    });
  }

  function init() {
    observe(document);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Theme editor: a section re-rendered after an edit brings new elements with it.
  document.addEventListener('shopify:section:load', function (e) {
    observe(e.target);
  });
})();
