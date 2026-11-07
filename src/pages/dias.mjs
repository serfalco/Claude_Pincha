import { html } from '../lib/html.mjs';
import { header } from '../components/header.mjs';
import { footer } from '../components/footer.mjs';

// Índice del historial: /dias/ con todos los días, del más reciente al más viejo.
// lista = [{ dia, href }] con dia = contenido de data/dias/AAAA-MM-DD.json
export default (ctx, lista) => {
  const { site, t } = ctx;
  const tx = (o) => (o ? o[t.lang] ?? o[site.idiomas[0]] : undefined);
  const fecha = (d) =>
    new Intl.DateTimeFormat(t.locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${d}T12:00:00Z`));
  return {
    title: t.dias.title,
    description: t.dias.descripcion,
    jsonLd: [{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: t.dias.title, inLanguage: t.locale }],
    body: html`
${header(ctx)}
<main class="wrap block">
  <h1 class="dias__titulo">${t.dias.titulo}</h1>
  <ul class="news">
    ${lista.map(
      ({ dia, href }) => html`<li class="news__item">
      <a class="dias__link" href="${href}">
        <span class="meta"><time datetime="${dia.fecha}">${fecha(dia.fecha)}</time> · ${t.dias.hechos(dia.linea.length)}</span>
        <span class="news__title">${tx(dia.titular) ?? t.dia.sinTitular}</span>
      </a>
    </li>`
    )}
  </ul>
</main>
${footer({ actualizado: `${lista[0]?.dia.fecha ?? '2026-01-01'}T12:00:00-03:00` }, ctx)}`,
  };
};
