import { icono } from './iconos.mjs';
import { html } from '../lib/html.mjs';
import { foto } from './foto.mjs';

// El club fuera de la cancha: campaña de socios, cantidad de socios y último balance aprobado.

// Avatar de la cita: la foto de `cita.foto` (archivo en public/, la carga el dueño del sitio) o, si no hay,
// las iniciales del autor ("Juan Sebastián Verón" → "JV").
const iniciales = (nombre) => {
  const p = nombre.trim().split(/\s+/);
  return (p[0][0] + (p.length > 1 ? p.at(-1)[0] : '')).toUpperCase();
};
// Arriba (después de Hoy): la campaña compacta. Lo largo (mística, globo, "sumá a otro pincha") va al final, en el club.
const enlaces = (c, t) => ({
  wa: c.sumar ? `https://wa.me/?text=${encodeURIComponent(`${c.sumar.compartir} ${c.url}`)}` : '',
});
const pasos = (c, t) =>
  c.pasos?.length
    ? html`
    <details class="campania__ver">
      <summary>${t.campania.ver}</summary>
      ${t.campania.aviso ? html`<p class="meta">${t.campania.aviso}</p>` : ''}
      <ol class="campania__pasos">${c.pasos.map((p) => html`<li>${p}</li>`)}</ol>
    </details>`
    : '';

const campania = (c, socios, { t }) => {
  const pct = Math.min(100, Math.round((socios / c.meta) * 100));
  const n = (x) => x.toLocaleString(t.locale);
  const { wa } = enlaces(c, t);
  return html`
<article class="card campania">
  ${foto(c.foto, 'banda', { t, clase: 'campania__foto' })}
  <h3 class="campania__titulo">${c.nombre}</h3>
  <p>${c.texto}</p>
  <div class="progreso" role="progressbar" aria-valuemin="0" aria-valuemax="${c.meta}" aria-valuenow="${socios}" aria-label="${t.socios}: ${n(socios)} / ${n(c.meta)}">
    <span style="width:${pct}%"></span>
  </div>
  <p class="progreso__leyenda"><strong>${n(socios)}</strong> · ${t.campania.meta(n(c.meta))} · ${pct}%</p>
  ${c.promesa ? html`<p class="meta">${c.promesa}</p>` : ''}
  <p class="campania__acciones">
    <a class="btn" href="${c.url}" rel="noopener">${t.campania.cta}</a>
    ${wa ? html`<a class="btn btn--wa" href="${wa}" rel="noopener">${t.campania.compartir}</a>` : ''}
    ${c.info ? html`<a class="link" href="${c.info}" rel="noopener">${t.campania.info}</a>` : ''}
  </p>
  ${pasos(c, t)}

  ${c.cita ? html`
  <figure class="cita">
    <figcaption class="cita__autor">
      <span class="cita__avatar" aria-hidden="true">${c.cita.foto
        ? html`<img src="${c.cita.foto}" alt="" width="40" height="40" loading="lazy" decoding="async">`
        : html`<span>${iniciales(c.cita.autor)}</span>`}</span>
      <span class="cita__quien"><strong>${c.cita.autor}</strong><span class="cita__via">${c.cita.via}</span></span>
    </figcaption>
    <blockquote lang="es"><p>${c.cita.texto}</p></blockquote>
    ${c.cita.traduccion ? html`<p class="cita__traduccion">${c.cita.traduccion}</p>` : ''}
  </figure>` : ''}
</article>`;
};

// Al final, en el club: la mística y "sumá a otro pincha", con el mismo tono y los mismos textos de siempre.
const mistica = (c, { t }) => {
  if (!c?.mistica && !c?.sumar) return '';
  const { wa } = enlaces(c, t);
  return html`
<article class="card campania campania--mistica">
  ${c.mistica ? html`
  <div class="mistica">
    <img class="mistica__globo" src="/globo-filiales.svg" width="640" height="640" alt="" loading="lazy" decoding="async">
    <div class="mistica__texto">
      ${c.mistica.kicker ? html`<p class="mistica__kicker">${c.mistica.kicker}</p>` : ''}
      <h4 class="mistica__titulo">${c.mistica.titulo}</h4>
      ${c.mistica.parrafos.map((p, i) => html`<p class="${i === 0 ? 'mistica__lead' : i === c.mistica.parrafos.length - 1 ? 'mistica__em' : ''}">${p}</p>`)}
      <p class="mistica__lema">${c.mistica.lema}</p>
      <p class="mistica__accion"><a class="btn mistica__btn" href="${c.url}" rel="noopener">${t.campania.ctaGrande}</a></p>
      ${c.mistica.cifras?.length ? html`<ul class="mistica__cifras">${c.mistica.cifras.map((x) => html`<li><b>${x.n.toLocaleString(t.locale)}</b><span>${x.t}</span></li>`)}</ul>` : ''}
    </div>
    <script src="/globo.js" defer></script>
  </div>` : ''}

  ${c.sumar ? html`
  <div class="campania__sumar">
    <h4 class="campania__facil">${c.sumar.titulo}</h4>
    <p class="campania__acciones">
      <a class="btn" href="${c.url}" rel="noopener">${t.campania.ctaGrande}</a>
      <a class="btn btn--wa" href="${wa}" rel="noopener">${t.campania.compartir}</a>
    </p>
  </div>` : ''}
</article>`;
};

// Campaña de socios: bloque propio, va arriba en la home (justo después de Hoy).
export const socio = ({ club: c }, ctx) =>
  c?.campania
    ? html`
<section id="club" class="wrap block" aria-labelledby="club-titulo">
  <h2 id="club-titulo" class="block__title">${icono('escudo')}${ctx.t.club}</h2>
  ${campania(c.campania, c.socios, ctx)}
</section>`
    : '';

// Los números del club (socios y balance): al final de la home.
export const club = ({ club: c }, ctx) => {
  if (!c) return '';
  const { t } = ctx;
  return html`
<section${c.campania ? '' : html` id="club"`} class="wrap block" aria-label="${t.balance}">
  ${c.campania ? mistica(c.campania, ctx) : ''}
  <div class="grid-2 grid-2--tight">
    <article class="card">
      <h3 class="card__label">${icono('persona')}${t.socios}</h3>
      <p class="big">${c.socios.toLocaleString(t.locale)}</p>
      ${c.sociosDetalle ? html`<p class="meta">${c.sociosDetalle}</p>` : ''}
    </article>
    <article class="card">
      <h3 class="card__label">${icono('diario')}${t.balance}</h3>
      <p class="meta">${c.balance.ejercicio}</p>
      <dl class="kv">
        ${c.balance.datos.map((d) => html`<div><dt>${d.dato}</dt><dd>${d.valor}</dd></div>`)}
      </dl>
      ${c.balance.aprobado ? html`<p class="meta">${c.balance.aprobado}</p>` : ''}
      ${c.balance.fuente ? html`<p class="meta">${t.fuente}: <a href="${c.balance.fuente.url}" rel="noopener">${c.balance.fuente.nombre}</a></p>` : ''}
    </article>
  </div>
</section>`;
};
