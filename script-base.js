
  (function () {
    var PAGES_PROJECT = 'lodgify-new-build';
    var PROD_HOSTS = ['lodgify.com', 'www.lodgify.com'];
    var PROD = 'https://' + PAGES_PROJECT + '.pages.dev/index.js';
    var DEV = 'https://development.' + PAGES_PROJECT + '.pages.dev/index.js';
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
    var params = new URLSearchParams(location.search);
    if (params.has('env')) store.set(params.get('env') === 'local' ? 'local' : null);
    if (params.has('branch')) store.set('branch:' + params.get('branch'));

    var target = store.get();
    var label;

    if (target === 'local') {
      label = 'local';
      load(LOCAL);
    } else if (target && target.indexOf('branch:') === 0) {
      var branch = target.slice(7);
      label = 'branch: ' + branch;
      if (branch === 'main') {
        load(PROD);
      } else {
        // Same alias rules Cloudflare Pages uses for branch preview URLs.
        var alias = branch
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .slice(0, 28)
          .replace(/^-+|-+$/g, '');
        load('https://' + alias + '.' + PAGES_PROJECT + '.pages.dev/index.js');
      }
    } else {
      load(DEV);
    }

    // Visible reminder that this browser is using an override. Click to reset.
    if (label) {
      document.addEventListener('DOMContentLoaded', function () {
        var b = document.createElement('button');
        b.textContent = 'scripts: ' + label + ' ×';
        b.title = 'Reset to development scripts';
        b.style.cssText =
          'position:fixed;left:12px;bottom:12px;z-index:2147483647;padding:6px 10px;border:0;border-radius:6px;background:#111;color:#fff;font:12px/1.2 ui-monospace,monospace;cursor:pointer;opacity:.85';
        b.onclick = function () {
          store.set(null);
          location.search = '';
        };
        document.body.appendChild(b);
      });
    }
  })();
