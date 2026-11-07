import { html } from '../lib/html.mjs';

// Bloque principal. En etapas futuras su contenido lo genera la IA; la forma de los datos no cambia.
export const hoy = ({ hoy, actualizado }, { t, f }) => html`
<section id="hoy" class="hoy" aria-labelledby="hoy-titulo">
  <div class="wrap">
    <p class="kicker"><span class="dot" aria-hidden="true"></span>${t.hoyKicker} · <time datetime="${actualizado}">${f.larga(actualizado)}</time></p>
    <h1 id="hoy-titulo" class="hoy__titular">${hoy.titular}</h1>
    <p class="hoy__resumen">${hoy.resumen}</p>
    ${hoy.puntos?.length ? html`<ul class="hoy__puntos">${hoy.puntos.map((p) => html`<li>${p}</li>`)}</ul>` : ''}
  </div>
</section>`;
