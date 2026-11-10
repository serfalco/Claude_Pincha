// Datos estructurados: partidos y tabla desde fuentes que devuelven datos, no notas. Sin dependencias.
// Uso: npm run datos               → compara con data/home.json y muestra las diferencias
//      npm run datos -- --aplicar  → además escribe la tabla en data/home.json si las dos fuentes coinciden
// Salida: cobertura/datos.json (no se publica) + resumen en consola.
//
// Fuentes:
// - ESPN (API JSON pública, no oficial): calendario de todas las competencias y tabla de la Liga Profesional.
// - futbolargentino.com: tabla del torneo en curso (segunda fuente para la tabla).
// Los partidos salen de una sola fuente estructurada: la segunda sigue siendo el club o los medios (npm run cobertura).
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import site from '../site.config.mjs';

const ESPN_EQUIPO = 8; // Estudiantes de La Plata en ESPN
const ESPN = 'https://site.api.espn.com/apis';
const FUENTES = {
  calendario: `${ESPN}/site/v2/sports/soccer/all/teams/${ESPN_EQUIPO}/schedule`,
  fixture: `${ESPN}/site/v2/sports/soccer/all/teams/${ESPN_EQUIPO}/schedule?fixture=true`,
  tablaEspn: `${ESPN}/v2/sports/soccer/arg.1/standings`,
  tablaFA: 'https://www.futbolargentino.com/primera-division/clausura/tabla-de-posiciones',
};

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// ESPN rechaza (403) user-agents con URL: se usa uno corto que igual identifica al sitio.
const UA = 'Mozilla/5.0 (compatible; ElPinchaHoy/1.0)';
const traer = async (url, tipo = 'json') => {
  const r = await fetch(url, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`HTTP ${r.status} en ${new URL(url).hostname}`);
  return tipo === 'json' ? r.json() : r.text();
};

// Nombres de equipos: cada fuente los escribe distinto. Se llevan al nombre que usa el sitio.
const sinTildes = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const NOMBRES = [
  [/^estudiantes( de la plata| lp)?$/, 'Estudiantes'],
  [/^estudiantes (de )?(rio cuarto|rc)/, 'Estudiantes (RC)'],
  [/^gimnasia( y esgrima)? ?(\(m\)|\(mendoza\)|mendoza|de mendoza)/, 'Gimnasia (M)'],
  [/^gimnasia( y esgrima)? ?(la plata|lp)/, 'Gimnasia (LP)'],
  [/^talleres/, 'Talleres'],
  [/^instituto/, 'Instituto'],
  [/^union/, 'Unión'],
  [/^newell/, "Newell's"],
  [/^(deportivo |dep\. )?riestra/, 'Dep. Riestra'],
  [/^central cordoba|^c\. cordoba/, 'Central Córdoba'],
  [/^belgrano/, 'Belgrano'],
  [/^sarmiento/, 'Sarmiento'],
  [/^(independiente|ind\.) rivadavia/, 'Independiente Rivadavia'],
  [/^velez/, 'Vélez Sarsfield'],
  [/^racing/, 'Racing Club'],
  [/^def(ensa|\.) y jus/, 'Defensa y Justicia'],
  [/^atl(etico|\.)? tucuman/, 'Atlético Tucumán'],
  [/^barracas/, 'Barracas Central'],
  [/^argentinos/, 'Argentinos Juniors'],
];
export const nombre = (s = '') => {
  const n = sinTildes(s);
  return NOMBRES.find(([re]) => re.test(n))?.[1] ?? s.replace(/\s*\(.*\)$/, '').trim();
};

