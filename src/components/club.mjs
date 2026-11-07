import { html } from '../lib/html.mjs';

// El club fuera de la cancha: campaña de socios, cantidad de socios y último balance aprobado.
const campania = (c, socios, { t }) => {
  const pct = Math.min(100, Math.round((socios / c.meta) * 100));
  const n = (x) => x.toLocaleString(t.locale);
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
</article>`;
};

export const club = ({ club: c }, ctx) => {
  if (!c) return '';
  const { t } = ctx;
  return html`
<section id="club" class="wrap block" aria-labelledby="club-titulo">
  <h2 id="club-titulo" class="block__title">${t.club}</h2>
  ${c.campania ? campania(c.campania, c.socios, ctx) : ''}
  <div class="grid-2 grid-2--tight">
    <article class="card">
      <h3 class="card__label">${t.socios}</h3>
      <p class="big">${c.socios.toLocaleString(t.locale)}</p>
      ${c.sociosDetalle ? html`<p class="meta">${c.sociosDetalle}</p>` : ''}
    </article>
    <article class="card">
      <h3 class="card__label">${t.balance}</h3>
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
