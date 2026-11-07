// Build estático sin dependencias: datos JSON + plantillas JS → HTML final en /dist, en cada idioma.
// Resultado: HTML completo desde el servidor (ideal para SEO), CSS inline y cero JavaScript en el navegador.
import { readFile, writeFile, mkdir, cp, rm, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import site from '../site.config.mjs';
import { layout } from '../src/layout.mjs';
import { toString } from '../src/lib/html.mjs';
import { validarHome } from '../src/lib/validar.mjs';
import { combinar, pendientes } from '../src/lib/traducir.mjs';
import * as home from '../src/pages/home.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const existe = (p) => access(p).then(() => true, () => false);
const leerJSON = async (rel) => JSON.parse(await readFile(join(root, rel), 'utf8'));
const minCSS = (css) =>
  css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{}:;,>])\s*/g, '$1').replace(/;}/g, '}').trim();

// Registro de páginas: módulo de página + su validador.
const paginas = [{ mod: home, validar: validarHome }];

const [idiomaBase] = site.idiomas;
const textos = Object.fromEntries(
  await Promise.all(site.idiomas.map(async (l) => [l, (await import(`../src/i18n/${l}.mjs`)).default]))
);
const rutaDe = (lang, slug) => `/${lang === idiomaBase ? '' : `${lang}/`}${slug ? `${slug}/` : ''}`;

const build = async () => {
  await rm(dist, { recursive: true, force: true });
  await mkdir(dist, { recursive: true });
  await cp(join(root, 'public'), dist, { recursive: true });

  const css = minCSS(await readFile(join(root, 'src/styles.css'), 'utf8'));
  const sitemap = [];
  const avisos = [];

  for (const { mod, validar } of paginas) {
    const base = validar(await leerJSON(`data/${mod.datos}.json`));
    const alternates = site.idiomas.map((lang) => {
      const path = rutaDe(lang, mod.slug);
      return { lang, path, abs: new URL(path, site.url).href, nombre: textos[lang].nombreIdioma, ogLocale: textos[lang].ogLocale };
    });

    for (const lang of site.idiomas) {
      let data = base;
      if (lang !== idiomaBase) {
        const archivo = `data/i18n/${mod.datos}.${lang}.json`;
        const trad = (await existe(join(root, archivo))) ? await leerJSON(archivo) : undefined;
        pendientes(base, trad).forEach((p) => avisos.push(`${lang}: sin traducir ${p} (se muestra en español)`));
        data = validar(combinar(base, trad));
      }
      const alts = alternates.map((a) => ({ ...a, actual: a.lang === lang, href: a.path }));
      const actual = alts.find((a) => a.actual);
      const p = mod.default({ site, t: textos[lang], alternates: alts }, data);
      const out = join(dist, actual.path, 'index.html');
      await mkdir(dirname(out), { recursive: true });
      await writeFile(out, toString(layout({ site, t: textos[lang], css, url: actual.abs, alternates: alts, ...p })));
      sitemap.push({ loc: actual.abs, lastmod: base.actualizado.slice(0, 10), alternates });
    }
  }

  await writeFile(
    join(dist, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${sitemap
  .map(
    (u) =>
      `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod>${u.alternates
        .map((a) => `<xhtml:link rel="alternate" hreflang="${a.lang}" href="${a.abs}"/>`)
        .join('')}</url>`
  )
  .join('\n')}
</urlset>
`
  );
  await writeFile(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', site.url).href}\n`);

  avisos.forEach((a) => console.warn(`⚠ ${a}`));
  console.log(`✓ ${sitemap.length} página(s) generadas en dist/ (${site.idiomas.join(', ')})`);
};

build().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
