// Trae fotos nuevas de la web del club (API pública de WordPress) al banco imagenes/. Sin dependencias.
// Solo agrega: no borra ni pisa nada, y no publica nada (las fotos nuevas entran con "usos": []).
// Exclusividad del club: nunca trae fotos de notas con menos de "esperaDias" (imagenes/indice.json, 7 por defecto).
//
//   npm run fotos                     notas de hace 7 a 21 días (las de la última semana, nunca)
//   npm run fotos -- --dias 30        otro período
//   npm run fotos -- --prueba         muestra qué traería, sin descargar
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const API = 'https://estudiantesdelaplata.com/wp-json/wp/v2';
const UA = { 'user-agent': 'Mozilla/5.0 (compatible; ElPinchaHoy/1.0; +https://elpinchahoy.com.ar)' };

// Categorías de la web del club → carpeta del banco. La primera que coincida manda.
const CATEGORIAS = [
  [2, 'primera'], // futbol-profesional
  [313, 'estadio-uno'], // estadio
  [358, 'country-city-bell'], // countryclub
];
const POR_NOTA = 4; // máximo de fotos por nota (las del club suelen repetir la misma escena)
const ANCHO_MIN = 640; // más chicas no sirven para ningún formato (imagenes/formatos.json)

const arg = (n, def) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? def : process.argv[i + 1]; };
const dias = Number(arg('dias', 14));
const prueba = process.argv.includes('--prueba');
const existe = (p) => access(p).then(() => true, () => false);
const texto = (h = '') => h.replace(/<[^>]+>/g, ' ').replace(/&#8211;/g, '–').replace(/&#8220;|&#8221;/g, '"').replace(/&#82(16|17);/g, "'").replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const json = async (url) => {
  const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return { datos: await r.json(), paginas: Number(r.headers.get('x-wp-totalpages') ?? 1) };
};

// Notas del período en las categorías elegidas (todas las páginas).
const notas = async (desde, hasta) => {
  const out = [];
  for (let p = 1; ; p++) {
    const { datos, paginas } = await json(`${API}/posts?categories=${CATEGORIAS.map(([id]) => id).join(',')}&after=${desde}&before=${hasta}&per_page=50&page=${p}&_fields=id,date,slug,link,title,content,categories,featured_media`);
    out.push(...datos);
    if (p >= paginas) return out;
  }
};

// Fotos de una nota: la destacada, las del cuerpo (class="wp-image-ID") y las adjuntas. En orden de aparición.
const fotosDeNota = async (n) => {
  const ids = [...new Set([n.featured_media, ...[...(n.content?.rendered ?? '').matchAll(/wp-image-(\d+)/g)].map((m) => +m[1])].filter(Boolean))];
  const { datos: adjuntas } = await json(`${API}/media?parent=${n.id}&per_page=50&_fields=id`);
  for (const a of adjuntas) if (!ids.includes(a.id)) ids.push(a.id);
  if (!ids.length) return [];
  const { datos } = await json(`${API}/media?include=${ids.join(',')}&per_page=100&_fields=id,source_url,mime_type,caption,alt_text,media_details`);
  const porId = new Map(datos.map((m) => [m.id, m]));
  return ids.map((id) => porId.get(id)).filter(Boolean);
};

// Versión de 1024 px ("large") en JPG; si la original es más chica, la original.
const version = (m) => {
  const d = m.media_details ?? {};
  const g = d.sizes?.large;
  if (g?.mime_type === 'image/jpeg' || (g && /\.jpe?g$/i.test(g.source_url))) return { url: g.source_url, ancho: g.width, alto: g.height };
  if (/^image\/jpe?g$/.test(m.mime_type) && d.width && d.width <= 1024) return { url: m.source_url, ancho: d.width, alto: d.height };
  return null;
};

