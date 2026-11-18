import { icono } from './iconos.mjs';
import { html } from '../lib/html.mjs';
import { foto } from './foto.mjs';

// "Notipinchas en los medios": las últimas novedades, de lo más nuevo a lo más viejo. En la portada no se dice
// ni la hora ni el día (no se rotula nada como "ayer"); la fecha queda en el <li> para máquinas y en la página del día.
// Hora 00:00 = el medio no publicó la hora real (lo usa la página del día).
export const sinHora = (iso) => /T00:00(:00)?(-03:00)?$/.test(iso);
// "El Pincha Hoy · Siete noticias": EL bloque de la portada (va primero; todo lo demás es yapa). Lo más importante del día, numerado, con la info ahí mismo (sin fuente ni links:
// se lee sin hacer clic). Las notas con fuente y link van debajo, en "Notipinchas en los medios".
export const siete = (items = [], t, nivel = 2) =>
  items.length
    ? html`<div class="siete">
  <h${nivel} class="siete__titulo"><span class="siete__marca">${t.sieteMarca}</span>${t.siete}</h${nivel}>
  ${t.sieteLema ? html`<p class="siete__lema">${t.sieteLema}</p>` : ''}
  <ol class="siete__lista">
    ${items.map((n) => html`<li class="siete__item"><h${nivel + 1} class="siete__que">${n.titulo}</h${nivel + 1}><p class="siete__info">${n.texto}</p></li>`)}
  </ol>
</div>`
    : '';

const item = (n, t, hora) => html`<li class="linea__item linea__item--simple">
      <p class="linea__texto">${n.url ? html`<a href="${n.url}" rel="noopener">${n.texto}</a>` : n.texto}</p>
      <p class="linea__meta"><span class="linea__fuente">${n.fuente === 'Club' ? t.menu.club : n.fuente}</span>${hora ? html` · <time datetime="${n.hora}">${hora}</time>` : ''}</p>
    </li>`;

// Lista de notas. En la portada: las más nuevas, sin hora ni día (no se rotula nada como "ayer").
export const linea = (items = [], t, { titulo, max, mas } = {}) =>
  items.length
    ? html`<div class="linea" id="noticias">
  ${titulo ?? ''}
  <ol class="linea__lista">
    ${items.slice(0, max ?? items.length).map((n) => item(n, t))}
  </ol>
  ${mas ?? ''}
</div>`
    : '';

// Bloque principal. En etapas futuras su contenido lo genera la IA; la forma de los datos no cambia.
// Con hoy.foto, el titular va sobre la foto (no suma alto: la respuesta sigue arriba de todo).
export const hoy = ({ hoy, actualizado }, { t, f, ruta }, destacado, vistazo) => {
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
    ${hoy.linea?.length && ruta ? html`<p class="siete__mas"><a href="#noticias">${icono('diario')}${t.lineaTitulo} ↓</a></p>` : ''}
    ${vistazo ?? ''}
    ${destacado ?? ''}
  </div>
</section>`;
};

// "Notipinchas en los medios" en la portada: las 6 más nuevas y el link a la página con todas.
const EN_PORTADA = 6;
export const notipinchasPortada = ({ hoy }, { t, ruta }) =>
  hoy.linea?.length
    ? html`
<section class="wrap block notipinchas" aria-labelledby="notipinchas-titulo">
  ${linea(hoy.linea, t, {
    titulo: html`<h2 id="notipinchas-titulo" class="linea__titulo">${icono('diario')}${t.lineaTitulo}</h2>`,
    max: EN_PORTADA,
    mas: html`<p class="linea__mas"><a href="${ruta('notipinchas')}">${t.notipinchas.verTodas(hoy.linea.length)} →</a></p>`,
  })}
</section>`
    : '';

// Página /notipinchas/: todas las notas (72 h), agrupadas por día y con la hora de publicación (si el medio la da).
export const notipinchas = ({ hoy, actualizado }, { t, f, home, enlaceDia }) => {
  if (!hoy.linea?.length) return '';
  const dias = [];
  for (const n of hoy.linea) {
    const d = f.larga(n.hora);
    if (dias.at(-1)?.d !== d) dias.push({ d, iso: n.hora, notas: [] });
    dias.at(-1).notas.push(n);
  }
  return html`
<section class="wrap block notipinchas notipinchas--pagina" aria-labelledby="notipinchas-titulo">
  <p class="migas"><a href="${home}">El Pincha Hoy</a> › ${t.lineaTitulo}</p>
  <h1 id="notipinchas-titulo" class="linea__titulo">${icono('diario')}${t.lineaTitulo}</h1>
  <p class="notipinchas__lede">${t.notipinchas.lede}</p>
  <p class="notipinchas__act">${t.notipinchas.actualizado}: <time datetime="${actualizado}">${f.larga(actualizado)}, ${f.hora(actualizado)}</time></p>
  ${dias.map(({ d, iso, notas }) => html`<h2 class="notipinchas__dia"><time datetime="${iso.slice(0, 10)}">${d}</time></h2>
  <ol class="linea__lista">${notas.map((n) => item(n, t, sinHora(n.hora) ? '' : f.hora(n.hora)))}</ol>`)}
  <p class="linea__mas notipinchas__pie"><a href="${home}">← ${t.notipinchas.volver}</a>${enlaceDia ? html` · <a href="${enlaceDia}">${t.dia.todos}</a>` : ''}</p>
</section>`;
};
