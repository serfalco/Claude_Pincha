import { html } from '../lib/html.mjs';

const signo = (n) => (n > 0 ? `+${n}` : String(n));

const resumen = (posiciones = []) =>
  posiciones.length
    ? html`<ul class="pos">${posiciones.map(
        (p) => html`<li class="pos__item"><span class="pos__num">${p.puesto}°</span><span class="pos__tabla">${p.tabla}</span><span class="pos__det">${p.detalle}</span></li>`
      )}</ul>`
    : '';

export const tabla = ({ tabla: t, posiciones }) => html`
<section id="tabla" class="wrap block" aria-labelledby="tabla-titulo">
  <h2 id="tabla-titulo" class="block__title">Posiciones</h2>
  ${resumen(posiciones)}
  <div class="card card--flush">
    <table class="table">
      <caption>${t.nombre}</caption>
      <thead>
        <tr><th scope="col">#</th><th scope="col">Equipo</th><th scope="col"><abbr title="Partidos jugados">PJ</abbr></th><th scope="col"><abbr title="Diferencia de gol">DG</abbr></th><th scope="col"><abbr title="Puntos">Pts</abbr></th></tr>
      </thead>
      <tbody>
        ${t.filas.map((f, i) => {
          const clases = [f.propio && 'is-propio', t.clasifican === i + 1 && 'is-corte'].filter(Boolean).join(' ');
          return html`<tr${clases ? html` class="${clases}"` : ''}${f.propio ? html` aria-current="true"` : ''}><td>${i + 1}</td><th scope="row">${f.equipo}</th><td>${f.pj}</td><td>${signo(f.dg)}</td><td class="pts">${f.pts}</td></tr>`;
        })}
      </tbody>
    </table>
    ${t.clasifican ? html`<p class="table__nota">Los primeros ${t.clasifican} pasan a octavos de final.</p>` : ''}
  </div>
</section>`;
