import { html } from '../lib/html.mjs';
import { mascota, estadoPorResultado } from './mascota.mjs';

const meta = (p, t) => `${p.torneo}${p.instancia ? ` · ${p.instancia}` : ''} · ${t.condicion[p.condicion]}`;

const proximo = (p, { t, f }) => html`
<article class="card" aria-labelledby="prox-titulo">
  <h2 id="prox-titulo" class="card__label">${t.proximo}</h2>
  <p class="match__rival">${t.vs} ${p.rival}</p>
  <p class="match__when">
    <time datetime="${p.fecha}">${f.larga(p.fecha)}</time>
    <span class="match__hora">${f.hora(p.fecha)}</span>
  </p>
  <p class="meta">${meta(p, t)}</p>
  ${p.estadio ? html`<p class="meta">${p.estadio}</p>` : ''}
</article>`;

const ultimo = (u, { t, f }) => {
  const estado = estadoPorResultado(u.golesPropios, u.golesRival);
  return html`
<article class="card card--mascota" aria-labelledby="ult-titulo">
  <div>
    <h2 id="ult-titulo" class="card__label">${t.ultimo}</h2>
    <p class="match__rival">${t.vs} ${u.rival}</p>
    <p class="score" aria-label="Estudiantes ${u.golesPropios}, ${u.rival} ${u.golesRival}">
      <span class="score__num">${u.golesPropios}</span><span class="score__sep">-</span><span class="score__num">${u.golesRival}</span>
    </p>
    <p class="badge badge--${estado}">${t.estados[estado]}</p>
    <p class="meta"><time datetime="${u.fecha}">${f.corta(u.fecha)}</time> · ${u.torneo} · ${t.condicion[u.condicion]}</p>
  </div>
  ${mascota(estado, t.estados[estado])}
</article>`;
};

const agenda = (lista, { t, f }) =>
  lista.length
    ? html`
<section class="block" aria-labelledby="agenda-titulo">
  <h2 id="agenda-titulo" class="block__title">${t.proximos}</h2>
  <ol class="agenda">
    ${lista.map(
      (p) => html`<li class="agenda__item">
      <time class="agenda__fecha" datetime="${p.fecha}"><span>${f.dia(p.fecha)}</span><span>${f.mes(p.fecha)}</span><span class="agenda__hora">${f.hora(p.fecha)}</span></time>
      <div>
        <p class="agenda__rival">${t.vs} ${p.rival}</p>
        <p class="meta">${meta(p, t)}</p>
        ${p.estadio ? html`<p class="meta">${p.estadio}</p>` : ''}
      </div>
    </li>`
    )}
  </ol>
</section>`
    : '';

export const partidos = ({ proximos, ultimo: u }, ctx) => html`
<section id="partidos" class="wrap" aria-label="${ctx.t.menu.partidos}">
  <div class="grid-2">
    ${proximo(proximos[0], ctx)}
    ${ultimo(u, ctx)}
  </div>
  ${agenda(proximos.slice(1), ctx)}
</section>`;
