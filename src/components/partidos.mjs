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

// El próximo partido, el último resultado y el partido destacado (cuenta regresiva) ya están arriba,
// en la franja de Hoy: acá van solo los partidos que siguen. Si no hay más, el bloque no se muestra.
export const partidos = ({ proximos }, ctx) => {
  const resto = proximos.filter((p, i) => i > 0 && !p.destacado);
  return resto.length ? html`<div class="wrap">${agenda(resto, ctx)}</div>` : '';
};
