import { html } from '../lib/html.mjs';

const miles = (n) => n.toLocaleString('es-AR');

// El club fuera de la cancha: socios y último balance aprobado.
export const club = ({ club: c }) =>
  c
    ? html`
<section id="club" class="wrap block" aria-labelledby="club-titulo">
  <h2 id="club-titulo" class="block__title">El club</h2>
  <div class="grid-2 grid-2--tight">
    <article class="card">
      <h3 class="card__label">Socios</h3>
      <p class="big">${miles(c.socios)}</p>
      ${c.sociosDetalle ? html`<p class="meta">${c.sociosDetalle}</p>` : ''}
    </article>
    <article class="card">
      <h3 class="card__label">Último balance</h3>
      <p class="meta">${c.balance.ejercicio}</p>
      <dl class="kv">
        ${c.balance.datos.map((d) => html`<div><dt>${d.dato}</dt><dd>${d.valor}</dd></div>`)}
      </dl>
      ${c.balance.aprobado ? html`<p class="meta">${c.balance.aprobado}</p>` : ''}
      ${c.balance.fuente ? html`<p class="meta">Fuente: <a href="${c.balance.fuente.url}" rel="noopener">${c.balance.fuente.nombre}</a></p>` : ''}
    </article>
  </div>
</section>`
    : '';
