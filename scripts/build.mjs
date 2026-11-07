// Build estático sin dependencias: datos JSON + plantillas JS → HTML final en /dist.
// Resultado: HTML completo desde el servidor (ideal para SEO), CSS inline y cero JavaScript en el navegador.
import { readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import site from '../site.config.mjs';
import { layout } from '../src/layout.mjs';
import { toString } from '../src/lib/html.mjs';
import { validarHome } from '../src/lib/validar.mjs';
import home from '../src/pages/home.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

const leerJSON = async (rel) => JSON.parse(await readFile(join(root, rel), 'utf8'));
const minCSS = (css) =>
  css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{}:;,>])\s*/g, '$1').replace(/;}/g, '}').trim();

// Registro de páginas. Cada entrada: módulo de página + archivo de datos.
const paginas = [{ page: home, data: 'data/home.json', validar: validarHome }];

const build = async () => {
  await rm(dist, { recursive: true, force: true });
  await mkdir(dist, { recursive: true });
  await cp(join(root, 'public'), dist, { recursive: true });

  const css = minCSS(await readFile(join(root, 'src/styles.css'), 'utf8'));
  const urls = [];

  for (const { page, data, validar } of paginas) {
    const datos = validar(await leerJSON(data));
    const p = page(site, datos);
    const out = join(dist, p.path === '/' ? 'index.html' : `${p.path.replace(/^\/|\/$/g, '')}/index.html`);
    await mkdir(dirname(out), { recursive: true });
    await writeFile(out, toString(layout({ site, css, ...p })));
    urls.push({ loc: new URL(p.path, site.url).href, lastmod: datos.actualizado.slice(0, 10) });
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`).join('\n')}
</urlset>
`;
  await writeFile(join(dist, 'sitemap.xml'), sitemap);
  await writeFile(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', site.url).href}\n`);

  console.log(`✓ ${urls.length} página(s) generadas en dist/`);
};

build().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
