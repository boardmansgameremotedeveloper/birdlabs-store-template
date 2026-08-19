/**
 * birdlabs-callback.js — sections/birdlabs-callback.liquid
 *
 * Two modes, decided by whether the section has a `data-endpoint`:
 *
 *   no endpoint  — do nothing. The markup is Shopify's native {% form 'contact' %}, so the
 *                  browser submits it normally and the store owner gets an email. Working
 *                  behaviour with zero infrastructure is the default on purpose.
 *
 *   endpoint set — intercept, POST {name, phone, topic} as JSON, and if the service returns
 *                  an id, poll it for progress. This mirrors divorcemachine's Twilio flow
 *                  (POST /api/voice/test-call then poll /{id}) without assuming that exact
 *                  shape: any service returning {id} or {status} works.
 *
 * Failure always falls back to letting the native form submit, so a broken or unreachable
 * endpoint degrades to "the store owner gets an email" rather than to a dead button.
 */
(function () {
  if (window.__birdlabsCallback) return;
  window.__birdlabsCallback = true;

  var POLL_MS = 2000;
  var MAX_POLLS = 30; // ~60s, then stop claiming anything is still happening

  function say(status, msg) {
    if (!status) return;
    status.hidden = false;
    status.textContent = msg;
  }

  function poll(endpoint, id, status, tries) {
    if (tries > MAX_POLLS) {
      say(status, 'Still working on it — we will call you shortly.');
      return;
    }
    fetch(endpoint.replace(/\/$/, '') + '/' + encodeURIComponent(id), {
      headers: { Accept: 'application/json' }
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        var state = d && (d.status || d.state);
        if (state === 'done' || state === 'completed') {
          say(status, 'Connected — thanks for talking with us.');
          return;
        }
        if (state === 'missed' || state === 'failed' || state === 'error') {
          say(status, 'We could not reach you. We will try again shortly.');
          return;
        }
        say(status, state === 'ringing' ? 'Calling you now…' : 'Getting a specialist on the line…');
        setTimeout(function () { poll(endpoint, id, status, tries + 1); }, POLL_MS);
      })
      .catch(function () {
        say(status, 'Request received — we will call you back.');
      });
  }

  document.addEventListener('submit', function (e) {
    var form = e.target.closest('.birdlabs-cb__form');
    if (!form) return;

    var root = form.closest('.birdlabs-cb');
    var endpoint = root && root.dataset.endpoint;
    if (!endpoint) return; // native Shopify submit — the working default

    var btn = form.querySelector('[data-cb-submit]');
    var status = form.querySelector('[data-cb-status]');
    var data = new FormData(form);

    e.preventDefault();
    if (btn) btn.disabled = true;
    say(status, 'Requesting your callback…');

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        name: data.get('contact[name]') || '',
        phone: data.get('contact[phone]') || '',
        topic: data.get('contact[body]') || ''
      })
    })
      .then(function (r) {
        if (!r.ok) throw new Error('rejected');
        return r.json();
      })
      .then(function (d) {
        var id = d && (d.id || d.call_id || d.pending_id);
        if (id) {
          poll(endpoint, id, status, 0);
        } else {
          say(status, 'Request received — we will call you back shortly.');
          if (btn) btn.disabled = false;
        }
      })
      .catch(function () {
        // Endpoint unreachable: let the native contact form carry the request instead,
        // so the visitor's details are not silently lost.
        say(status, 'Sending your request…');
        form.submit();
      });
  });
})();
