(function () {
  var CDN_BASE = 'https://cdn.lodgify.com/marketing-growth/';
  var PROD_HOSTS = ['lodgify.com', 'www.lodgify.com'];
  var PROD = CDN_BASE + 'latest/dist/index.js';
  // Development domains (www.lodgifyintegration.com, webflow-mkt.lodgifyintegration.com)
  // and any other non-production host get the development script.
  var DEV = CDN_BASE + 'development/dist/index.js';
  var LOCAL = 'http://localhost:3000/index.js';
  var KEY = 'lodgify:scripts';

  // document.write keeps the same `defer` timing as a hand-written tag, so the
  // DOMContentLoaded handlers in src/index.js still fire.
  function load(src) {
    if (document.readyState !== 'loading') {
      var s = document.createElement('script');
      s.src = src;
      return document.head.appendChild(s);
    }
    document.write('<script defer src="' + src + '"><\/script>');
  }

  if (PROD_HOSTS.indexOf(location.hostname) !== -1) return load(PROD);

  var store = {
    get: function () {
      try {
        return localStorage.getItem(KEY);
      } catch (e) {
        return null;
      }
    },
    set: function (v) {
      try {
        v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY);
      } catch (e) { }
    },
  };

  // ?env=local  -> use http://localhost:3000/index.js (remembered in this browser)
  // ?env=<any>  -> reset to the development script
  var params = new URLSearchParams(location.search);
  if (params.has('env')) store.set(params.get('env') === 'local' ? 'local' : null);

  var target = store.get();
  // Drop leftovers from the old Cloudflare setup (e.g. "branch:<name>").
  if (target && target !== 'local') {
    store.set(null);
    target = null;
  }

  if (target === 'local') {
    load(LOCAL);

    // Visible reminder that this browser is using a local override. Click to reset.
    document.addEventListener('DOMContentLoaded', function () {
      var b = document.createElement('button');
      b.textContent = 'scripts: local ×';
      b.title = 'Reset to development scripts';
      b.style.cssText =
        'position:fixed;left:12px;bottom:12px;z-index:2147483647;padding:6px 10px;border:0;border-radius:6px;background:#111;color:#fff;font:12px/1.2 ui-monospace,monospace;cursor:pointer;opacity:.85';
      b.onclick = function () {
        store.set(null);
        location.search = '';
      };
      document.body.appendChild(b);
    });
  } else {
    load(DEV);
  }
})();
