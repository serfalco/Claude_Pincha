import { readFileSync, existsSync } from 'node:fs';
import { html } from '../lib/html.mjs';

// Foto del banco (imagenes/): <picture> con AVIF y JPG de respaldo, medidas fijas (sin saltos de diseño) y crédito.
// Los formatos (proporción, anchos, sizes) salen de imagenes/formatos.json; las versiones las genera scripts/imagenes.py.
const banco = new URL('../../imagenes/', import.meta.url);
const { formatos } = JSON.parse(readFileSync(new URL('formatos.json', banco), 'utf8'));
const banco_ = JSON.parse(readFileSync(new URL('indice.json', banco), 'utf8'));
const indice = new Map(banco_.imagenes.map((i) => [i.id, i]));
// Exclusividad del club: una foto se usa recién cuando pasaron esperaDias desde que la publicó.
const espera = banco_.esperaDias ?? 7;
const habilitada = (img) => img.publicada && Date.now() - Date.parse(`${img.publicada}T00:00:00-03:00`) >= espera * 864e5;

// Datos: { id, alt } (alt viene de home.json y se traduce como cualquier texto). uso: "hoy", "banda"…
// prioridad: true solo para la foto principal (se descarga primero); el resto se carga diferido.
export const foto = (dato, uso, { t, prioridad = false, clase = '' }) => {
  if (!dato?.id) return '';
  const img = indice.get(dato.id);
  const fmt = formatos[uso];
  if (!img) throw new Error(`Foto "${dato.id}": no está en imagenes/indice.json`);
  if (!habilitada(img)) throw new Error(`Foto "${dato.id}": el club la publicó el ${img.publicada}; se puede usar recién ${espera} días después (exclusividad del club)`);
  if (!fmt) throw new Error(`Foto "${dato.id}": formato desconocido "${uso}"`);
  if (!img.usos?.includes(uso)) throw new Error(`Foto "${dato.id}": falta "${uso}" en sus usos (indice.json) y correr python3 scripts/imagenes.py`);
  const anchos = fmt.anchos.filter((w) => existsSync(new URL(`web/${img.id}/${uso}-${w}.jpg`, banco)));
  if (!anchos.length) throw new Error(`Foto "${dato.id}": no hay versiones web; correr python3 scripts/imagenes.py`);
  const alt = dato.alt ?? img.alt;
  if (!alt?.trim()) throw new Error(`Foto "${dato.id}": falta alt`);
  const src = (w, ext) => `/img/${img.id}/${uso}-${w}.${ext}`;
  const set = (ext) => anchos.map((w) => `${src(w, ext)} ${w}w`).join(', ');
  const mayor = anchos.at(-1);
  return html`<figure class="foto foto--${uso}${clase ? ` ${clase}` : ''}">
  <picture>
    <source type="image/avif" srcset="${set('avif')}" sizes="${fmt.sizes}">
    <img src="${src(mayor, 'jpg')}" srcset="${set('jpg')}" sizes="${fmt.sizes}" width="${mayor}" height="${Math.round((mayor * fmt.alto) / fmt.ancho)}" alt="${alt}"${prioridad ? html` fetchpriority="high"` : html` loading="lazy"`} decoding="async">
  </picture>
  <figcaption class="foto__credito">${t.foto}: ${img.credito ?? 'Estudiantes de La Plata'}</figcaption>
</figure>`;
};
