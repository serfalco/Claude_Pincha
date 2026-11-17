import { fechas } from '../lib/fechas.mjs';
import { html } from '../lib/html.mjs';
import { header } from '../components/header.mjs';
import { footer } from '../components/footer.mjs';
import { notipinchas } from '../components/hoy.mjs';

// /notipinchas/: las notas de los medios y del club de las últimas 72 h (hoy.linea). En la portada queda solo el link.
export default (ctx, data) => {
  const ctxF = { ...ctx, f: fechas(ctx.t.locale) };
  return {
    title: ctx.t.notipinchas.title,
    description: ctx.t.notipinchas.descripcion,
    jsonLd: [{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: ctx.t.lineaTitulo, inLanguage: ctx.t.locale }],
    body: html`
${header(ctxF)}
<main>
  ${notipinchas(data, ctxF)}
</main>
${footer(data, ctxF)}`,
  };
};
