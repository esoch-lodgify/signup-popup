# WordPress deployment checklist (lodgify.com/blog)

Things that cannot be fixed in the snippet and must be verified in the environment.

## Injection
- [ ] Use **WPCode (Site Wide Footer)**, a `wp_footer` hook, or GTM Custom HTML. Never post content / classic editor / Text widget (wpautop + wptexturize turn `&&` into `&#038;&&#038;` and add `<p>` tags).
- [ ] Paste the whole `embed.min.html` as **one** snippet (style → dialog → script). Do not split it: the script reads `#demo-modal` immediately. Not in `<head>`.
- [ ] Snippet runs once (not both WPCode and theme).

## Content-Security-Policy (if the blog sends one)
- [ ] `frame-src https://app.lodgify.com` (and `https://app.lodgifyintegration.com` on integration)
- [ ] `script-src` / `style-src`: nonce or `'unsafe-inline'` for the inline `<script>` and `<style>`
- [ ] `connect-src`/`script-src` for Rudder and OneTrust as on the Webflow site

## Optimisation plugins (WP Rocket, Autoptimize, Perfmatters, Cloudflare Rocket Loader)
- [ ] Exclude from **Delay JS until interaction**: WP Rocket → add keyword `lodgify-signup` (also `rudderanalytics` if analytics loads late). Otherwise the first click skips the modal and goes to `/signup`.
- [ ] Exclude from JS minify/combine/defer if the plugin ignores the script's `data-*` attributes.
- [ ] Iframe lazy-load: confirm `#lodgify-signup` isn't rewritten (`src` → `data-src`) in the rendered HTML.
- [ ] Page cache cleared after deploy. Test as logged-out user.

## Analytics (RudderStack)
- [ ] `window.rudderanalytics` exists on `/blog` (type it in the console). If not, events are silently dropped.
- [ ] Same write key / data plane as Webflow pages.
- [ ] Anonymous-ID cookie shared on `.lodgify.com` so blog → app.lodgify.com identity stitches.
- [ ] Open the modal and click a CTA: `clicked: signup initiated` / iframe `track` events appear with `signup_location` = `blog-*` (not `unknown`).

## OneTrust
- [ ] Blog loads the same OneTrust config (domain script ID) as Webflow.
- [ ] Rudder is consent-gated the same way (no events before consent, events after).

## Hosting / environments
- [ ] On production `lodgify.com/blog` (proxied under the main domain) the iframe's `frame-ancestors` / origin check passes.
- [ ] **Staging / preview domains (WP Engine, etc.)**: `EMBED_ORIGIN` falls through to **production** `app.lodgify.com`. Test signups create **real accounts** and the iframe may reject the origin. Use `*.lodgifyintegration.com` or don't submit.

## Locale
- [ ] `/blog/...`: first path segment `blog` is unsupported → falls back to `<html lang>`. OK for `en-US`.
- [ ] If translated (WPML/Polylang): `<html lang>` is set per language (`de-DE`, `es-ES`, …) or the language is the first path segment (`/de/blog/`).

## Visual / regression smoke test
- [ ] Open + close modal (×, Esc, backdrop click): page doesn't jump, scroll is locked while open, restored after.
- [ ] No horizontal scrollbar on blog pages; header/footer layout unchanged vs. before the snippet.
- [ ] Any other native `<dialog>` (newsletter popup, lightbox) still works and does **not** close on backdrop click unless it did before.
- [ ] × button looks right (32px circle, no shadow/uppercase/padding from the theme), keyboard focus ring visible.
- [ ] CTAs to `/signup` open the modal; `/signup/book-demo` links still navigate normally.
- [ ] Middle-click / open in new tab re-opens the modal on the new page and cleans `?open_signup=` from the URL.
- [ ] Block the iframe (offline/CSP) → after 5s the fallback "Continue to Lodgify signup" link appears.
