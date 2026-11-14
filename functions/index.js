// Idioma automático en la portada: Cloudflare Pages Function en "/" (solo la raíz; el resto del sitio es estático).
// Quien llega de afuera con el navegador en inglés, portugués, chino o hindi va a su versión (/en/, /pt/, /zh/, /hi/).
// Se decide por el idioma del navegador, no por el país: un pincha en Madrid quiere español.
// Si la persona vuelve a "/" tocando "ES" dentro del sitio, se respeta y se recuerda con una cookie.
// Buscadores y robots no mandan Accept-Language, así que siguen viendo el español en "/".
// Los idiomas tienen que coincidir con site.config.mjs (el primero es el de "/").
const OTROS = ['en', 'pt', 'zh', 'hi'];
const BASE = 'es';
const COOKIE = 'idioma';

// "en-US,en;q=0.9,es;q=0.8" → primer idioma del sitio en orden de preferencia.
export const preferido = (cabecera = '') =>
  cabecera
    .split(',')
    .map((x, i) => {
      const [tag, ...ps] = x.trim().split(';');
      const q = ps.map((p) => p.trim()).find((p) => p.startsWith('q='));
      return { l: tag.toLowerCase().split('-')[0], q: q ? Number(q.slice(2)) || 0 : 1, i };
    })
    .filter((x) => x.q > 0 && (x.l === BASE || OTROS.includes(x.l)))
    .sort((a, b) => b.q - a.q || a.i - b.i)[0]?.l ?? BASE;

export const onRequest = async ({ request, next }) => {
  const url = new URL(request.url);
  if (!['GET', 'HEAD'].includes(request.method) || url.pathname !== '/') return next();

  const eligio = (request.headers.get('cookie') ?? '').split(';').some((c) => c.trim() === `${COOKIE}=${BASE}`);
  let interno = false;
  try { interno = new URL(request.headers.get('referer') ?? '').host === url.host; } catch {}

  // Vino desde adentro del sitio (tocó "ES" o el logo): se queda en español y lo recordamos.
  if (interno || eligio) {
    const r = await next();
    if (!interno || eligio) return r;
    const res = new Response(r.body, r);
    res.headers.append('set-cookie', `${COOKIE}=${BASE}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`);
    return res;
  }

  const l = preferido(request.headers.get('accept-language') ?? '');
  if (l === BASE) return next();
  return new Response(null, {
    status: 302,
    headers: { location: `/${l}/${url.search}`, vary: 'Accept-Language, Cookie', 'cache-control': 'private, no-store' },
  });
};
