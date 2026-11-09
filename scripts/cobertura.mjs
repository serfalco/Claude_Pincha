// Cobertura por RSS: junta lo que publican el club y los medios sobre Estudiantes, sin dependencias.
// Uso: npm run cobertura [-- --horas 72]
// Salida: cobertura/ultimas.json (no se publica) + resumen en consola.
// La actualización automática arranca por acá: el club manda, los medios confirman.
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const gnews = (id, nombre, q) => ({
  id, nombre, tipo: 'medio', filtrar: true, agregador: true,
  url: `https://news.google.com/rss/search?q=${q}+when:3d&hl=es-419&gl=AR&ceid=AR:es-419`,
});

// tipo: 'club' (oficial) | 'medio'. filtrar: true si el feed es general y hay que quedarse con lo del Pincha.
export const FUENTES = [
  { id: 'club', nombre: 'Estudiantes de La Plata', tipo: 'club', url: 'https://estudiantesdelaplata.com/feed/', filtrar: false },
  { id: '0221', nombre: '0221', tipo: 'medio', url: 'https://www.0221.com.ar/rss/pages/estudiantes.xml', filtrar: false },
  { id: 'eldia', nombre: 'El Día', tipo: 'medio', url: 'https://www.eldia.com/rss/estudiantes', filtrar: false },
  { id: 'puntocapital', nombre: 'Punto Capital', tipo: 'medio', url: 'https://www.puntocapitalnoticias.com/feed/', filtrar: true },
  { id: 'ole', nombre: 'Olé', tipo: 'medio', url: 'https://www.ole.com.ar/rss/futbol-primera/', filtrar: true },
  { id: 'perfil', nombre: 'Perfil', tipo: 'medio', url: 'https://www.perfil.com/feed/deportes', filtrar: true },
  { id: 'clarin', nombre: 'Clarín', tipo: 'medio', url: 'https://www.clarin.com/rss/deportes/', filtrar: true },
  { id: 'lanacion', nombre: 'La Nación', tipo: 'medio', url: 'https://www.lanacion.com.ar/arc/outboundfeeds/rss/category/deportes/futbol/', filtrar: true },
  { id: 'infobae', nombre: 'Infobae', tipo: 'medio', url: 'https://www.infobae.com/arc/outboundfeeds/rss/category/deportes/', filtrar: true },
  // Google Noticias suma a TyC, ESPN, DSports, Minuto Uno y otros sin RSS útil. El título trae " - Medio" al final.
  // Infocielo y Diario Hoy (La Plata) bloquean su RSS: se leen por Google Noticias filtrando por sitio.
  gnews('gnews', 'Google Noticias', '%22Estudiantes+de+La+Plata%22'),
  gnews('infocielo', 'Infocielo', 'site:infocielo.com+Estudiantes'),
  gnews('diariohoy', 'Diario Hoy', 'site:diariohoy.net+Estudiantes'),
];

const SI = /\b(estudiantes de la plata|estudiantes lp|el pincha|los pinchas|pincharratas?|edlp|el le[oó]n)\b/i;
const ESTUDIANTES = /\bestudiantes\b/i;
// Otros "Estudiantes" que no son el nuestro.
const NO = /estudiantes de (r[ií]o cuarto|caseros|buenos aires|m[eé]rida)|estudiantes (universitarios|secundarios)|centro de estudiantes/i;
const SOCIOS = /\b(entradas?|ventanas?|ranking|socios?|abono|venta|populares|plateas|cuota|asamblea)\b/i;

// Algunos feeds (El Día) traen el CDATA escapado o como comentario: se normaliza antes de limpiar.
const limpiar = (s = '') =>
  s.replace(/&lt;!\[CDATA\[([\s\S]*?)\]\]&gt;/g, '$1').replace(/<!--\[CDATA\[([\s\S]*?)\]\]-->/g, '$1')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, ' ')
    .replace(/&(#\d+|#x[\da-f]+|amp|lt|gt|quot|apos|nbsp);/gi, (m, e) =>
      ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' })[e.toLowerCase()] ??
      String.fromCodePoint(e[1] === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)))
    .replace(/\s+/g, ' ').trim();

const campo = (xml, tag) => xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i'))?.[1];

