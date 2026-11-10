import { icono } from './iconos.mjs';
import { html } from '../lib/html.mjs';

const signo = (n) => (n > 0 ? `+${n}` : String(n));

const resumen = (posiciones = []) =>
  posiciones.length
    ? html`<ul class="pos">${posiciones.map(
        (p) => html`<li class="pos__item"><span class="pos__num">${p.puesto}°</span><span class="pos__tabla">${p.tabla}</span><span class="pos__det">${p.detalle}</span></li>`
      )}</ul>`
    : '';

const cabecera = (t) =>
  html`<thead><tr><th scope="col">#</th><th scope="col">${t.tabla.equipo}</th><th scope="col"><abbr title="${t.tabla.pjLargo}">${t.tabla.pj}</abbr></th><th scope="col"><abbr title="${t.tabla.dgLargo}">${t.tabla.dg}</abbr></th><th scope="col"><abbr title="${t.tabla.ptsLargo}">${t.tabla.pts}</abbr></th></tr></thead>`;

const fila = (f, i, tb) => {
  const clases = [f.propio && 'is-propio', tb.clasifican === i + 1 && 'is-corte'].filter(Boolean).join(' ');
  return html`<tr${clases ? html` class="${clases}"` : ''}${f.propio ? html` aria-current="true"` : ''}><td>${i + 1}</td><th scope="row">${f.equipo}</th><td>${f.pj}</td><td>${signo(f.dg)}</td><td class="pts">${f.pts}</td></tr>`;
};

// Tabla plegable sin JavaScript (<details>): cerrada muestra solo al Pincha en su puesto; abierta, la tabla completa.
export const tabla = ({ tabla: tb, posiciones }, { t }) => {
  const i = tb.filas.findIndex((f) => f.propio);
  return html`
<section id="tabla" class="wrap block" aria-labelledby="tabla-titulo">
  <h2 id="tabla-titulo" class="block__title">${icono('tabla')}${t.posiciones}</h2>
  ${resumen(posiciones)}
  <details class="card card--flush tabla">
    <summary class="tabla__resumen">
      <span class="tabla__nombre">${tb.nombre}</span>
      ${i >= 0 ? html`<table class="table tabla__mini" aria-hidden="true">${cabecera(t)}<tbody>${fila(tb.filas[i], i, {})}</tbody></table>` : ''}
      <span class="tabla__toggle"><span class="tabla__ver">${t.tabla.ver(tb.filas.length)}</span><span class="tabla__ocultar">${t.tabla.ocultar}</span></span>
    </summary>
    <table class="table">
      <caption class="visually-hidden">${tb.nombre}</caption>
      ${cabecera(t)}
      <tbody>${tb.filas.map((f, j) => fila(f, j, tb))}</tbody>
    </table>
    ${tb.clasifican ? html`<p class="table__nota">${t.tabla.clasifican(tb.clasifican)}</p>` : ''}
  </details>
</section>`;
};
