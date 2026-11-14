import { icono } from './iconos.mjs';
import { html } from '../lib/html.mjs';

// El club fuera de la cancha: campaña de socios, cantidad de socios y último balance aprobado.

// Avatar de la cita: la foto de `cita.foto` (archivo en public/, la carga el dueño del sitio) o, si no hay,
// las iniciales del autor ("Juan Sebastián Verón" → "JV").
const iniciales = (nombre) => {
  const p = nombre.trim().split(/\s+/);
  return (p[0][0] + (p.length > 1 ? p.at(-1)[0] : '')).toUpperCase();
};
// Un solo bloque de campaña: primero el mundo (globo y mística), después una plaquita con todos los números,
// y al final Verón con el único botón pegado a su cita. Lo demás (pasos, más info, compartir) queda plegado.
// Nombres para el globo (solo se ven al pasar el mouse): filiales del exterior en el orden de data/mundo.json,
// que es el orden de EXT en public/globo.js, y regiones de la Argentina por cantidad.
const etiquetas = (mundo) =>
  mundo
    ? JSON.stringify({
        ext: mundo.exterior.map((f) => f.ciudad),
        arg: Object.fromEntries(mundo.argentina.regiones.map((r) => [r.cantidad, `${r.region} · ${r.cantidad}`])),
      })
    : '';

const campania = (c, socios, { t, ruta, mundo }) => {
  const n = (x) => x.toLocaleString(t.locale);
  const m = c.mistica;
  const wa = c.sumar ? `https://wa.me/?text=${encodeURIComponent(`${c.sumar.compartir} ${c.url}`)}` : '';
  const cifras = [{ n: socios, t: t.socios }, { n: c.meta, t: t.campania.metaCorta }, ...(m?.cifras ?? [])];
  return html`
<article class="mistica">
  <a class="mistica__globo-link" href="${ruta('mundo')}" aria-label="${t.mundo.encontrar}"><img class="mistica__globo" data-etiquetas="${etiquetas(mundo)}" src="/globo-filiales.svg" width="640" height="640" alt="" loading="lazy" decoding="async"></a>
  <div class="mistica__texto">
    ${m ? html`
    ${m.kicker ? html`<p class="mistica__kicker">${m.kicker}</p>` : ''}
    <h3 class="mistica__titulo">${m.titulo}</h3>
    <p class="mistica__lema">${m.lema}</p>` : ''}
    <ul class="mistica__cifras">${cifras.map((x) => html`<li><b>${n(x.n)}</b><span>${x.t}</span></li>`)}</ul>
    <div class="mapa" data-boton="${t.mapa.boton}" data-cuenta="${t.mapa.cuenta}" data-gracias="${t.mapa.gracias}">
      <button class="mapa__btn" type="button" hidden>${icono('pin')}<span></span></button>
      <p class="mapa__nota" hidden>${t.mapa.nota}</p>
      <p class="mapa__cuenta" hidden><i aria-hidden="true"></i><span></span></p>
    </div>
    <p class="mistica__filial"><a href="${ruta('mundo')}">${t.mundo.encontrar} →</a></p>

    <div class="lider">
      <h3 class="lider__campania">${c.nombre}</h3>
      ${c.cita ? html`
      <figure class="cita">
        <figcaption class="cita__autor">
          <span class="cita__avatar" aria-hidden="true">${c.cita.foto
            ? html`<img src="${c.cita.foto}" alt="" width="56" height="56" loading="lazy" decoding="async">`
            : html`<span>${iniciales(c.cita.autor)}</span>`}</span>
          <span class="cita__quien"><strong>${c.cita.autor}</strong><span class="cita__via">${c.cita.via}</span></span>
        </figcaption>
        <blockquote lang="es"><p>${c.cita.texto}</p></blockquote>
        ${c.cita.traduccion ? html`<p class="cita__traduccion">${c.cita.traduccion}</p>` : ''}
      </figure>` : ''}
      <a class="btn lider__btn" href="${c.url}" rel="noopener">${t.campania.ctaGrande}</a>
      ${c.promesa ? html`<p class="lider__promesa">${c.promesa}</p>` : ''}
    </div>

    <details class="campania__ver">
      <summary>${t.campania.ver}</summary>
      ${t.campania.aviso ? html`<p>${t.campania.aviso}</p>` : ''}
      ${c.pasos?.length ? html`<ol class="campania__pasos">${c.pasos.map((p) => html`<li>${p}</li>`)}</ol>` : ''}
      <p class="campania__enlaces">
        ${c.info ? html`<a href="${c.info}" rel="noopener">${t.campania.info}</a>` : ''}
        ${wa ? html`<a href="${wa}" rel="noopener">${t.campania.compartir}</a>` : ''}
      </p>
    </details>
  </div>
  <script src="/globo.js" defer></script>
  <script src="/mapa.js" defer></script>
</article>`;
};

