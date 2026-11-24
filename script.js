(function () {
  var CDN_BASE = 'https://cdn.lodgify.com/marketing-growth/';
  var PROD_HOSTS = ['lodgify.com', 'www.lodgify.com'];
  var PROD = CDN_BASE + 'latest/dist/index.js';
  var DEV = CDN_BASE + 'development/dist/index.js';
  var LOCAL = 'http://localhost:3000/index.js';
  var KEY = 'lodgify:scripts';
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
  var target = store.get();
  if (target && target !== 'local') {
    store.set(null);
    target = null;
  }
  if (target === 'local') {
    load(LOCAL);
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