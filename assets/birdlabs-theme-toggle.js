/**
 * birdlabs-theme-toggle.js — visitor light/dark switching.
 *
 * The no-flash bootstrap runs inline in snippets/birdlabs-theme-tokens.liquid before paint.
 * This file only handles the click and remembering the choice.
 *
 * Default is the visitor's OS preference; an explicit choice overrides it and persists.
 */
(function () {
  if (window.__birdlabsThemeToggle) return;
  window.__birdlabsThemeToggle = true;

  var KEY = 'birdlabs-theme';

  function isDark() {
    return document.documentElement.getAttribute('data-birdlabs-theme') === 'dark';
  }

  function apply(dark) {
    if (dark) {
      document.documentElement.setAttribute('data-birdlabs-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-birdlabs-theme', 'light');
    }
    try {
      localStorage.setItem(KEY, dark ? 'dark' : 'light');
    } catch (e) {
      /* private mode: the choice holds for this page only */
    }
    document.querySelectorAll('.birdlabs-theme-toggle').forEach(function (btn) {
      btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
    });
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.birdlabs-theme-toggle');
    if (!btn) return;
    apply(!isDark());
  });

  // Follow the OS only while the visitor has not chosen for themselves.
  try {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (ev) {
      if (!localStorage.getItem(KEY)) apply(ev.matches);
    });
  } catch (e) { /* older browsers */ }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.birdlabs-theme-toggle').forEach(function (btn) {
      btn.setAttribute('aria-pressed', isDark() ? 'true' : 'false');
    });
  });
})();
