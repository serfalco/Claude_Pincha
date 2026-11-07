import { html } from '../lib/html.mjs';
import { fechas } from '../lib/fechas.mjs';
import { header } from '../components/header.mjs';
import { footer } from '../components/footer.mjs';

// Página de un día del historial: /dia/AAAA-MM-DD/ (y /en/dia/..., /pt/dia/...).
// dia = contenido de data/dias/AAAA-MM-DD.json; nav = { anterior, siguiente, todos } con rutas ya resueltas.
const fechaLarga = (dia, t) =>
  new Intl.DateTimeFormat(t.locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${dia}T12:00:00Z`));

export default (ctx, dia, nav) => {
  const { site, t } = ctx;
  const f = fechas(t.locale);
  const lang = t.lang;
  const tx = (o) => (o ? o[lang] ?? o[site.idiomas[0]] : undefined);
  const larga = fechaLarga(dia.fecha, t);
  const titular = tx(dia.titular);
  const u = dia.ultimo;
  const ultimoDelDia = u && f.corta(u.fecha) === f.corta(`${dia.fecha}T12:00:00-03:00`);
  return {
    title: t.dia.title(larga),
    description: t.dia.descripcion(larga),
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: t.dia.title(larga),
        inLanguage: t.locale,
        datePublished: dia.fecha,
        isPartOf: { '@type': 'WebSite', name: site.nombre, url: site.url },
      },
    ],
    body: html`
${header(ctx)}
<main>
  <section id="hoy" class="hoy" aria-labelledby="dia-titulo">
    <div class="wrap">
      <p class="kicker"><span class="dot" aria-hidden="true"></span>${t.dia.kicker} · <time datetime="${dia.fecha}">${larga}</time></p>
      <h1 id="dia-titulo" class="hoy__titular">${titular ?? t.dia.sinTitular}</h1>
      ${tx(dia.resumen) ? html`<p class="hoy__resumen">${tx(dia.resumen)}</p>` : ''}
      ${ultimoDelDia
        ? html`<p class="dia__resultado">${t.dia.ultimoResultado}: Estudiantes ${u.golesPropios} - ${u.golesRival} ${u.rival}</p>`
        : ''}
      <div class="linea">
        <ol class="linea__lista">
          ${dia.linea.map(
            (n) => html`<li class="linea__item">
            <time class="linea__hora" datetime="${n.hora}">${f.hora(n.hora)}</time>
            <p class="linea__texto">${n.url ? html`<a href="${n.url}" rel="noopener">${tx(n.texto)}</a>` : tx(n.texto)} <span class="linea__fuente">${n.fuente === 'Club' ? t.menu.club : n.fuente}</span></p>
          </li>`
          )}
        </ol>
      </div>
    </div>
  </section>
  <nav class="wrap dia__nav" aria-label="${t.dia.todos}">
    ${nav.anterior ? html`<a href="${nav.anterior}">← ${t.dia.anterior}</a>` : html`<span></span>`}
    <a href="${nav.todos}">${t.dia.todos}</a>
    ${nav.siguiente ? html`<a href="${nav.siguiente}">${t.dia.siguiente} →</a>` : html`<span></span>`}
  </nav>
</main>
${footer({ actualizado: `${dia.fecha}T12:00:00-03:00` }, ctx)}`,
  };
};
