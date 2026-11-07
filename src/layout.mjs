import { html, raw } from './lib/html.mjs';

// Documento base: todo el SEO técnico vive acá.
// alternates: [{ lang, href (absoluta), actual }] → hreflang + x-default para cada idioma.
export const layout = ({ site, t, title, description, url, alternates, css, jsonLd = [], body }) => {
  const ogImage = new URL('/og.png', site.url).href;
  const ld = JSON.stringify(jsonLd.length === 1 ? jsonLd[0] : jsonLd).replace(/</g, '\\u003c');
  const base = alternates[0];
  return html`<!doctype html>
<html lang="${t.locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${url}">
${alternates.map((a) => html`<link rel="alternate" hreflang="${a.lang}" href="${a.abs}">\n`)}<link rel="alternate" hreflang="x-default" href="${base.abs}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="theme-color" content="${site.colorTema}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:locale" content="${t.ogLocale}">
${alternates.filter((a) => !a.actual).map((a) => html`<meta property="og:locale:alternate" content="${a.ogLocale}">\n`)}<meta property="og:site_name" content="${site.nombre}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<style>${raw(css)}</style>
<script type="application/ld+json">${raw(ld)}</script>
</head>
<body>
<a class="skip" href="#hoy">${t.saltar}</a>
${body}
</body>
</html>
`;
};