// ISO con hora argentina (-03:00), el formato de data/home.json.
const horaAR = (iso) => {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: site.zonaHoraria, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date(iso)).map((x) => [x.type, x.value])
  );
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:00-03:00`;
};

// Un partido de ESPN → { rival, fecha, torneo, condicion, golesPropios?, golesRival?, estado }
const partido = (e) => {
  const c = e.competitions[0];
  const propio = c.competitors.find((x) => String(x.team.id) === String(ESPN_EQUIPO));
  const rival = c.competitors.find((x) => x !== propio);
  const goles = (x) => (x.score == null ? undefined : Number(x.score.value ?? x.score.displayValue ?? x.score));
  return {
    rival: nombre(rival.team.displayName),
    fecha: horaAR(e.date),
    torneo: e.league?.name ?? e.seasonType?.name ?? '',
    condicion: c.neutralSite ? 'neutral' : propio.homeAway === 'home' ? 'local' : 'visitante',
    estadio: c.venue?.fullName,
    estado: c.status?.type?.name,
    golesPropios: goles(propio),
    golesRival: goles(rival),
  };
};

const tablaEspn = (j) => {
  const grupo = j.children.find((g) => g.standings.entries.some((e) => String(e.team.id) === String(ESPN_EQUIPO)));
  const stat = (e, n) => Number(e.stats.find((s) => s.name === n)?.value);
  return {
    nombre: grupo.name,
    filas: grupo.standings.entries
      .map((e) => ({ equipo: nombre(e.team.displayName), puesto: stat(e, 'rank'), pj: stat(e, 'gamesPlayed'), pts: stat(e, 'points'), dg: stat(e, 'pointDifferential') }))
      .sort((a, b) => a.puesto - b.puesto),
  };
};

// futbolargentino: una <table> por zona. Columnas: Pos, Pts, PJ, G, E, P, GF, GC, DG.
const tablaFA = (html) => {
  const zonas = html.split('<table').slice(1).map((t) =>
    [...t.matchAll(/<tr[\s\S]*?<\/tr>/g)]
      .map(([tr]) => {
        const eq = tr.match(/d-none d-md-inline">([^<]+)</)?.[1];
        const n = [...tr.matchAll(/cw-cell[^"]*">\s*([+-]?\d+)\s*</g)].map((m) => Number(m[1]));
        if (!eq || n.length < 8) return null;
        const [puesto, pts, pj, , , , gf, gc] = n;
        return { equipo: nombre(eq.trim()), puesto, pj, pts, dg: gf - gc };
      })
      .filter(Boolean)
  );
  return zonas.find((z) => z.some((f) => f.equipo === 'Estudiantes'));
};

const igualTabla = (a = [], b = []) =>
  a.length === b.length && a.every((f, i) => f.equipo === b[i].equipo && f.pj === b[i].pj && f.pts === b[i].pts && f.dg === b[i].dg);
const difTabla = (a = [], b = []) =>
  a.flatMap((f, i) => (b[i] && f.equipo === b[i].equipo && f.pj === b[i].pj && f.pts === b[i].pts && f.dg === b[i].dg ? [] : [`${i + 1}° ${f.equipo} ${f.pts} pts (${f.pj} PJ, DG ${f.dg}) ≠ ${b[i] ? `${b[i].equipo} ${b[i].pts} pts (${b[i].pj} PJ, DG ${b[i].dg})` : '—'}`]));

const fmt = (p) => `${p.rival} · ${p.fecha.slice(8, 10)}/${p.fecha.slice(5, 7)} ${p.fecha.slice(11, 16)} · ${p.torneo}${p.golesPropios != null ? ` · ${p.golesPropios}-${p.golesRival}` : ''}`;
const mismo = (a, b) => a && b && a.rival === b.rival && a.fecha === b.fecha;

const main = async () => {
  const aplicar = process.argv.includes('--aplicar');
  const archivoHome = join(root, 'data/home.json');
  const home = JSON.parse(await readFile(archivoHome, 'utf8'));
  const errores = [];
  const intentar = (p, que) => p.catch((e) => (errores.push(`${que}: ${e.message}`), undefined));

  const [cal, fix, te, fa] = await Promise.all([
    intentar(traer(FUENTES.calendario), 'ESPN calendario'),
    intentar(traer(FUENTES.fixture), 'ESPN fixture'),
    intentar(traer(FUENTES.tablaEspn), 'ESPN tabla'),
    intentar(traer(FUENTES.tablaFA, 'text'), 'futbolargentino tabla'),
  ]);

  const jugados = (cal?.events ?? []).map(partido).filter((p) => /FULL_TIME|FINAL/.test(p.estado ?? '')).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const proximos = (fix?.events ?? []).map(partido).filter((p) => p.fecha > horaAR(new Date().toISOString())).sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, 4);
  const tE = te && tablaEspn(te);
  const tF = fa && tablaFA(fa);

  const salida = { generado: new Date().toISOString(), fuentes: FUENTES, errores, ultimo: jugados[0], proximos, tabla: { espn: tE, futbolargentino: tF } };
  await mkdir(join(root, 'cobertura'), { recursive: true });
  await writeFile(join(root, 'cobertura/datos.json'), JSON.stringify(salida, null, 2));

  // Reporte
  errores.forEach((e) => console.log(`✗ ${e}`));
  console.log('\nPartidos (ESPN, todas las competencias, hora argentina)');
  if (jugados[0]) {
    const u = jugados[0], h = home.ultimo;
    const ok = mismo(u, h) && u.golesPropios === h.golesPropios && u.golesRival === h.golesRival;
    console.log(`  último:   ${fmt(u)}  ${ok ? '✓ igual a home.json' : `≠ home.json tiene ${fmt(h)}`}`);
  }
  for (const p of proximos) {
    const h = home.proximos.find((x) => x.rival === p.rival);
    console.log(`  próximo:  ${fmt(p)}  ${mismo(p, h) ? '✓ igual a home.json' : h ? `≠ home.json tiene ${h.fecha.slice(0, 16)}` : '+ no está en home.json'}`);
  }
  for (const h of home.proximos.filter((x) => !proximos.some((p) => p.rival === x.rival)))
    console.log(`  ?         ${fmt(h)}  está en home.json pero no en ESPN`);
  console.log('  Partidos: una sola fuente estructurada. Confirmar con el club o un medio antes de cambiar.');

  console.log('\nTabla del torneo (zona de Estudiantes)');
  if (tE && tF) {
    const coinciden = igualTabla(tE.filas, tF);
    console.log(`  ESPN vs futbolargentino: ${coinciden ? '✓ coinciden' : '≠ no coinciden'}`);
    difTabla(tE.filas, tF).forEach((d) => console.log(`    ${d}`));
    const actual = home.tabla.filas;
    const igualHome = igualTabla(tE.filas, actual);
    if (coinciden) {
      console.log(`  home.json: ${igualHome ? '✓ al día' : '≠ desactualizada'}`);
      if (!igualHome) difTabla(tE.filas, actual).forEach((d) => console.log(`    ${d}`));
    } else {
      // Sin acuerdo no hay "verdad": se dice con cuál coincide home.json y se deja como está.
      const con = [igualHome && 'ESPN', igualTabla(tF, actual) && 'futbolargentino'].filter(Boolean);
      console.log(`  home.json: ${con.length ? `coincide con ${con.join(' y ')}` : 'no coincide con ninguna'} → dejar como está y revisar a mano`);
    }
    const e = tE.filas.find((f) => f.equipo === 'Estudiantes');
    if (e) console.log(`  Estudiantes: ${e.puesto}° con ${e.pts} pts (home.json: ${home.posiciones[0].puesto}°, ${home.posiciones[0].detalle})`);
    if (aplicar && coinciden && !igualHome) {
      home.tabla.filas = tE.filas.map(({ equipo, pj, pts, dg }) => ({ equipo, pj, pts, dg, ...(equipo === 'Estudiantes' ? { propio: true } : {}) }));
      await writeFile(archivoHome, `${JSON.stringify(home, null, 2)}\n`);
      console.log('  → tabla.filas actualizada en data/home.json (revisar tabla.nombre y posiciones a mano)');
    } else if (aplicar && !coinciden) console.log('  → no se aplica: las fuentes no coinciden');
  } else console.log('  Falta una de las dos fuentes: no se compara.');
  console.log('\n→ cobertura/datos.json');
  if (errores.length === Object.keys(FUENTES).length) process.exitCode = 1;
};

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
