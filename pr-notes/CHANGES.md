# Change log – WordPress build (lodgify.com/blog)

Source of truth for every change made relative to `index.html` (the Webflow build, **left untouched**).
Add a new entry at the bottom for every future change. Keep `embed.html` (annotated) and `embed.min.html` (production) in sync.

| # | Area | Change | Files |
|---|------|--------|-------|
| 001 | Setup | Created WP variants from `index.html` | embed.html, embed.min.html |
| 002 | CSS | Removed global `html{scrollbar-gutter:stable}` | both |
| 003 | CSS | Scoped dialog rules to `#demo-modal`; removed bare `dialog{}` and `body:has(dialog[open])` | both |
| 004 | JS/CSS | Scroll lock moved to JS (`body.lodgify-modal-open` + scrollbar-width padding) | both |
| 005 | JS | Backdrop-close bound to our dialog only (was every `<dialog>` on the page) | both |
| 006 | CSS/HTML | Prefixed generic class names and data attributes with `lodgify-` | both |
| 007 | CSS | Close button reset against theme `button` styles | both |
| 008 | JS | `sectionOf()` WordPress fallback (replaces `unknown`) | both |
| 009 | JS | Removed Webflow-only "signup origin" detection | both |
| 010 | JS | Init guards (missing markup, double injection) | both |
| 011 | HTML | Optimisation-plugin / lazy-load opt-out attributes | both |
| 012 | Docs | Install notes, deployment checklist | embed.html, wordpress-deployment-checklist.md |

---

## 001 – Created WP variants
- `embed.html`: annotated, readable. `embed.min.html`: minified (terser + clean-css), 3 lines + 1 header comment, **no blank lines** (wpautop splits on blank lines), ~9.5 KB vs 14.7 KB for `index.html`.
- Rebuild `embed.min.html` from `embed.html` after every change (build script lives outside the repo; any terser/clean-css pipeline works. Strip comments first, keep the `<script data-…>` attributes).

## 002 – Removed `html{scrollbar-gutter:stable}`
**Why:** it reserved a scrollbar gutter on the whole blog and changed the theme layout (and interacts with `100vw` elements causing horizontal scroll).
**Replaced by:** see 004.

## 003 – Scoped CSS to `#demo-modal`
- `dialog{…}` → `#demo-modal{…}`; `dialog::backdrop` → `#demo-modal::backdrop`.
- Added `#demo-modal:not([open]){display:none}` so a theme rule like `dialog{display:block}` can't show the closed modal.
- Added `color/font-family/line-height` on the dialog so theme typography doesn't change the fallback message.
- Iframe: added `max-width:none;margin:0` against theme `iframe{…}` rules.

## 004 – Scroll lock in JS
- Old: `body:has(dialog[open]){overflow:hidden}` matched **any** open dialog on the page.
- New: `lockScroll()` / `unlockScroll()` add/remove `body.lodgify-modal-open` only for our dialog, and add `padding-right` equal to the scrollbar width (restored on close) so the page doesn't jump when the scrollbar disappears.
- Known limitation: `position:fixed` theme headers may shift by the scrollbar width (~15px) while open on desktop browsers with classic scrollbars. Cosmetic.

## 005 – Backdrop-close scoped
- Old: `document.querySelectorAll('dialog').forEach(… close on backdrop click)` – added behaviour to newsletter/lightbox dialogs.
- New: one click listener on `#demo-modal` handling both backdrop click and the close button.
- Old document-level `[data-modal-close]` handler removed (no longer catches foreign elements with that attribute).

## 006 – Prefixed names
| Old | New |
|-----|-----|
| `.modal-card` | `.lodgify-modal-card` |
| `.modal-scroll` / `[data-modal-scroll]` | `.lodgify-modal-scroll` / `[data-lodgify-scroll]` |
| `.modal-thumb` / `[data-modal-thumb]` | `.lodgify-modal-thumb` / `[data-lodgify-thumb]` |
| `.modal-loading` / `[data-modal-loading]` | `.lodgify-modal-loading` / `[data-lodgify-loading]` |
| `.modal-close` / `[data-modal-close]` | `.lodgify-modal-close` / `[data-lodgify-close]` |
| `.is-scrollable`, `.is-ready` | `.lodgify-is-scrollable`, `.lodgify-is-ready` |

