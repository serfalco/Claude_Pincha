// Partido en vivo: Cloudflare Pages Function (Worker) en /api/vivo.
// Busca el partido de Estudiantes del día en ESPN (API pública, no oficial), lo resume en un JSON chico
// y lo guarda 30 s en el caché de Cloudflare: aunque entren miles de hinchas, ESPN recibe ~2 consultas por minuto.
// Solo datos (minuto, tipo, jugador): los textos los arma la página en cada idioma.
// Prueba con un partido pasado: /api/vivo?evento=401841661
const ESPN = 'https://site.api.espn.com/apis/site/v2/sports/soccer/all';
const EQUIPO = '8'; // Estudiantes de La Plata en ESPN
const ZONA = 'America/Argentina/Buenos_Aires';
const CACHE_S = 30;

const json = (data, s = CACHE_S) =>
  new Response(JSON.stringify(data), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': `public, max-age=${s}` },
  });

const traer = async (url) => {
  const r = await fetch(url, { headers: { accept: 'application/json' }, cf: { cacheTtl: CACHE_S } });
  if (!r.ok) throw new Error(`ESPN ${r.status}`);
  return r.json();
};

// Partido de Estudiantes de hoy (hora argentina) según el scoreboard de ESPN.
const buscarEvento = async () => {
  const hoy = new Intl.DateTimeFormat('sv-SE', { timeZone: ZONA }).format(new Date()).replaceAll('-', '');
  const sb = await traer(`${ESPN}/scoreboard?dates=${hoy}`);
  const e = (sb.events ?? []).find((ev) => ev.competitions?.[0]?.competitors?.some((c) => String(c.id ?? c.team?.id) === EQUIPO));
  return e?.id;
};

const TIPOS = [
  [(k) => k.scoringPlay, 'gol'],
  [(k) => /yellow.*red|second.?yellow|red/.test(k.type?.type ?? ''), 'roja'],
  [(k) => /yellow/.test(k.type?.type ?? ''), 'amarilla'],
  [(k) => k.type?.type === 'substitution', 'cambio'],
  [(k) => k.type?.type === 'kickoff', 'inicio'],
  [(k) => k.type?.type === 'halftime', 'entretiempo'],
  [(k) => k.type?.type === 'start-2nd-half', 'segundo'],
];

export const resumir = (d) => {
  const c = d.header?.competitions?.[0];
  if (!c) return null;
  const apellidos = new Map(
    (d.rosters ?? []).flatMap((r) => (r.roster ?? []).map((p) => [p.athlete?.id, p.athlete?.lastName]))
  );
  const nombre = (a) => (a ? apellidos.get(a.id) || a.displayName?.split(' ').slice(1).join(' ') || a.displayName : '');
  const lado = (c2) => ({
    nombre: c2.team?.shortDisplayName || c2.team?.displayName,
    goles: Number(c2.score ?? 0),
    penales: c2.shootoutScore != null ? Number(c2.shootoutScore) : undefined,
    propio: String(c2.id ?? c2.team?.id) === EQUIPO,
  });
  const st = c.status?.type ?? {};
  const eventos = (d.keyEvents ?? [])
    .filter((k) => !k.shootout && (k.period?.number ?? 1) <= 4)
    .map((k) => {
      const tipo = TIPOS.find(([f]) => f(k))?.[1];
      if (!tipo) return null;
      const t = k.type?.type ?? '';
      const [p1, p2] = k.participants ?? [];
      return {
        min: k.clock?.displayValue ?? '',
        tipo,
        equipo: k.team?.id ? (String(k.team.id) === EQUIPO ? 'propio' : 'rival') : undefined,
        jugador: nombre(p1?.athlete) || undefined,
        sale: tipo === 'cambio' ? nombre(p2?.athlete) || undefined : undefined,
        ec: t === 'own-goal' || undefined,
        pen: (tipo === 'gol' && /penalty/.test(t)) || undefined,
      };
    })
    .filter(Boolean);
  return {
    id: d.header.id,
    estado: st.state ?? 'pre', // pre | in | post
    reloj: c.status?.displayClock || '',
    detalle: st.shortDetail || '', // "HT", "FT", "FT-Pens"…
    entretiempo: st.name === 'STATUS_HALFTIME',
    estadio: d.gameInfo?.venue?.fullName ?? '',
    local: lado(c.competitors.find((x) => x.homeAway === 'home')),
    visitante: lado(c.competitors.find((x) => x.homeAway === 'away')),
    eventos,
  };
};

export const onRequestGet = async ({ request, waitUntil }) => {
  const url = new URL(request.url);
  const cache = globalThis.caches?.default;
  const clave = new Request(url.origin + url.pathname + url.search);
  const guardado = await cache?.match(clave);
  if (guardado) return guardado;

  let res;
  try {
    const id = url.searchParams.get('evento')?.replace(/\D/g, '') || (await buscarEvento());
    if (!id) res = json({ estado: 'sin-partido' }, 300);
    else {
      const datos = resumir(await traer(`${ESPN}/summary?event=${id}`));
      res = datos ? json(datos) : json({ estado: 'sin-datos' }, 60);
    }
  } catch {
    res = json({ estado: 'error' }, 15);
  }
  if (cache) waitUntil?.(cache.put(clave, res.clone()));
  return res;
};
