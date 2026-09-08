# Vendored KaTeX

`katexScript.js`, `autoRenderScript.js`, and `katexStyle.js` are KaTeX 0.16.9
(`katex.min.js`, `contrib/auto-render.min.js`, `katex.min.css`) bundled as JS
modules that export the file contents as strings, with the CSS's `.woff2`
`@font-face` sources inlined as base64 `data:` URIs. `MathText.js` injects
these directly into the WebView's HTML instead of fetching them from a CDN,
so LaTeX renders offline.

The `.woff`/`.ttf` font fallbacks were dropped — WebView on both Android and
iOS supports `.woff2`, so they were dead weight.

To upgrade the KaTeX version: install the new `katex` npm package and rerun
the generator (see git history for `build_vendor.js`, or recreate it — it
just JSON-stringifies `dist/katex.min.js` / `dist/contrib/auto-render.min.js`
and rewrites `dist/katex.min.css`'s woff2 `url()` refs to base64 `data:`
URIs), then update the version note below and in `MathText.js`.

Vendored from `katex@0.16.9`. License: `LICENSE` in this directory (MIT).
