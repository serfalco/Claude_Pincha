import { html } from '../lib/html.mjs';
import { fechaLarga } from '../lib/fechas.mjs';

// Bloque principal. En etapas futuras su contenido lo genera la IA; la forma de los datos no cambia.
export const hoy = ({ hoy, actualizado }) => html`
<section id="hoy" class="hoy" aria-labelledby="hoy-titulo">
  <div class="wrap">
    <p class="kicker"><span class="dot" aria-hidden="true"></span>Hoy en el Pincha · <time datetime="${actualizado}">${fechaLarga(actualizado)}</time></p>
    <h1 id="hoy-titulo" class="hoy__titular">${hoy.titular}</h1>
    <p class="hoy__resumen">${hoy.resumen}</p>
    ${hoy.puntos?.length ? html`<ul class="hoy__puntos">${hoy.puntos.map((p) => html`<li>${p}</li>`)}</ul>` : ''}
  </div>
</section>`;
