import { icono } from './iconos.mjs';
import { html } from '../lib/html.mjs';

// El club fuera de la cancha: campaña de socios, cantidad de socios y último balance aprobado.

// Iniciales para el avatar de la cita ("Juan Sebastián Verón" → "JV"). Sin fotos: el avatar es un dibujo.
const iniciales = (nombre) => {
  const p = nombre.trim().split(/\s+/);
  return (p[0][0] + (p.length > 1 ? p.at(-1)[0] : '')).toUpperCase();
};
const campania = (c, socios, { t }) => {
  const pct = Math.min(100, Math.round((socios / c.meta) * 100));
  const n = (x) => x.toLocaleString(t.locale);
  const wa = c.sumar ? `https://wa.me/?text=${encodeURIComponent(`${c.sumar.compartir} ${c.url}`)}` : '';
  return html`
<article class="card campania">
  <h3 class="campania__titulo">${c.nombre}</h3>
  <p>${c.texto}</p>
  <div class="progreso" role="progressbar" aria-valuemin="0" aria-valuemax="${c.meta}" aria-valuenow="${socios}" aria-label="${t.socios}: ${n(socios)} / ${n(c.meta)}">
    <span style="width:${pct}%"></span>
  </div>
  <p class="progreso__leyenda"><strong>${n(socios)}</strong> · ${t.campania.meta(n(c.meta))} · ${pct}%</p>
  ${c.promesa ? html`<p class="meta">${c.promesa}</p>` : ''}
  <p class="campania__acciones">
    <a class="btn" href="${c.url}" rel="noopener">${t.campania.cta}</a>
    ${c.info ? html`<a class="link" href="${c.info}" rel="noopener">${t.campania.info}</a>` : ''}
  </p>

  ${c.cita ? html`
  <figure class="cita">
    <figcaption class="cita__autor">
      <span class="cita__avatar" aria-hidden="true"><span>${iniciales(c.cita.autor)}</span></span>
      <span class="cita__quien"><strong>${c.cita.autor}</strong><span class="cita__via">${c.cita.via}</span></span>
    </figcaption>
    <blockquote lang="es"><p>${c.cita.texto}</p></blockquote>
    ${c.cita.traduccion ? html`<p class="cita__traduccion">${c.cita.traduccion}</p>` : ''}
  </figure>` : ''}

  ${c.mistica ? html`
  <div class="mistica">
    <h4 class="mistica__titulo">${c.mistica.titulo}</h4>
    ${c.mistica.parrafos.map((p) => html`<p>${p}</p>`)}
    <p class="mistica__lema">${c.mistica.lema}</p>
  </div>` : ''}

  ${c.pasos?.length ? html`
  <h4 class="campania__sub">${t.campania.pasos}</h4>
  <ol class="campania__pasos">${c.pasos.map((p) => html`<li>${p}</li>`)}</ol>` : ''}

  ${c.cuotas ? html`
  <h4 class="campania__sub">${c.cuotas.titulo}</h4>
  <table class="table campania__cuotas">
    <tbody>${c.cuotas.filas.map((f) => html`<tr><th scope="row">${f.categoria}</th><td class="pts">${f.valor}</td></tr>`)}</tbody>
  </table>
  <p class="meta">${c.cuotas.vigencia}</p>` : ''}

  ${c.sumar ? html`
  <div class="campania__sumar">
    <h4 class="campania__sub">${c.sumar.titulo}</h4>
    <p>${c.sumar.texto}</p>
    <p class="campania__acciones">
      <a class="btn" href="${c.url}" rel="noopener">${t.campania.ctaGrande}</a>
      <a class="btn btn--wa" href="${wa}" rel="noopener">${t.campania.compartir}</a>
    </p>
  </div>` : ''}
</article>`;
};

export const club = ({ club: c }, ctx) => {
  if (!c) return '';
  const { t } = ctx;
  return html`
<section id="club" class="wrap block" aria-labelledby="club-titulo">
  <h2 id="club-titulo" class="block__title">${icono('escudo')}${t.club}</h2>
  ${c.campania ? campania(c.campania, c.socios, ctx) : ''}
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
