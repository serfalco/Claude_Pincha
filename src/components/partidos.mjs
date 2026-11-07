import { html } from '../lib/html.mjs';
import { fechaLarga, fechaCorta, horaCorta } from '../lib/fechas.mjs';

const condicion = (local) => (local ? 'Local' : 'Visitante');

const resultado = (a, b) => (a > b ? ['G', 'Ganamos'] : a < b ? ['P', 'Perdimos'] : ['E', 'Empatamos']);

const proximo = (p) => html`
<article class="card" aria-labelledby="prox-titulo">
  <h2 id="prox-titulo" class="card__label">Próximo partido</h2>
  <p class="match__rival">vs ${p.rival}</p>
  <p class="match__when">
    <time datetime="${p.fecha}">${fechaLarga(p.fecha)}</time>
    <span class="match__hora">${horaCorta(p.fecha)}</span>
  </p>
  <p class="meta">${p.torneo}${p.instancia ? ` · ${p.instancia}` : ''} · ${condicion(p.local)}</p>
  ${p.estadio ? html`<p class="meta">${p.estadio}</p>` : ''}
</article>`;

const ultimo = (u) => {
  const [letra, texto] = resultado(u.golesPropios, u.golesRival);
  const marcador = u.local
    ? `Estudiantes ${u.golesPropios} - ${u.golesRival} ${u.rival}`
    : `${u.rival} ${u.golesRival} - ${u.golesPropios} Estudiantes`;
  return html`
<article class="card" aria-labelledby="ult-titulo">
  <h2 id="ult-titulo" class="card__label">Último resultado</h2>
  <p class="match__rival">vs ${u.rival}</p>
  <p class="score" aria-label="${marcador}">
    <span class="score__num">${u.golesPropios}</span><span class="score__sep">-</span><span class="score__num">${u.golesRival}</span>
    <span class="badge badge--${letra}">${texto}</span>
  </p>
  <p class="meta"><time datetime="${u.fecha}">${fechaCorta(u.fecha)}</time> · ${u.torneo} · ${condicion(u.local)}</p>
</article>`;
};

export const partidos = ({ proximo: p, ultimo: u }) => html`
<section id="partidos" class="wrap grid-2" aria-label="Partidos">
  ${proximo(p)}
  ${ultimo(u)}
</section>`;
