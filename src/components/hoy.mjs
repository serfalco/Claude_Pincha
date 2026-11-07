import { html } from '../lib/html.mjs';

// "Lo último": lo que pasó hoy (y ayer a la noche), de lo más nuevo a lo más viejo. No es minuto a minuto.
const mismoDia = (a, b, f) => f.corta(a) === f.corta(b);
const linea = (items = [], actualizado, t, f, enlace) =>
  items.length
    ? html`<div class="linea">
  <h2 class="linea__titulo">${t.lineaTitulo}</h2>
  <ol class="linea__lista">
    ${items.map(
      (n) => html`<li class="linea__item">
      <time class="linea__hora" datetime="${n.hora}">${mismoDia(n.hora, actualizado, f) ? f.hora(n.hora) : t.ayer}</time>
      <p class="linea__texto">${n.url ? html`<a href="${n.url}" rel="noopener">${n.texto}</a>` : n.texto} <span class="linea__fuente">${n.fuente === 'Club' ? t.menu.club : n.fuente}</span></p>
    </li>`
    )}
  </ol>
  ${enlace ? html`<p class="linea__mas"><a href="${enlace}">${t.dia.verDia} →</a></p>` : ''}
</div>`
    : '';

// Bloque principal. En etapas futuras su contenido lo genera la IA; la forma de los datos no cambia.
export const hoy = ({ hoy, actualizado }, { t, f, enlaceDia }) => html`
<section id="hoy" class="hoy" aria-labelledby="hoy-titulo">
  <div class="wrap">
    <p class="kicker"><span class="dot" aria-hidden="true"></span>${t.hoyKicker} · <time datetime="${actualizado}">${f.larga(actualizado)}</time></p>
    <h1 id="hoy-titulo" class="hoy__titular">${hoy.titular}</h1>
    <p class="hoy__resumen">${hoy.resumen}</p>
    ${hoy.puntos?.length ? html`<ul class="hoy__puntos">${hoy.puntos.map((p) => html`<li>${p}</li>`)}</ul>` : ''}
    ${linea(hoy.linea, actualizado, t, f, enlaceDia)}
  </div>
</section>`;
