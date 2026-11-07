import { html } from '../lib/html.mjs';
import { fechaLarga, fechaCorta, horaCorta } from '../lib/fechas.mjs';
import { mascota, estadoPorResultado, ESTADOS } from './mascota.mjs';

const CONDICION = { local: 'Local', visitante: 'Visitante', neutral: 'Cancha neutral' };

const proximo = (p) => html`
<article class="card" aria-labelledby="prox-titulo">
  <h2 id="prox-titulo" class="card__label">Próximo partido</h2>
  <p class="match__rival">vs ${p.rival}</p>
  <p class="match__when">
    <time datetime="${p.fecha}">${fechaLarga(p.fecha)}</time>
    <span class="match__hora">${horaCorta(p.fecha)}</span>
  </p>
  <p class="meta">${p.torneo}${p.instancia ? ` · ${p.instancia}` : ''} · ${CONDICION[p.condicion]}</p>
  ${p.estadio ? html`<p class="meta">${p.estadio}</p>` : ''}
</article>`;

const ultimo = (u) => {
  const estado = estadoPorResultado(u.golesPropios, u.golesRival);
  const marcador = `Estudiantes ${u.golesPropios}, ${u.rival} ${u.golesRival}`;
  return html`
<article class="card card--mascota" aria-labelledby="ult-titulo">
  <div>
    <h2 id="ult-titulo" class="card__label">Último resultado</h2>
    <p class="match__rival">vs ${u.rival}</p>
    <p class="score" aria-label="${marcador}">
      <span class="score__num">${u.golesPropios}</span><span class="score__sep">-</span><span class="score__num">${u.golesRival}</span>
    </p>
    <p class="badge badge--${estado}">${ESTADOS[estado]}</p>
    <p class="meta"><time datetime="${u.fecha}">${fechaCorta(u.fecha)}</time> · ${u.torneo} · ${CONDICION[u.condicion]}</p>
  </div>
  ${mascota(estado)}
</article>`;
};

const agenda = (lista) =>
  lista.length
    ? html`
<section class="block" aria-labelledby="agenda-titulo">
  <h2 id="agenda-titulo" class="block__title">Próximos partidos</h2>
  <ol class="agenda">
    ${lista.map(
      (p) => html`<li class="agenda__item">
      <time class="agenda__fecha" datetime="${p.fecha}">${fechaCorta(p.fecha).split(' ').map((t) => html`<span>${t}</span>`)}<span class="agenda__hora">${horaCorta(p.fecha)}</span></time>
      <div>
        <p class="agenda__rival">vs ${p.rival}</p>
        <p class="meta">${p.torneo}${p.instancia ? ` · ${p.instancia}` : ''} · ${CONDICION[p.condicion]}</p>
        ${p.estadio ? html`<p class="meta">${p.estadio}</p>` : ''}
      </div>
    </li>`
    )}
  </ol>
</section>`
    : '';

export const partidos = ({ proximos, ultimo: u }) => html`
<section id="partidos" class="wrap" aria-label="Partidos">
  <div class="grid-2">
    ${proximo(proximos[0])}
    ${ultimo(u)}
  </div>
  ${agenda(proximos.slice(1))}
</section>`;
