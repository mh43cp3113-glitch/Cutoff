import React, { useEffect, useRef } from 'react';
import { Text } from 'react-native';
import { color, type } from '../theme';
import katexStyle from '../vendor/katex/katexStyle';
import katexScript from '../vendor/katex/katexScript';
import autoRenderScript from '../vendor/katex/autoRenderScript';

// Web build of MathText.
//
// On native (MathText.js) each formula is rendered inside a react-native-webview
// with a postMessage handshake to self-size. On web that component is just an
// <iframe>, and the handshake doesn't apply — so here KaTeX renders straight
// into the DOM instead. Same vendored KaTeX 0.16.9 assets as native, so there's
// still no network dependency.

let ready = false;

function ensureKatex() {
  if (ready || typeof document === 'undefined') return;
  ready = true;

  const style = document.createElement('style');
  style.textContent = katexStyle;
  document.head.appendChild(style);

  // The vendored scripts are UMD bundles. Run in global scope so their
  // `typeof exports` / `define.amd` probes both fail and they attach to
  // window (window.katex, then window.renderMathInElement). katex first —
  // auto-render reads window.katex.
  // eslint-disable-next-line no-new-func
  new Function(katexScript)();
  // eslint-disable-next-line no-new-func
  new Function(autoRenderScript)();
}

const DELIMITERS = [
  { left: '$$', right: '$$', display: true },
  { left: '$', right: '$', display: false },
];

export default function MathText({
  body,
  contentType = 'text',
  fontSize = type.body.fontSize,
  textColor = color.ink,
  style,
}) {
  const ref = useRef(null);

  useEffect(() => {
    if (contentType !== 'latex') return;
    ensureKatex();
    const el = ref.current;
    if (!el) return;
    el.textContent = body;
    try {
      if (window.renderMathInElement) {
        window.renderMathInElement(el, { delimiters: DELIMITERS, throwOnError: false });
        // Keep trailing punctuation glued to its formula, so a sentence-ending
        // "." after $…$ never wraps onto its own line.
        el.querySelectorAll('.katex').forEach((k) => {
          const next = k.nextSibling;
          if (next && next.nodeType === 3 && /^[.,;:!?)]/.test(next.textContent)) {
            const m = next.textContent.match(/^([.,;:!?)]+)([\s\S]*)$/);
            const wrap = document.createElement('span');
            wrap.style.whiteSpace = 'nowrap';
            k.parentNode.insertBefore(wrap, k);
            wrap.appendChild(k);
            wrap.appendChild(document.createTextNode(m[1]));
            next.textContent = m[2];
          }
        });
      }
    } catch (e) {
      // leave the raw text in place
    }
  }, [body, contentType]);

  if (contentType !== 'latex') {
    return (
      <Text style={[type.body, { fontSize, color: textColor }, style]}>{body}</Text>
    );
  }

  // A real DOM node so KaTeX can inject its markup. react-native-web renders
  // callers' style objects (margins only, here) as inline styles, so spread
  // them straight onto the element.
  return (
    <div
      ref={ref}
      style={{
        fontSize,
        lineHeight: 1.55,
        color: textColor,
        overflowWrap: 'break-word',
        fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
        ...(style || {}),
      }}
    >
      {body}
    </div>
  );
}
