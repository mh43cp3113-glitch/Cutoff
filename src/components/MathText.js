import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../theme';
import katexStyle from '../vendor/katex/katexStyle';
import katexScript from '../vendor/katex/katexScript';
import autoRenderScript from '../vendor/katex/autoRenderScript';

// Plain strings never touch a WebView — that path is reserved for maths, since
// each WebView is an expensive instance and a question screen can hold five.

// KaTeX ships vendored (src/vendor/katex) instead of from a CDN, so maths
// renders with no network — see src/vendor/katex/README.md.

// Defensive: a literal "</script" inside injected content would close the
// tag early when spliced into the HTML string below.
const inlineScript = (js) => js.replace(/<\/script/gi, '<\\/script');

function buildHtml(body, fontSize, textColor) {
  const escaped = body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return `<!DOCTYPE html><html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<style>${katexStyle}</style>
<style>
  html,body{margin:0;padding:0;background:transparent;}
  #root{
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
    font-size:${fontSize}px;line-height:1.55;color:${textColor};
    padding:0;overflow-wrap:break-word;
  }
  .katex{font-size:1.05em;}
</style></head><body>
<div id="root">${escaped}</div>
<script>${inlineScript(katexScript)}</script>
<script>${inlineScript(autoRenderScript)}</script>
<script>
  function report(){
    var h = document.getElementById('root').getBoundingClientRect().height;
    window.ReactNativeWebView.postMessage(String(Math.ceil(h)));
  }
  window.addEventListener('load', function(){
    try{
      renderMathInElement(document.getElementById('root'), {
        delimiters:[
          {left:'$$',right:'$$',display:true},
          {left:'$',right:'$',display:false}
        ],
        throwOnError:false
      });
    }catch(e){}
    report();
    setTimeout(report, 250);
  });
</script></body></html>`;
}

export default function MathText({
  body,
  contentType = 'text',
  fontSize,
  textColor,
  style,
}) {
  const { color, type } = useTheme();
  const effectiveFontSize = fontSize ?? type.body.fontSize;
  const effectiveTextColor = textColor ?? color.ink;
  const [height, setHeight] = useState(effectiveFontSize * 1.6);

  const html = useMemo(
    () => buildHtml(body, effectiveFontSize, effectiveTextColor),
    [body, effectiveFontSize, effectiveTextColor]
  );

  if (contentType !== 'latex') {
    return (
      <Text style={[type.body, { fontSize: effectiveFontSize, color: effectiveTextColor }, style]}>
        {body}
      </Text>
    );
  }

  return (
    <View style={[{ height }, style]}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={{ backgroundColor: 'transparent', height }}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        androidLayerType="software"
        onMessage={(event) => {
          const next = Number(event.nativeEvent.data);
          if (next > 0 && Math.abs(next - height) > 1) setHeight(next);
        }}
      />
    </View>
  );
}
