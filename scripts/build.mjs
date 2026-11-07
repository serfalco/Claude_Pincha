// Build estático sin dependencias: datos JSON + plantillas JS → HTML final en /dist, en cada idioma.
// Resultado: HTML completo desde el servidor (ideal para SEO), CSS inline y cero JavaScript en el navegador.
import { readFile, writeFile, mkdir, cp, rm, access, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import site from '../site.config.mjs';
import { layout } from '../src/layout.mjs';
import { toString } from '../src/lib/html.mjs';
import { validarHome } from '../src/lib/validar.mjs';
import { combinar, pendientes } from '../src/lib/traducir.mjs';
import home from '../src/pages/home.mjs';
import dia from '../src/pages/dia.mjs';
import dias from '../src/pages/dias.mjs';
import mundo from '../src/pages/mundo.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const existe = (p) => access(p).then(() => true, () => false);
const leerJSON = async (rel) => JSON.parse(await readFile(join(root, rel), 'utf8'));
const minCSS = (css) =>
  css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{}:;,>])\s*/g, '$1').replace(/;}/g, '}').trim();

const [idiomaBase] = site.idiomas;
const textos = Object.fromEntries(
  await Promise.all(site.idiomas.map(async (l) => [l, (await import(`../src/i18n/${l}.mjs`)).default]))
);
// Ruta de una página en un idioma: "" → "/", "dia/2026-11-07" → "/en/dia/2026-11-07/".
const ruta = (lang, slug = '') => `/${lang === idiomaBase ? '' : `${lang}/`}${slug ? `${slug}/` : ''}`;
const abs = (path) => new URL(path, site.url).href;

const build = async () => {
  await rm(dist, { recursive: true, force: true });
  await mkdir(dist, { recursive: true });
  await cp(join(root, 'public'), dist, { recursive: true });

  const css = minCSS(await readFile(join(root, 'src/styles.css'), 'utf8'));
  const sitemap = [];
  const avisos = [];

  // Genera una página en todos los idiomas. render(ctx, lang) → { title, description, jsonLd, body }
  const pagina = async (slug, lastmod, render) => {
    const alternates = site.idiomas.map((lang) => ({
      lang, path: ruta(lang, slug), abs: abs(ruta(lang, slug)), nombre: textos[lang].nombreIdioma, etiqueta: textos[lang].etiqueta, ogLocale: textos[lang].ogLocale,
    }));
    for (const lang of site.idiomas) {
      const alts = alternates.map((a) => ({ ...a, actual: a.lang === lang, href: a.path }));
      const actual = alts.find((a) => a.actual);
      const ctx = { site, t: textos[lang], alternates: alts, home: ruta(lang), ruta: (s) => ruta(lang, s) };
      const p = await render(ctx, lang);
      const out = join(dist, actual.path, 'index.html');
      await mkdir(dirname(out), { recursive: true });
      await writeFile(out, toString(layout({ site, t: textos[lang], css, url: actual.abs, alternates: alts, ...p })));
      sitemap.push({ loc: actual.abs, lastmod, alternates });
    }
  };

  // Datos base + traducción de cada idioma (si falta algo, queda en español y se avisa).
  const traducidos = async (nombre, validar = (d) => d) => {
    const base = validar(await leerJSON(`data/${nombre}.json`));
    const out = { [idiomaBase]: base };
    for (const lang of site.idiomas.slice(1)) {
      const archivo = `data/i18n/${nombre}.${lang}.json`;
      const trad = (await existe(join(root, archivo))) ? await leerJSON(archivo) : undefined;
      pendientes(base, trad).forEach((p) => avisos.push(`${lang}: sin traducir ${nombre}.${p} (se muestra en español)`));
      out[lang] = validar(combinar(base, trad));
    }
    return out;
  };

  // Home
  const porIdioma = await traducidos('home', validarHome);
  const base = porIdioma[idiomaBase];

  // Historial día por día
  const dirDias = join(root, 'data/dias');
  const archivos = (await existe(dirDias)) ? (await readdir(dirDias)).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort().reverse() : [];
  const listaDias = await Promise.all(archivos.map((f) => leerJSON(`data/dias/${f}`)));
  const hoyFecha = new Intl.DateTimeFormat('sv-SE', { timeZone: site.zonaHoraria }).format(new Date(base.actualizado));
  const hayHoy = listaDias.some((d) => d.fecha === hoyFecha);

  await pagina('', base.actualizado.slice(0, 10), (ctx, lang) =>
    home({ ...ctx, enlaceDia: hayHoy ? ctx.ruta(`dia/${hoyFecha}`) : undefined }, porIdioma[lang])
  );

  for (const [i, d] of listaDias.entries()) {
    await pagina(`dia/${d.fecha}`, d.fecha, (ctx) =>
      dia(ctx, d, {
        anterior: listaDias[i + 1] && ctx.ruta(`dia/${listaDias[i + 1].fecha}`),
        siguiente: listaDias[i - 1] && ctx.ruta(`dia/${listaDias[i - 1].fecha}`),
        todos: ctx.ruta('dias'),
      })
    );
  }
  // Sección global
  const mundoPorIdioma = await traducidos('mundo');
  await pagina('mundo', mundoPorIdioma[idiomaBase].actualizado.slice(0, 10), (ctx, lang) => mundo(ctx, mundoPorIdioma[lang]));

  if (listaDias.length) {
    await pagina('dias', listaDias[0].fecha, (ctx) => dias(ctx, listaDias.map((d) => ({ dia: d, href: ctx.ruta(`dia/${d.fecha}`) }))));
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
  await writeFile(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${abs('/sitemap.xml')}\n`);

  avisos.forEach((a) => console.warn(`⚠ ${a}`));
  console.log(`✓ ${sitemap.length} página(s) generadas en dist/ (${site.idiomas.join(', ')}; ${listaDias.length} día(s) en el historial)`);
};

build().catch((e) => {
  console.error(e.stack ?? e.message);
  process.exit(1);
});
