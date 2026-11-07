import { html } from '../lib/html.mjs';

const signo = (n) => (n > 0 ? `+${n}` : String(n));

export const tabla = ({ tabla: t }) => html`
<section id="tabla" class="wrap block" aria-labelledby="tabla-titulo">
  <h2 id="tabla-titulo" class="block__title">Tabla</h2>
  <div class="card card--flush">
    <table class="table">
      <caption>${t.nombre}</caption>
      <thead>
        <tr><th scope="col">#</th><th scope="col">Equipo</th><th scope="col"><abbr title="Partidos jugados">PJ</abbr></th><th scope="col"><abbr title="Diferencia de gol">DG</abbr></th><th scope="col"><abbr title="Puntos">Pts</abbr></th></tr>
      </thead>
      <tbody>
        ${t.filas.map(
          (f, i) => html`<tr${f.propio ? html` class="is-propio" aria-current="true"` : ''}><td>${i + 1}</td><th scope="row">${f.equipo}</th><td>${f.pj}</td><td>${signo(f.dg)}</td><td class="pts">${f.pts}</td></tr>`
        )}
      </tbody>
    </table>
  </div>
</section>`;
