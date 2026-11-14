// "Sumate al mapa": Pages Function en /api/mapa, con una base D1 (binding DB, tabla `puntos`).
// GET  → { total, paises, puntos: [[lon, lat, n], …], vos: { ciudad, pais } | null }
// POST → suma un pincha en la ciudad de quien llama y devuelve lo mismo, con ok: true (o ya: true si ya estaba).
// No hay texto libre: la ciudad sale de la conexión (request.cf, dato de Cloudflare), así que no hay nada que moderar.
// Solo se guarda ciudad, país, coordenadas redondeadas (~10 km) y la cuenta. Ni nombre, ni mail, ni IP.
// Tabla: ver ACTUALIZAR.md ("Mapa de pinchas").
const CACHE_S = 60; // el listado se guarda 60 s en el caché de Cloudflare: D1 recibe ~1 lectura por minuto por región
const CLAVE_LISTA = 'https://mapa.elpinchahoy/puntos';
const DIA_S = 86400;

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

// De dónde viene la visita, según Cloudflare. null si no hay país o coordenadas (o es Tor/desconocido).
export const lugar = (cf = {}) => {
  const pais = String(cf.country ?? '').toUpperCase();
  const lat = Number(cf.latitude), lon = Number(cf.longitude);
  if (!/^[A-Z]{2}$/.test(pais) || pais === 'XX' || pais === 'T1' || !Number.isFinite(lat) || !Number.isFinite(lon) || (!cf.latitude && !cf.longitude)) return null;
  const ciudad = String(cf.city ?? '').slice(0, 80);
  return { clave: `${pais}|${ciudad}`, ciudad, pais, lat: Math.round(lat * 10) / 10, lon: Math.round(lon * 10) / 10 };
};

const listar = async (DB, fresco) => {
  const cache = caches.default;
  if (!fresco) {
    const c = await cache.match(CLAVE_LISTA);
    if (c) return c.json();
  }
  const { results } = await DB.prepare('SELECT lon, lat, n, pais FROM puntos ORDER BY n DESC LIMIT 3000').all();
  const lista = {
    total: results.reduce((s, r) => s + r.n, 0),
    paises: new Set(results.map((r) => r.pais)).size,
    puntos: results.map((r) => [r.lon, r.lat, r.n]),
  };
  await cache.put(CLAVE_LISTA, new Response(JSON.stringify(lista), { headers: { 'content-type': 'application/json', 'cache-control': `public, max-age=${CACHE_S}` } }));
  return lista;
};

// Un voto por conexión y por día: se anota una marca (hash de la IP, no la IP) en el caché de Cloudflare, que se borra sola.
const marca = async (request) => {
  const ip = request.headers.get('cf-connecting-ip') ?? '';
  const dia = new Date().toISOString().slice(0, 10);
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${ip}|${dia}|pincha`));
  return `https://mapa.elpinchahoy/voto/${[...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('')}`;
};

export const onRequest = async ({ request, env }) => {
  const { DB } = env;
  if (!DB) return json({ error: 'sin_base' }, 503);
  const vos = lugar(request.cf);
  const pub = vos && { ciudad: vos.ciudad, pais: vos.pais };
  try {
    if (request.method === 'GET') return json({ ...(await listar(DB)), vos: pub });
    if (request.method !== 'POST') return json({ error: 'metodo' }, 405);

    // Solo desde el propio sitio.
    let propio = false;
    try { propio = new URL(request.headers.get('origin') ?? '').host === new URL(request.url).host; } catch {}
    if (!propio) return json({ error: 'origen' }, 403);
    if (!vos) return json({ error: 'sin_ubicacion' }, 422);

    const k = await marca(request);
    if (await caches.default.match(k)) return json({ ...(await listar(DB)), vos: pub, ya: true });

    await DB.prepare('INSERT INTO puntos (clave, ciudad, pais, lat, lon, n) VALUES (?1, ?2, ?3, ?4, ?5, 1) ON CONFLICT(clave) DO UPDATE SET n = n + 1')
      .bind(vos.clave, vos.ciudad, vos.pais, vos.lat, vos.lon)
      .run();
    await caches.default.put(k, new Response('1', { headers: { 'cache-control': `public, max-age=${DIA_S}` } }));
    return json({ ...(await listar(DB, true)), vos: pub, ok: true });
  } catch (e) {
    return json({ error: 'base', detalle: String(e?.message ?? e).slice(0, 120) }, 500);
  }
};
