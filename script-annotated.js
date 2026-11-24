/**
 * Lodgify marketing-growth script loader (Webflow custom code)
 * ============================================================================
 * Paste into Webflow site settings -> Custom code -> Head code, wrapped in a
 * <script> tag (production: use script.min.js, the minified version of this file).
 * Keep script-base.js, script.js, script-annotated.js and script.min.js in sync - see below.
 *
 * WHAT IT DOES
 *   Picks which build of the marketing-growth bundle to load, depending on the
 *   host the page is running on, and injects it as a script.
 *
 *   Host                                              Script loaded
 *   ------------------------------------------------  --------------------------------------------
 *   lodgify.com, www.lodgify.com (production)         CDN  /marketing-growth/latest/dist/index.js
 *   www.lodgifyintegration.com,
 *   webflow-mkt.lodgifyintegration.com (development)  CDN  /marketing-growth/development/dist/index.js
 *   any other host (e.g. *.webflow.io staging)        same as development
 *   any non-production host + ?env=local              http://localhost:3000/index.js
 *
 * LOCAL DEBUGGING
 *   1. Run the dev server on localhost:3000 (must serve /index.js).
 *   2. Open any NON-production page with ?env=local, e.g.
 *        https://webflow-mkt.lodgifyintegration.com/?env=local
 *      The choice is stored in localStorage (key "lodgify:scripts") so it
 *      survives navigation and reloads. A black "scripts: local x" badge
 *      appears bottom-left as a reminder.
 *   3. Click the badge (or open any page with ?env=anything-else, e.g.
 *      ?env=dev) to go back to the development script.
 *   Local mode is deliberately impossible on production hosts: they return
 *   before the override logic runs.
 *
 * CHANGES VS THE CLOUDFLARE VERSION
 *   - Scripts now come from cdn.lodgify.com (Google Cloud) instead of
 *     <project>.pages.dev. PAGES_PROJECT and the pages.dev URLs are gone.
 *   - Removed the ?branch=<name> preview override: it relied on Cloudflare
 *     Pages' per-branch preview URLs, which the CDN does not provide.
 *   - Stale "branch:*" values left in localStorage by the old script are
 *     cleared automatically, so nobody stays pinned to a dead URL.
 *   - Production uses /latest/dist/, development uses /development/dist/.
 *
 * CAVEATS
 *   - "latest" is a moving target: whatever is published there is live on
 *     production immediately. Mind CDN/browser cache headers when rolling out or back.
 *   - localhost:3000 is plain http. It works from https pages in Chrome/Firefox
 *     (localhost is treated as secure) but may be blocked in Safari.
 *   - If the CDN is unreachable the script silently fails to load (there is no
 *     fallback), same as before.
 */
(function () {
  // CDN root (Google Cloud, served from cdn.lodgify.com). Each environment has its own folder.
  var CDN_BASE = 'https://cdn.lodgify.com/marketing-growth/';

  // Hostnames that count as production. Exact match: subdomains are NOT included.
  var PROD_HOSTS = ['lodgify.com', 'www.lodgify.com'];

  var PROD = CDN_BASE + 'latest/dist/index.js';
  // Development domains (www.lodgifyintegration.com, webflow-mkt.lodgifyintegration.com)
  // and any other non-production host get the development script.
  var DEV = CDN_BASE + 'development/dist/index.js';

  // Local dev server (e.g. webpack/vite) used with ?env=local.
  var LOCAL = 'http://localhost:3000/index.js';

  // localStorage key holding the override. Only ever contains "local" (or nothing).
  var KEY = 'lodgify:scripts';

  // Injects the bundle.
  // While the HTML is still being parsed we use document.write so the tag behaves
  // exactly like a hand-written <script defer src=...> in the head: it executes
  // after parsing, before DOMContentLoaded, so the DOMContentLoaded handlers in
  // src/index.js still fire. If the page is already parsed (loader executed late,
  // e.g. via a tag manager) document.write would wipe the page, so we append a
  // <script> element instead. "<\/script>" is escaped so the HTML parser does not
  // end this inline script early.
  function load(src) {
    if (document.readyState !== 'loading') {
      var s = document.createElement('script');
      s.src = src;
      return document.head.appendChild(s);
    }
    document.write('<script defer src="' + src + '"><\/script>');
  }

  // Production: load immediately and stop. No override, no badge, no localStorage access.
  if (PROD_HOSTS.indexOf(location.hostname) !== -1) return load(PROD);

  // localStorage wrapper. Access can throw (Safari private mode, blocked site
  // data, sandboxed iframes), so every call is guarded and failures degrade to
  // "no override".
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
        // falsy value = clear the override
        v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY);
      } catch (e) { }
    },
  };

  // URL switch (non-production hosts only):
  //   ?env=local  -> remember "local"
  //   ?env=<any other value, even empty> -> forget the override (back to development)
  var params = new URLSearchParams(location.search);
  if (params.has('env')) store.set(params.get('env') === 'local' ? 'local' : null);

  var target = store.get();

  // Migration: the old Cloudflare loader also stored "branch:<name>". That mode
  // no longer exists, so clear anything that is not "local".
  if (target && target !== 'local') {
    store.set(null);
    target = null;
  }

  if (target === 'local') {
    load(LOCAL);

    // Visible reminder that this browser is using a local override. Click to reset.
    // Waits for DOMContentLoaded because <body> does not exist yet while the head is parsing.
    document.addEventListener('DOMContentLoaded', function () {
      var b = document.createElement('button');
      b.textContent = 'scripts: local ×';
      b.title = 'Reset to development scripts';
      // Inline styles only, so site CSS cannot restyle it and it never leaks into site CSS.
      // Max z-index keeps it above modals/menus.
      b.style.cssText =
        'position:fixed;left:12px;bottom:12px;z-index:2147483647;padding:6px 10px;border:0;border-radius:6px;background:#111;color:#fff;font:12px/1.2 ui-monospace,monospace;cursor:pointer;opacity:.85';
      b.onclick = function () {
        store.set(null);
        // Reloads the current page without the query string (also drops ?env=local).
        location.search = '';
      };
      document.body.appendChild(b);
    });
  } else {
    // Default for every non-production host.
    load(DEV);
  }
})();
