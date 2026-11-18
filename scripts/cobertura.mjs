// Cobertura por RSS: junta lo que publican el club y los medios sobre Estudiantes, sin dependencias.
// Uso: npm run cobertura [-- --horas 72]
// Salida: cobertura/ultimas.json (no se publica) + resumen en consola.
// La actualización automática arranca por acá: el club manda, los medios confirman.
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// local: medio de La Plata; ahí "Estudiantes" a secas ya es el Pincha.
const gnews = (id, nombre, q, local = false) => ({
  id, nombre, tipo: 'medio', filtrar: true, agregador: true, local,
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
  // El RSS propio de El Día se queda trabado días enteros (noviembre 2026): Google Noticias lo cubre igual.
  gnews('eldia-gn', 'El Día', 'site:eldia.com+Estudiantes', true),
  // Entradas y socios aparte: en la búsqueda general quedan tapadas por las notas del partido, y ahí es donde
  // más cambia el estado (una venta que se agota en minutos).
  gnews('entradas-gn', 'Google Noticias', 'Estudiantes+(entradas+OR+plateas+OR+agotadas+OR+socios)'),
  gnews('infocielo', 'Infocielo', 'site:infocielo.com+Estudiantes', true),
  gnews('diariohoy', 'Diario Hoy', 'site:diariohoy.net+Estudiantes', true),
  gnews('ole', 'Olé', 'site:ole.com.ar+Estudiantes'),
  gnews('clarin', 'Clarín', 'site:clarin.com+Estudiantes'),
  gnews('perfil-gn', 'Perfil', 'site:perfil.com+Estudiantes'),
  gnews('lanacion-gn', 'La Nación', 'site:lanacion.com.ar+Estudiantes'),
  gnews('puntocapital-gn', 'Punto Capital', 'site:puntocapitalnoticias.com+Estudiantes', true),
  gnews('tyc', 'TyC Sports', 'site:tycsports.com+Estudiantes'),
];

// Google Noticias firma algunos medios con otro nombre: se unifican para contar bien la variedad de fuentes.
const MEDIOS = { 'punto capital noticias': 'Punto Capital', 'la nacion': 'La Nación', 'clarin.com': 'Clarín', 'ole': 'Olé', 'diario el dia': 'El Día', 'diario el dia de la plata': 'El Día', 'eldia.com': 'El Día', 'tycsports.com': 'TyC Sports', 'perfil.com': 'Perfil' };
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

const esDelPincha = (n, local) => {
  const t = `${n.titulo} ${n.resumen}`;
  if (NO.test(t) && !SI.test(t)) return false;
  if (local && ESTUDIANTES.test(t)) return true;
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
    return { f, aviso, total: crudos.length, items: f.filtrar ? items.filter((n) => esDelPincha(n, f.local)) : items };
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

  await revisarVigencia(root, notas);

  for (const n of notas.slice(0, 15)) console.log(`${n.fecha.slice(5, 16).replace('T', ' ')}Z  ${n.tipo === 'club' ? '[CLUB]' : '      '}${n.socios ? '[SOCIOS]' : ''} ${n.titulo} — ${n.fuente}`);
};

// Revisar vigencia: cruza lo que hoy dice el sitio (las Siete y data/plantel.json) con las notas que
// cuentan un cambio de estado (se agotó, expulsado, suspendido, alta, lesión). No decide nada: avisa qué releer.
export const CAMBIO = /agotad|se agot|volaron|sin stock|sold out|esgotad|cerr[oó] la venta|suspendid|sancion|expulsad|expuls[oó]|tarjeta roja|\broja\b|se pierde|no podr[aá] (jugar|estar)|desgarr|lesi[oó]n|operad|alta m[eé]dica|recibi[oó] el alta|descartad|baja|reprogram|cambi[oó] (el )?horario|postergad|suspendi[oó]/i;
const VACIAS = new Set('estudiantes pincha final palmeiras copa libertadores para sobre desde hasta contra entre tiene puede luego todos todas porque donde cuando antes despues ademas segun clientes pierna'.split(' '));
const TEMAS = ['plateas', 'platea', 'entradas', 'entrada', 'venta', 'ventana', 'populares', 'socios', 'abono', 'pasajes', 'micros'];
const sinTildes = (x) => x.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const palabras = (x) => new Set(sinTildes(x).match(/[a-z]{5,}/g)?.filter((w) => !VACIAS.has(w)) ?? []);
const revisarVigencia = async (root, notas) => {
  const leer = (rel) => readFile(join(root, rel), 'utf8').then(JSON.parse, () => undefined);
  const [home, plantel] = await Promise.all([leer('data/home.json'), leer('data/plantel.json')]);
  const cambios = notas.filter((n) => CAMBIO.test(`${n.titulo} ${n.resumen ?? ''}`));
  const avisos = [];
  for (const [i, s] of (home?.hoy?.siete ?? []).entries()) {
    const claves = palabras(`${s.titulo} ${s.texto}`);
    // Pesan doble los nombres propios de la noticia y las palabras de entradas: con una sola alcanza.
    const fuertes = new Set([...(`${s.titulo} ${s.texto}`.match(/\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{4,}/g) ?? []).map(sinTildes), ...TEMAS]);
    for (const n of cambios) {
      const comunes = [...palabras(`${n.titulo} ${n.resumen ?? ''}`)].filter((w) => claves.has(w));
      const peso = comunes.reduce((a, w) => a + (fuertes.has(w) ? 2 : 1), 0);
      if (peso >= 2 && new Date(n.fecha) > new Date(home.actualizado) - 36 * 3600e3)
        avisos.push(`Siete n.º ${i + 1} "${s.titulo}" ↔ ${n.fecha.slice(5, 16).replace('T', ' ')}Z ${n.titulo} — ${n.fuente} (${comunes.slice(0, 4).join(', ')})`);
    }
  }
  for (const b of plantel?.bajas ?? []) {
    const nombres = (b.alias ?? [b.jugador]).map(sinTildes);
    for (const n of notas) {
      const t = sinTildes(`${n.titulo} ${n.resumen ?? ''}`);
      if (nombres.some((x) => t.includes(x))) avisos.push(`plantel: ${b.jugador} (${b.estado}) ↔ ${n.titulo} — ${n.fuente}`);
    }
  }
  const bajasNuevas = cambios.filter((n) => /suspendid|sancion|expuls|roja|se pierde|no podr[aá]/i.test(n.titulo));
  console.log(`Revisar vigencia (abrir la nota y confirmar antes de publicar):${avisos.length ? '' : ' nada que cruce con lo publicado'}`);
  [...new Set(avisos)].slice(0, 20).forEach((a) => console.log(`  ⚠ ${a}`));
  if (bajasNuevas.length) {
    console.log('Bajas o sanciones mencionadas en las notas (¿están en data/plantel.json?):');
    bajasNuevas.slice(0, 10).forEach((n) => console.log(`  · ${n.titulo} — ${n.fuente}`));
  }
  console.log(`En data/plantel.json: ${(plantel?.bajas ?? []).map((b) => `${b.jugador} (${b.equipo}, ${b.estado})`).join(' · ') || 'vacío'}\n`);
};

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
