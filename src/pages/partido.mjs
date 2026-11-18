import { html } from '../lib/html.mjs';
import { fechas } from '../lib/fechas.mjs';
import { header } from '../components/header.mjs';
import { footer } from '../components/footer.mjs';
import { siete } from '../components/hoy.mjs';
import { vivo } from '../components/vivo.mjs';
import { estadoPorResultado } from '../components/mascota.mjs';
import { eventoLd } from './home.mjs';
import { nombrePartido, marcadorPartido, golesTexto, slugPartido } from '../lib/partido.mjs';

// Página de un partido. Antes: previa con fecha, hora, estadio, el marcador en vivo y las últimas 7 noticias.
// Después: resultado y goles, con link al día en el historial. p = partido; extra = { enVivo, siete, dia, data }.
export default (ctx, p, { enVivo, siete: notas = [], dia, data }) => {
  const { site, t } = ctx;
  const f = fechas(t.locale);
  const ctxF = { ...ctx, f };
  const tp = t.partido;
  const jugado = Number.isInteger(p.golesPropios);
  const nombre = nombrePartido(p);
  const torneo = `${p.torneo}${p.instancia ? ` · ${p.instancia}` : ''}`;
  const url = new URL(ctx.ruta(slugPartido(p)), site.url).href;
  // En español y portugués el día va en minúscula en medio de la frase.
  const larga = /^(es|pt)/.test(t.locale) ? f.larga(p.fecha).replace(/^./, (c) => c.toLowerCase()) : f.larga(p.fecha);
  const estado = jugado ? estadoPorResultado(p.golesPropios, p.golesRival) : null;
  return {
    title: jugado ? tp.tituloJugado(marcadorPartido(p), torneo) : tp.tituloPrevia(nombre, torneo, `${f.corta(p.fecha)} ${f.hora(p.fecha)}`),
    description: jugado
      ? tp.descJugado(nombre, torneo, larga, t.estados[estado], marcadorPartido(p), golesTexto(p.goles, t))
      : tp.descPrevia(nombre, torneo, larga, f.hora(p.fecha), p.estadio),
    jsonLd: [{ ...eventoLd(p, site), url }],
    body: html`
${header(ctxF)}
<main>
  <section id="hoy" class="hoy" aria-labelledby="partido-titulo">
    <div class="wrap">
      <p class="kicker"><span class="dot" aria-hidden="true"></span>${torneo}</p>
      <h1 id="partido-titulo" class="hoy__titular">${jugado ? marcadorPartido(p) : nombre}</h1>
      <p class="hoy__resumen"><time datetime="${p.fecha}">${f.larga(p.fecha)} · ${f.hora(p.fecha)}</time> (${tp.horaArg})${p.estadio ? ` · ${p.estadio}` : ''}</p>
      ${jugado
        ? html`<p class="dia__resultado">${tp.final}: ${t.estados[estado]}</p>
      ${p.goles?.length ? html`<p class="hoy__resumen">⚽ ${tp.goles}: ${golesTexto(p.goles, t)}</p>` : ''}`
        : ''}
      ${enVivo ? html`<div id="partidos">${vivo({ proximos: [p] }, ctxF)}<p class="hoy__resumen franja partido__aviso">${tp.enVivo}</p></div>` : ''}
      ${!jugado && notas.length ? siete(notas, t) : ''}
      <p class="dia__nav">${dia ? html`<a href="${dia}">${tp.cronica}</a>` : html`<span></span>`}<a href="${ctx.home}">${tp.volver}</a></p>
    </div>
  </section>
</main>
${footer(data, ctxF)}`,
  };
};