export const parsear = (xml) =>
  [...xml.matchAll(/<item[\s>][\s\S]*?<\/item>/gi)].map(([it]) => ({
    titulo: limpiar(campo(it, 'title')),
    // Si <link> no está bien cerrado se usa el guid o la URL que sigue a <link>.
    url: limpiar(campo(it, 'link') ?? campo(it, 'guid') ?? it.match(/<link>\s*(https?:\/\/\S+?)\s*</i)?.[1]),
    fecha: new Date(limpiar(campo(it, 'pubDate') ?? campo(it, 'dc:date') ?? '')),
    resumen: limpiar(campo(it, 'description')).slice(0, 280),
  }));

const esDelPincha = (n) => {
  const t = `${n.titulo} ${n.resumen}`;
  if (NO.test(t) && !SI.test(t)) return false;
  return SI.test(t) || (ESTUDIANTES.test(n.titulo) && /la plata|libertadores|palmeiras|uno\b/i.test(t));
};

const clave = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, '').split(' ').filter((w) => w.length > 3).slice(0, 8).join(' ');

const leer = async (f) => {
  try {
    const r = await fetch(f.url, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; ElPinchaHoy/1.0; +https://elpinchahoy.com.ar)' }, signal: AbortSignal.timeout(15000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    let items = parsear(await r.text()).filter((n) => n.titulo && n.url && !Number.isNaN(n.fecha.getTime()));
    if (f.agregador) {
      items = items.map((n) => {
        const m = n.titulo.match(/^(.*) - ([^-]+)$/);
        return m ? { ...n, titulo: m[1].trim(), medio: m[2].trim() } : n;
      });
      // Lo que el club ya publica en su feed no hace falta repetirlo desde el agregador.
      items = items.filter((n) => !/estudiantes de la plata$/i.test(n.medio ?? ''));
    }
    return { f, items: f.filtrar ? items.filter(esDelPincha) : items };
  } catch (e) {
    return { f, error: e.message, items: [] };
  }
};

const main = async () => {
  const i = process.argv.indexOf('--horas');
  const horas = i > 0 ? Number(process.argv[i + 1]) : 72;
  const desde = Date.now() - horas * 3600e3;

  const resultados = await Promise.all(FUENTES.map(leer));
  const vistos = new Map();
  for (const { f, items } of resultados) {
    for (const n of items) {
      if (n.fecha.getTime() < desde) continue;
      const k = clave(n.titulo);
      const nota = { ...n, fecha: n.fecha.toISOString(), fuente: n.medio ?? f.nombre, via: n.medio ? f.nombre : undefined, tipo: f.tipo, socios: SOCIOS.test(`${n.titulo} ${n.resumen}`) };
      const prev = vistos.get(k);
      // Si dos fuentes cuentan lo mismo, queda la oficial (o la primera) y se anota la confirmación.
      if (prev) prev.confirman = [...new Set([...(prev.confirman ?? []), nota.fuente])];
      else vistos.set(k, nota);
    }
  }
  const notas = [...vistos.values()].sort((a, b) => b.fecha.localeCompare(a.fecha));

  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const out = join(root, 'cobertura', 'ultimas.json');
  await mkdir(dirname(out), { recursive: true });
  const estado = resultados.map(({ f, items, error }) => ({ fuente: f.nombre, ok: !error, notas: items.length, error }));
  await writeFile(out, JSON.stringify({ generado: new Date().toISOString(), horas, estado, notas }, null, 2));

  for (const e of estado) console.log(`${e.ok ? '✓' : '✗'} ${e.fuente.padEnd(24)} ${e.ok ? `${e.notas} notas` : e.error}`);
  console.log(`\n${notas.length} notas en las últimas ${horas} h (${notas.filter((n) => n.tipo === 'club').length} del club, ${notas.filter((n) => n.socios).length} de socios/entradas) → cobertura/ultimas.json\n`);
  const porFuente = Object.entries(notas.reduce((a, n) => ({ ...a, [n.fuente]: (a[n.fuente] ?? 0) + 1 }), {})).sort((a, b) => b[1] - a[1]);
  console.log(`Fuentes distintas: ${porFuente.length} → ${porFuente.slice(0, 12).map(([f, c]) => `${f} ${c}`).join(' · ')}\n`);
  for (const n of notas.slice(0, 15)) console.log(`${n.fecha.slice(5, 16).replace('T', ' ')}Z  ${n.tipo === 'club' ? '[CLUB]' : '      '}${n.socios ? '[SOCIOS]' : ''} ${n.titulo} — ${n.fuente}`);
};

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