const main = async () => {
  const archivoIndice = join(root, 'imagenes/indice.json');
  const indice = JSON.parse(await readFile(archivoIndice, 'utf8'));
  const conocidas = new Set(indice.imagenes.flatMap((i) => [i.original, i.mediaId].filter(Boolean)));
  const espera = indice.esperaDias ?? 7;
  // La API compara en hora argentina (campo "date"): corte al inicio del día, hace `espera` días.
  const dia = (n) => new Date(Date.now() - 3 * 36e5 - n * 864e5).toISOString().slice(0, 10);
  const hasta = `${dia(espera - 1)}T00:00:00`;
  const desde = `${dia(espera + dias)}T00:00:00`;
  const lista = await notas(desde, hasta);
  console.log(`${lista.length} notas del club publicadas entre ${desde.slice(0, 10)} y ${dia(espera)} (primera, estadio, country; ${espera} días de exclusividad para el club)`);

  const nuevas = [];
  let omitidas = 0;
  for (const n of lista) {
    const carpeta = CATEGORIAS.find(([id]) => n.categories.includes(id))[1];
    const fecha = n.date.slice(0, 10);
    let k = 0;
    for (const m of await fotosDeNota(n)) {
      if (k >= POR_NOTA) break;
      const v = version(m);
      if (!v || v.ancho < ANCHO_MIN || conocidas.has(m.id) || conocidas.has(v.url)) { omitidas++; continue; }
      k++;
      // Nombre: AAAA-MM-DD_<nota>_<n>.jpg, sin pisar uno existente.
      let i = 1, id;
      do id = `${fecha}_${n.slug}_${i++}`; while (indice.imagenes.some((x) => x.id === id) || nuevas.some((x) => x.id === id));
      const credito = texto(m.caption?.rendered).replace(/^(foto|fotos|ph|crédito)\s*:?\s*/i, '') || null;
      nuevas.push({
        id, archivo: `${carpeta}/${id}.jpg`, categoria: carpeta, ancho: v.ancho, alto: v.alto,
        orientacion: v.alto > v.ancho ? 'vertical' : 'horizontal',
        nota: texto(n.title?.rendered), notaUrl: n.link, publicada: fecha, tomada: null,
        credito, original: v.url, mediaId: m.id, alt: texto(m.alt_text), usos: [],
      });
      conocidas.add(m.id);
    }
  }

  for (const x of nuevas) console.log(`${prueba ? '·' : '+'} ${x.archivo} (${x.ancho}×${x.alto})${x.credito ? ` · ${x.credito}` : ''}`);
  if (prueba || !nuevas.length) {
    console.log(`\n${nuevas.length} fotos nuevas${prueba ? ' (prueba: no se descargó nada)' : ''} · ${omitidas} ya estaban, son chicas o no son JPG`);
    return;
  }
  let ok = 0;
  for (const x of nuevas) {
    try {
      const r = await fetch(x.original, { headers: UA, signal: AbortSignal.timeout(30000) });
      if (!r.ok) throw new Error(r.status);
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf[0] !== 0xff || buf[1] !== 0xd8) throw new Error('no es JPG');
      const destino = join(root, 'imagenes', x.archivo);
      await mkdir(dirname(destino), { recursive: true });
      if (await existe(destino)) throw new Error('ya existe el archivo');
      await writeFile(destino, buf);
      indice.imagenes.push(x);
      ok++;
    } catch (e) {
      console.warn(`⚠ ${x.archivo}: ${e.message}`);
    }
  }
  indice.imagenes.sort((a, b) => a.categoria.localeCompare(b.categoria) || a.archivo.localeCompare(b.archivo));
  await writeFile(archivoIndice, `${JSON.stringify(indice, null, 2)}\n`);
  console.log(`\n✓ ${ok} fotos nuevas en imagenes/ · ${omitidas} omitidas · total ${indice.imagenes.length}`);
};

main().catch((e) => { console.error(`✗ ${e.message}`); process.exit(1); });