Unchanged: `#demo-modal` (kept per request; rename to `#lodgify-signup-modal` if a collision is ever found), `#lodgify-signup`, `data-signup-href` (set on links only at runtime).

## 007 – Close button theme reset
Added `padding:0; box-shadow:none; text-transform:none;` plus `margin, min-height, letter-spacing, font-weight, text-shadow, text-decoration, appearance`, flex centering, hover/focus colour reset and a `:focus-visible` outline. Selector is `#demo-modal .lodgify-modal-close` (higher specificity than typical `button{}` / `button:hover{}` theme rules).

## 008 – `sectionOf()` fallback
**What `data-section` does:** `sectionOf(el)` walks up from the clicked CTA to the **outermost** ancestor with `data-section` and returns its value. That value is used for:
1. `signup_location` property on every Rudder event from the modal (`clicked: signup initiated` and anything the iframe tracks).
2. The `?open_signup=<value>` URL param, so "open in new tab" re-opens the modal with the same location.
It has no visual or functional effect otherwise. On WP nothing sets it, so every event would have been `unknown`.

**New fallback (only when no `data-section` ancestor exists):**
| CTA is inside | Value |
|---|---|
| `header`, `nav`, `[role=banner/navigation]` | `blog-header` |
| `footer`, `[role=contentinfo]` | `blog-footer` |
| `aside`, `[role=complementary]`, `.sidebar`, `.widget-area`, `.widget` | `blog-sidebar` |
| `article`, `.entry-content`, `.post-content`, `main`, `[role=main]` | `blog-content` |
| anything else | `blog` |

Explicit `data-section` still wins. Order matters: header/footer/sidebar are checked before content because themes often nest them inside `main`/`article`. **Verify against the real theme's markup** (e.g. an inline CTA inside a sidebar widget inside `main`).

## 009 – Removed Webflow-only origin logic
Removed: `ORIGINS`, `PRICING_PATHS`, `BF_OFFER_PATH_RE`, `PLP_PATH_RE`, `OPEN_ORIGIN_FLAG`, `normPath()`, `pageSignupOrigin()`, `data-signup-origin` support, the `open_signup_origin` URL param, the `signup_origin` iframe param, and `pending.signupOrigin` / `detail.origin` in the demo-survey events.
**Impact:** the iframe no longer receives `signup_origin`. Confirm with the app team that a missing `signup_origin` is acceptable for blog traffic (it was optional/`null` for non-pricing pages on Webflow too).
**Kept on purpose:**
- `origin=<location.origin>` iframe param – this is the host-origin handshake for postMessage, not the signup-origin concept.
- `EMBED_ORIGIN` (`app.lodgify.com` vs `app.lodgifyintegration.com`) – the postMessage security check.
- `lodgify-demo:*` events – Webflow demo survey hooks. Dead code on the blog (nothing dispatches them) but harmless; remove in a follow-up if desired.

## 010 – Init guards
- `if (!dialog || window.__lodgifySignupEmbed) return;` – no throw if the script runs before the markup, no double-binding if the snippet is injected twice (e.g. WPCode + theme).
- `e.target.closest` guarded for non-element click targets.

## 011 – Optimisation-plugin opt-outs
- `<script data-cfasync="false" data-no-optimize="1" data-no-defer="1" data-no-minify="1">`
- Iframe: `loading="eager" data-no-lazy="1" data-skip-lazy="1"`. Iframe `src` is only set by JS on first open, so lazy-load plugins have nothing to rewrite.
- Attributes are best-effort; keyword-based "Delay JS" lists still need `lodgify-signup` added (see checklist).

## 012 – Docs
- Header comment in `embed.html` with install, CSP and optimisation notes.
- `wordpress-deployment-checklist.md` for the environment checks that can't be fixed in code.

---
<!-- Add new entries above this line, increment the number, update the table at the top. -->
