import { html } from '../lib/html.mjs';

const signo = (n) => (n > 0 ? `+${n}` : String(n));

const resumen = (posiciones = []) =>
  posiciones.length
    ? html`<ul class="pos">${posiciones.map(
        (p) => html`<li class="pos__item"><span class="pos__num">${p.puesto}°</span><span class="pos__tabla">${p.tabla}</span><span class="pos__det">${p.detalle}</span></li>`
      )}</ul>`
    : '';

export const tabla = ({ tabla: tb, posiciones }, { t }) => html`
<section id="tabla" class="wrap block" aria-labelledby="tabla-titulo">
  <h2 id="tabla-titulo" class="block__title">${t.posiciones}</h2>
  ${resumen(posiciones)}
  <div class="card card--flush">
    <table class="table">
      <caption>${tb.nombre}</caption>
      <thead>
        <tr><th scope="col">#</th><th scope="col">${t.tabla.equipo}</th><th scope="col"><abbr title="${t.tabla.pjLargo}">${t.tabla.pj}</abbr></th><th scope="col"><abbr title="${t.tabla.dgLargo}">${t.tabla.dg}</abbr></th><th scope="col"><abbr title="${t.tabla.ptsLargo}">${t.tabla.pts}</abbr></th></tr>
      </thead>
      <tbody>
        ${tb.filas.map((fila, i) => {
          const clases = [fila.propio && 'is-propio', tb.clasifican === i + 1 && 'is-corte'].filter(Boolean).join(' ');
          return html`<tr${clases ? html` class="${clases}"` : ''}${fila.propio ? html` aria-current="true"` : ''}><td>${i + 1}</td><th scope="row">${fila.equipo}</th><td>${fila.pj}</td><td>${signo(fila.dg)}</td><td class="pts">${fila.pts}</td></tr>`;
        })}
      </tbody>
    </table>
    ${tb.clasifican ? html`<p class="table__nota">${t.tabla.clasifican(tb.clasifican)}</p>` : ''}
  </div>
</section>`;