// Banner pegado abajo, en todas las páginas: Verón y el botón. En la portada aparece cuando el bloque de campaña
// ya quedó arriba (así nunca hay dos botones a la vista); en el resto, al pasar el primer bloque.
// Se puede cerrar y el cierre vale para toda la visita.
export const pegado = ({ campania: c, t }) =>
  c?.cita
    ? html`
<aside id="pegado" class="pegado" aria-label="${c.nombre}">
  <span class="cita__avatar" aria-hidden="true">${c.cita.foto
    ? html`<img src="${c.cita.foto}" alt="" width="44" height="44" loading="lazy" decoding="async">`
    : html`<span>${iniciales(c.cita.autor)}</span>`}</span>
  <p class="pegado__texto"><strong>${c.cita.autor}</strong><span>${c.nombre}</span></p>
  <a class="btn pegado__btn" href="${c.url}" rel="noopener">${t.campania.cta}</a>
  <button class="pegado__x" type="button" aria-label="${t.campania.cerrar}">×</button>
</aside>
<script>(()=>{const b=document.getElementById('pegado'),r=document.querySelector('.lider')||document.querySelector('main>:first-child');if(!b||!r||!('IntersectionObserver' in window))return;try{if(sessionStorage.getItem('pegado')==='0')return}catch{}const o=new IntersectionObserver(([e])=>b.classList.toggle('pegado--on',!e.isIntersecting&&e.boundingClientRect.bottom<0));o.observe(r);b.querySelector('button').onclick=()=>{o.disconnect();b.classList.remove('pegado--on');try{sessionStorage.setItem('pegado','0')}catch{}}})()</script>`
    : '';

// Campaña de socios: bloque propio, va arriba en la home (justo después de los partidos).
export const socio = ({ club: c }, ctx) =>
  c?.campania
    ? html`
<section id="club" class="wrap block" aria-labelledby="club-titulo">
  <h2 id="club-titulo" class="block__title">${icono('escudo')}${ctx.t.club}</h2>
  ${campania(c.campania, c.socios, ctx)}
  ${pegado(ctx)}
</section>`
    : '';

// Los números del club (socios y balance): al final de la home.
export const club = ({ club: c }, ctx) => {
  if (!c) return '';
  const { t } = ctx;
  return html`
<section${c.campania ? '' : html` id="club"`} class="wrap block" aria-label="${t.balance}">
  ${c.campania ? '' : html`<article class="card">
    <h3 class="card__label">${icono('persona')}${t.socios}</h3>
    <p class="big">${c.socios.toLocaleString(t.locale)}</p>
  </article>`}
    <article class="card">
      <h3 class="card__label">${icono('diario')}${t.balance}</h3>
      <p class="meta">${c.balance.ejercicio}</p>
      <dl class="kv">
        ${c.balance.datos.map((d) => html`<div><dt>${d.dato}</dt><dd>${d.valor}</dd></div>`)}
      </dl>
      ${c.balance.aprobado ? html`<p class="meta">${c.balance.aprobado}</p>` : ''}
      ${c.balance.fuente ? html`<p class="meta">${t.fuente}: <a href="${c.balance.fuente.url}" rel="noopener">${c.balance.fuente.nombre}</a></p>` : ''}
      ${c.sociosDetalle ? html`<p class="meta">${t.socios}: ${c.sociosDetalle}</p>` : ''}
    </article>
</section>`;
};
