import { icono } from './iconos.mjs';
import { html } from '../lib/html.mjs';
import { foto } from './foto.mjs';

// "Notipinchas en los medios": las últimas novedades, de lo más nuevo a lo más viejo. En la portada no se dice
// ni la hora ni el día (no se rotula nada como "ayer"); la fecha queda en el <li> para máquinas y en la página del día.
// Hora 00:00 = el medio no publicó la hora real (lo usa la página del día).
export const sinHora = (iso) => /T00:00(:00)?(-03:00)?$/.test(iso);
// "El Pincha Hoy · Siete noticias pinchas": EL bloque de la portada (va primero; todo lo demás es yapa). Lo más importante del día, numerado, con la info ahí mismo (sin fuente ni links:
// se lee sin hacer clic). Las notas con fuente y link van debajo, en "Notipinchas en los medios".
export const siete = (items = [], t, nivel = 2) =>
  items.length
    ? html`<div class="siete">
  <h${nivel} class="siete__titulo"><span class="siete__marca">${t.sieteMarca}</span>${t.siete}</h${nivel}>
  <ol class="siete__lista">
    ${items.map((n) => html`<li class="siete__item"><h${nivel + 1} class="siete__que">${n.titulo}</h${nivel + 1}><p class="siete__info">${n.texto}</p></li>`)}
  </ol>
</div>`
    : '';

const linea = (items = [], actualizado, t, f, enlace) =>
  items.length
    ? html`<div class="linea" id="noticias">
  <h2 id="notipinchas-titulo" class="linea__titulo">${icono('diario')}${t.lineaTitulo}</h2>
  <ol class="linea__lista">
    ${items.map(
      (n) => html`<li class="linea__item linea__item--simple">
      <p class="linea__texto">${n.url ? html`<a href="${n.url}" rel="noopener">${n.texto}</a>` : n.texto} <span class="linea__fuente">${n.fuente === 'Club' ? t.menu.club : n.fuente}</span></p>
    </li>`
    )}
  </ol>
  ${enlace ? html`<p class="linea__mas"><a href="${enlace}">${t.dia.verDia} →</a></p>` : ''}
</div>`
    : '';

// Bloque principal. En etapas futuras su contenido lo genera la IA; la forma de los datos no cambia.
// Con hoy.foto, el titular va sobre la foto (no suma alto: la respuesta sigue arriba de todo).
export const hoy = ({ hoy, actualizado }, { t, f, enlaceDia }, destacado, vistazo) => {
  const cabeza = html`<p class="kicker"><span class="dot" aria-hidden="true"></span><time datetime="${actualizado}">${f.larga(actualizado)}</time></p>
    <h1 id="hoy-titulo" class="hoy__titular">${hoy.titular}</h1>`;
  return html`
<section id="hoy" class="hoy${hoy.foto ? ' hoy--foto' : ''}" aria-labelledby="hoy-titulo">
  <div class="wrap">
    ${hoy.foto
      ? html`<div class="hoy__portada">${foto(hoy.foto, 'hoy', { t, prioridad: true })}<div class="hoy__cabeza">${cabeza}</div></div>`
      : cabeza}
    ${hoy.siete?.length
      ? siete(hoy.siete, t)
      : hoy.puntos?.length ? html`<ul class="hoy__puntos">${hoy.puntos.map((p) => html`<li>${p}</li>`)}</ul>` : ''}
    ${vistazo ?? ''}
    ${destacado ?? ''}
  </div>
</section>`;
};

// "Notipinchas en los medios": bloque propio, debajo de El Club. Notas con fuente y link (hoy.linea).
export const notipinchas = ({ hoy, actualizado }, { t, f, enlaceDia }) =>
  hoy.linea?.length
    ? html`
<section class="wrap block notipinchas" aria-labelledby="notipinchas-titulo">
  ${linea(hoy.linea, actualizado, t, f, enlaceDia)}
</section>`
    : '';
