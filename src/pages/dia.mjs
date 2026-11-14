import { html } from '../lib/html.mjs';
import { fechas } from '../lib/fechas.mjs';
import { header } from '../components/header.mjs';
import { footer } from '../components/footer.mjs';
import { pegado } from '../components/club.mjs';
import { sinHora, siete } from '../components/hoy.mjs';
import { foto } from '../components/foto.mjs';

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
  const fotoDia = dia.foto ? { id: dia.foto.id, alt: tx(dia.foto.alt) } : undefined;
  const ultimoDelDia = u && f.corta(u.fecha) === f.corta(`${dia.fecha}T12:00:00-03:00`);
  return {
    og: ctx.og,
    ogAlt: fotoDia?.alt,
    title: t.dia.title(larga),
    description: t.dia.descripcion(larga),
    jsonLd: [
      {
        // Cada día es una nota: ayuda a aparecer en búsquedas de noticias.
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: (titular ?? t.dia.title(larga)).slice(0, 110),
        description: tx(dia.resumen) ?? t.dia.descripcion(larga),
        inLanguage: t.locale,
        datePublished: dia.linea.at(-1)?.hora ?? `${dia.fecha}T08:00:00-03:00`,
        dateModified: dia.linea[0]?.hora ?? `${dia.fecha}T08:00:00-03:00`,
        image: [new URL(ctx.og ?? '/og.jpg', site.url).href],
        mainEntityOfPage: new URL(ctx.ruta(`dia/${dia.fecha}`), site.url).href,
        about: { '@type': 'SportsTeam', name: site.equipo },
        author: { '@type': 'Organization', name: site.nombre, url: site.url },
        publisher: { '@type': 'Organization', name: site.nombre, url: site.url, logo: { '@type': 'ImageObject', url: new URL('/apple-touch-icon.png', site.url).href } },
        isPartOf: { '@type': 'WebSite', name: site.nombre, url: site.url },
      },
    ],
    body: html`
${header(ctx)}
<main>
  <section id="hoy" class="hoy${fotoDia ? ' hoy--foto' : ''}" aria-labelledby="dia-titulo">
    <div class="wrap">
      ${(() => {
        const cabeza = html`<p class="kicker"><span class="dot" aria-hidden="true"></span>${t.dia.kicker} · <time datetime="${dia.fecha}">${larga}</time></p>
      <h1 id="dia-titulo" class="hoy__titular">${titular ?? t.dia.sinTitular}</h1>`;
        return fotoDia ? html`<div class="hoy__portada">${foto(fotoDia, 'hoy', { t, prioridad: true })}<div class="hoy__cabeza">${cabeza}</div></div>` : cabeza;
      })()}
      ${tx(dia.resumen) ? html`<p class="hoy__resumen">${tx(dia.resumen)}</p>` : ''}
      ${ultimoDelDia
        ? html`<p class="dia__resultado">${t.dia.ultimoResultado}: Estudiantes ${u.golesPropios} - ${u.golesRival} ${u.rival}</p>`
        : ''}
      ${dia.siete?.length ? siete(dia.siete.map((n) => ({ titulo: tx(n.titulo), texto: tx(n.texto) })), t) : ''}
      <div class="linea">
        <ol class="linea__lista">
          ${dia.linea.map(
            (n) => html`<li class="linea__item">
            <time class="linea__hora" datetime="${n.hora}">${sinHora(n.hora) ? '·' : f.hora(n.hora)}</time>
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
${pegado(ctx)}
${footer({ actualizado: `${dia.fecha}T12:00:00-03:00` }, ctx)}`,
  };
};
