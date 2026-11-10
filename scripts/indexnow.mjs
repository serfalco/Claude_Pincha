// Avisa a los buscadores que usan IndexNow (Bing, Yandex, Seznam, Naver…) qué páginas cambiaron.
// Uso: npm run indexnow            → páginas del sitemap con lastmod de hoy o ayer (hora argentina)
//      npm run indexnow -- --todas → todas las del sitemap
// Correr DESPUÉS de que Cloudflare publique (la clave tiene que estar online).
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import site from '../site.config.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const xml = await readFile(join(root, 'dist/sitemap.xml'), 'utf8');
const urls = [...xml.matchAll(/<url><loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod>/g)].map(([, loc, lastmod]) => ({ loc, lastmod }));
const dia = (d) => new Intl.DateTimeFormat('sv-SE', { timeZone: site.zonaHoraria }).format(d);
const recientes = new Set([dia(new Date()), dia(new Date(Date.now() - 864e5))]);
const lista = (process.argv.includes('--todas') ? urls : urls.filter((u) => recientes.has(u.lastmod))).map((u) => u.loc);
if (!lista.length) { console.log('IndexNow: nada nuevo para avisar'); process.exit(0); }

const host = new URL(site.url).host;
const r = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key: site.indexnow, keyLocation: `${site.url}/${site.indexnow}.txt`, urlList: lista }),
});
console.log(`IndexNow: ${lista.length} URL(s) → HTTP ${r.status}${r.ok ? ' ✓' : ` ${await r.text()}`}`);
if (!r.ok && r.status !== 202) process.exit(1);
