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
  // El club usa WordPress: su API trae el texto completo de cada nota (el RSS solo trae título y resumen).
  // Si la API falla, se cae al RSS.
  {
    id: 'club', nombre: 'Estudiantes de La Plata', tipo: 'club', filtrar: false, wp: true,
    url: 'https://estudiantesdelaplata.com/wp-json/wp/v2/posts?per_page=30&_fields=date_gmt,link,title,excerpt,content,categories',
    rss: 'https://estudiantesdelaplata.com/feed/',
  },
  { id: '0221', nombre: '0221', tipo: 'medio', url: 'https://www.0221.com.ar/rss/pages/estudiantes.xml', filtrar: false },
  { id: 'eldia', nombre: 'El Día', tipo: 'medio', url: 'https://www.eldia.com/rss/estudiantes', filtrar: false },
  { id: 'puntocapital', nombre: 'Punto Capital', tipo: 'medio', url: 'https://www.puntocapitalnoticias.com/feed/', filtrar: true },
  { id: 'perfil', nombre: 'Perfil', tipo: 'medio', url: 'https://www.perfil.com/feed/deportes', filtrar: true },
  { id: 'lanacion', nombre: 'La Nación', tipo: 'medio', url: 'https://www.lanacion.com.ar/arc/outboundfeeds/rss/category/deportes/futbol/', filtrar: true },
  { id: 'infobae', nombre: 'Infobae', tipo: 'medio', url: 'https://www.infobae.com/arc/outboundfeeds/rss/category/deportes/', filtrar: true },
  // Google Noticias suma a TyC, ESPN, DSports, Minuto Uno y otros sin RSS útil. El título trae " - Medio" al final.
  // Por sitio: medios que bloquean su RSS (Olé, Clarín: 403; Infocielo, Diario Hoy) y medios cuyo feed general
  // trae pocas notas y deja afuera las del Pincha (Perfil, La Nación, Punto Capital). Los feeds directos van
  // antes en la lista: si una nota aparece en los dos, queda el link original del medio.
  gnews('gnews', 'Google Noticias', '%22Estudiantes+de+La+Plata%22'),
  gnews('infocielo', 'Infocielo', 'site:infocielo.com+Estudiantes'),
  gnews('diariohoy', 'Diario Hoy', 'site:diariohoy.net+Estudiantes'),
  gnews('ole', 'Olé', 'site:ole.com.ar+Estudiantes'),
  gnews('clarin', 'Clarín', 'site:clarin.com+Estudiantes'),
  gnews('perfil-gn', 'Perfil', 'site:perfil.com+Estudiantes'),
  gnews('lanacion-gn', 'La Nación', 'site:lanacion.com.ar+Estudiantes'),
  gnews('puntocapital-gn', 'Punto Capital', 'site:puntocapitalnoticias.com+Estudiantes'),
  gnews('tyc', 'TyC Sports', 'site:tycsports.com+Estudiantes'),
];

// Google Noticias firma algunos medios con otro nombre: se unifican para contar bien la variedad de fuentes.
const MEDIOS = { 'punto capital noticias': 'Punto Capital', 'la nacion': 'La Nación', 'clarin.com': 'Clarín', 'ole': 'Olé', 'diario el dia': 'El Día', 'eldia.com': 'El Día', 'tycsports.com': 'TyC Sports', 'perfil.com': 'Perfil' };
const medio = (m) => MEDIOS[m.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()] ?? m;

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
    // Google Noticias indica el sitio del medio: sirve para buscar el link original (WebSearch con ese dominio).
    sitio: it.match(/<source[^>]*url="([^"]+)"/i)?.[1],
  }));

// Categorías del club que son de socios: Venta de Entradas, Socios, Abonos.
const CATEGORIAS_SOCIOS = [53, 230, 57];
const desdeWP = (posts) =>
  posts.map((p) => ({
    titulo: limpiar(p.title?.rendered),
    url: p.link,
    fecha: new Date(`${p.date_gmt}Z`),
    resumen: limpiar(p.excerpt?.rendered).slice(0, 280),
    texto: limpiar(p.content?.rendered).slice(0, 2000),
    socios: (p.categories ?? []).some((c) => CATEGORIAS_SOCIOS.includes(c)) || undefined,
  }));

const esDelPincha = (n) => {
  const t = `${n.titulo} ${n.resumen}`;
  if (NO.test(t) && !SI.test(t)) return false;
  return SI.test(t) || (ESTUDIANTES.test(n.titulo) && /la plata|libertadores|palmeiras|uno\b/i.test(t));
};

