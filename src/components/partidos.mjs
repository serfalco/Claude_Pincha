import { icono } from './iconos.mjs';
import { html } from '../lib/html.mjs';

const meta = (p, t) => `${p.torneo}${p.instancia ? ` · ${p.instancia}` : ''} · ${t.condicion[p.condicion]}`;

const agenda = (lista, { t, f }) =>
  lista.length
    ? html`
<section class="block" aria-labelledby="agenda-titulo">
  <h2 id="agenda-titulo" class="block__title">${icono('calendario')}${t.proximos}</h2>
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

// El próximo partido y el último resultado ya están arriba, en la franja de Hoy:
// acá va solo la agenda completa, con el detalle (instancia, condición, estadio).
export const partidos = ({ proximos }, ctx) => html`
<section id="partidos" class="wrap" aria-label="${ctx.t.menu.partidos}">
  ${agenda(proximos, ctx)}
</section>`;
