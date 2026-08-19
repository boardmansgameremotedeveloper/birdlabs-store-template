/**
 * birdlabs-product-details.js — tab switching for sections/birdlabs-product-details.liquid
 *
 * Deliberately small. Tabs are rendered server-side and only for metafields that have
 * content, so this file's only job is showing one panel at a time. Panels are in the DOM
 * from the start, so the content is present for search engines and for anyone whose
 * JavaScript does not run — worst case they see the first panel.
 */
(function () {
  function init(scope) {
    (scope || document).querySelectorAll('.birdlabs-pdetails').forEach(function (root) {
      if (root.dataset.bpdInit === 'true') return;
      root.dataset.bpdInit = 'true';

      var tabs = root.querySelectorAll('.birdlabs-pdetails__tab');
      var panels = root.querySelectorAll('.birdlabs-pdetails__panel');

      tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
          var want = tab.dataset.tab;
          tabs.forEach(function (t) {
            var on = t === tab;
            t.classList.toggle('is-active', on);
            t.setAttribute('aria-selected', on ? 'true' : 'false');
          });
          panels.forEach(function (panel) {
            panel.classList.toggle('is-active', panel.dataset.panel === want);
          });
        });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(document); });
  } else {
    init(document);
  }
  document.addEventListener('shopify:section:load', function (e) { init(e.target); });
})();
