import { html, raw } from '../lib/html.mjs';
import { header } from '../components/header.mjs';
import { footer } from '../components/footer.mjs';
import { mascotaSVG } from '../components/mascota.mjs';

// Sección global: /mundo/. Nota de bienvenida, sueño del Mundial de Clubes, filiales y cómo armar una.
// Los nombres de países salen de Intl en cada idioma (no hace falta traducirlos).
const bandera = (iso) => String.fromCodePoint(...[...iso.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));

export default (ctx, m) => {
  const { site, t } = ctx;
  const paises = new Intl.DisplayNames([t.locale], { type: 'region' });
  const porPais = new Map();
  for (const f of m.exterior) porPais.set(f.pais, [...(porPais.get(f.pais) ?? []), f]);
  const grupos = [...porPais]
    .map(([pais, filiales]) => ({ pais, nombre: paises.of(pais), filiales }))
    .sort((a, b) => b.filiales.length - a.filiales.length || a.nombre.localeCompare(b.nombre, t.locale));
  const c = m.crear.contacto;
  return {
    title: t.mundo.title,
    description: t.mundo.descripcion,
    jsonLd: [{ '@context': 'https://schema.org', '@type': 'WebPage', name: t.mundo.title, inLanguage: t.locale, description: t.mundo.descripcion }],
    body: html`
${header(ctx)}
<main>
  <section id="hoy" class="hoy mundo__hero" aria-labelledby="mundo-titulo">
    <div class="wrap mundo__hero-inner">
      <div>
        <p class="kicker"><span class="dot" aria-hidden="true"></span>${t.mundo.kicker}</p>
        <h1 id="mundo-titulo" class="hoy__titular">${m.nota.titulo}</h1>
      </div>
      <div class="mundo__mascota" aria-hidden="true">${raw(mascotaSVG('ganamos', { titulo: false }))}</div>
    </div>
    <div class="wrap">${m.nota.parrafos.map((p) => html`<p class="hoy__resumen">${p}</p>`)}</div>
  </section>

  <section class="wrap block" aria-labelledby="mundial-titulo">
    <article class="card campania">
      <h2 id="mundial-titulo" class="campania__titulo">${m.mundial.titulo}</h2>
      <ul class="mundo__puntos">${m.mundial.puntos.map((p) => html`<li>${p}</li>`)}</ul>
      <p class="meta">${m.mundial.aclaracion} ${t.fuente}: <a href="${m.mundial.fuente.url}" rel="noopener">${m.mundial.fuente.nombre}</a></p>
    </article>
  </section>

  <section class="wrap block" aria-labelledby="fuera-titulo">
    <h2 id="fuera-titulo" class="block__title">${t.mundo.filialesFuera} · ${m.exterior.length}</h2>
    <ul class="mundo__paises">
      ${grupos.map(
        (g) => html`<li class="card mundo__pais">
        <h3 class="mundo__pais-nombre"><span aria-hidden="true">${bandera(g.pais)}</span> ${g.nombre}</h3>
        <ul class="mundo__filiales">
          ${g.filiales.map(
            (f) => html`<li><strong>${f.ciudad}</strong> · ${f.nombre} <a class="link" href="mailto:${f.mail}">${t.mundo.escribir}</a></li>`
          )}
        </ul>
      </li>`
      )}
    </ul>
  </section>

  <section class="wrap block" aria-labelledby="arg-titulo">
    <h2 id="arg-titulo" class="block__title">${t.mundo.filialesArg(m.argentina.total)}</h2>
    <div class="card card--flush">
      <table class="table">
        <tbody>
          ${m.argentina.regiones.map((r) => html`<tr><th scope="row">${r.region}</th><td class="pts">${r.cantidad}</td></tr>`)}
        </tbody>
      </table>
      <p class="table__nota"><a class="link" href="https://estudiantesdelaplata.com/filiales/" rel="noopener">${t.mundo.todas} →</a></p>
    </div>
  </section>

  <section class="wrap block" aria-labelledby="crear-titulo">
    <h2 id="crear-titulo" class="block__title">${m.crear.titulo}</h2>
    <article class="card">
      <p>${m.crear.intro}</p>
      <ol class="mundo__pasos">${m.crear.pasos.map((p) => html`<li>${p}</li>`)}</ol>
      <p class="meta">${m.crear.nota}</p>
      <h3 class="card__label mundo__contacto-titulo">${t.mundo.contacto}</h3>
      <p class="campania__acciones">
        <a class="btn" href="mailto:${c.mail}">${c.mail}</a>
      </p>
      <p class="meta">${c.sede} · <a href="tel:${c.telefono.replace(/\s/g, '')}">${c.telefono}</a></p>
    </article>
  </section>
</main>
${footer({ actualizado: m.actualizado }, ctx)}`,
  };
};