const clave = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, '').split(' ').filter((w) => w.length > 3).slice(0, 8).join(' ');

const bajar = async (url) => {
  const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; ElPinchaHoy/1.0; +https://elpinchahoy.com.ar)' }, signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
};

const leer = async (f) => {
  try {
    let crudos, aviso;
    if (f.wp) {
      try {
        crudos = desdeWP(JSON.parse(await bajar(f.url)));
      } catch (e) {
        aviso = `API falló (${e.message}), se usó el RSS`;
        crudos = parsear(await bajar(f.rss));
      }
    } else crudos = parsear(await bajar(f.url));
    let items = crudos.filter((n) => n.titulo && n.url && !Number.isNaN(n.fecha.getTime()));
    if (f.agregador) {
      items = items.map((n) => {
        const m = n.titulo.match(/^(.*) - ([^-]+)$/);
        return m ? { ...n, titulo: m[1].trim(), medio: medio(m[2].trim()) } : n;
      });
      // Lo que el club ya publica en su feed no hace falta repetirlo desde el agregador.
      items = items.filter((n) => !/estudiantes de la plata$/i.test(n.medio ?? ''));
    }
    return { f, aviso, total: crudos.length, items: f.filtrar ? items.filter(esDelPincha) : items };
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
      const nota = { ...n, fecha: n.fecha.toISOString(), fuente: n.medio ?? f.nombre, via: n.medio ? f.nombre : undefined, tipo: f.tipo, socios: n.socios ?? SOCIOS.test(`${n.titulo} ${n.resumen}`) };
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
  const estado = resultados.map(({ f, items, error, aviso, total }) => ({
    fuente: f.agregador && f.id !== 'gnews' ? `${f.nombre} (Google)` : f.nombre,
    ok: !error, notas: items.length, error, aviso, total,
    dedicado: !f.filtrar,
    ultima: items.reduce((m, n) => (n.fecha > m ? n.fecha : m), new Date(0)).toISOString(),
  }));
  await writeFile(out, JSON.stringify({ generado: new Date().toISOString(), horas, estado, notas }, null, 2));

  for (const e of estado) console.log(`${e.ok ? '✓' : '✗'} ${e.fuente.padEnd(24)} ${e.ok ? `${e.notas} notas` : e.error}`);
  console.log(`\n${notas.length} notas en las últimas ${horas} h (${notas.filter((n) => n.tipo === 'club').length} del club, ${notas.filter((n) => n.socios).length} de socios/entradas) → cobertura/ultimas.json\n`);
  const porFuente = Object.entries(notas.reduce((a, n) => ({ ...a, [n.fuente]: (a[n.fuente] ?? 0) + 1 }), {})).sort((a, b) => b[1] - a[1]);
  console.log(`Fuentes distintas: ${porFuente.length} → ${porFuente.slice(0, 12).map(([f, c]) => `${f} ${c}`).join(' · ')}\n`);
  // Salud: no hay historial entre corridas (cada una arranca de cero), así que se mira lo que se ve hoy.
  const horasDesde = (iso) => Math.round((Date.now() - new Date(iso)) / 3600e3);
  const alertas = estado.flatMap((e) => [
    ...(e.error ? [`✗ ${e.fuente}: ${e.error}`] : []),
    ...(e.aviso ? [`⚠ ${e.fuente}: ${e.aviso}`] : []),
    ...(e.ok && !e.total ? [`⚠ ${e.fuente}: el feed respondió vacío (¿cambió la URL?)`] : []),
    // Los feeds propios del Pincha (club, 0221, El Día) publican todos los días: 36 h sin nada es raro.
    ...(e.ok && e.total && e.dedicado && horasDesde(e.ultima) > 36 ? [`⚠ ${e.fuente}: última nota hace ${horasDesde(e.ultima)} h (¿feed trabado?)`] : []),
  ]);
  console.log(alertas.length ? `Salud de las fuentes:\n${alertas.map((a) => `  ${a}`).join('\n')}\n` : 'Salud de las fuentes: ✓ todas responden y los feeds propios están al día\n');

  for (const n of notas.slice(0, 15)) console.log(`${n.fecha.slice(5, 16).replace('T', ' ')}Z  ${n.tipo === 'club' ? '[CLUB]' : '      '}${n.socios ? '[SOCIOS]' : ''} ${n.titulo} — ${n.fuente}`);
};

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
