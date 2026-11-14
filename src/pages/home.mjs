import { html } from '../lib/html.mjs';
import { fechas } from '../lib/fechas.mjs';
import { header } from '../components/header.mjs';
import { hoy, notipinchas } from '../components/hoy.mjs';
import { video } from '../components/video.mjs';
import { franja } from '../components/franja.mjs';
import { vivo } from '../components/vivo.mjs';
import { partidos } from '../components/partidos.mjs';
import { tabla } from '../components/tabla.mjs';
import { club, socio } from '../components/club.mjs';
import { footer } from '../components/footer.mjs';

// Organizador de cada competencia (schema.org SportsEvent.organizer).
const ORGANIZADORES = [
  [/libertadores|sudamericana|recopa/i, { name: 'CONMEBOL', url: 'https://www.conmebol.com' }],
  [/mundial de clubes|club world cup/i, { name: 'FIFA', url: 'https://www.fifa.com' }],
  [/clausura|apertura|liga profesional|copa de la liga|trofeo de campeones/i, { name: 'Liga Profesional de Fútbol', url: 'https://www.ligaprofesional.ar' }],
  [/.*/, { name: 'Asociación del Fútbol Argentino', url: 'https://www.afa.com.ar' }],
];
const organizador = (torneo) => ({ '@type': 'SportsOrganization', ...ORGANIZADORES.find(([re]) => re.test(torneo))[1] });
// Un partido dura ~2 h; Google pide endDate.
const finEstimado = (iso) => {
  const d = new Date(new Date(iso).getTime() + 2 * 3600e3);
  const off = iso.slice(19) || 'Z';
  const local = new Date(d.getTime() + (off === 'Z' ? 0 : (off[0] === '-' ? -1 : 1) * (+off.slice(1, 3) * 60 + +off.slice(4, 6)) * 60e3));
  return local.toISOString().slice(0, 19) + off;
};

// Las 7 noticias del día como lista para buscadores (schema.org ItemList).
export const listaSiete = (siete, t, url) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: `${t.sieteMarca} · ${t.siete}`,
  url,
  inLanguage: t.locale,
  itemListOrder: 'https://schema.org/ItemListOrderAscending',
  numberOfItems: siete.length,
  itemListElement: siete.map((n, i) => ({ '@type': 'ListItem', position: i + 1, name: n.titulo, description: n.texto })),
});

// Una página = una función (ctx, data) → { title, description, jsonLd, body }.
// ctx trae site, t (textos del idioma), f (fechas del idioma) y alternates (las otras versiones).
export const slug = '';
export const datos = 'home';

export default (ctx, data) => {
  const { site, t } = ctx;
  const ctxF = { ...ctx, f: fechas(t.locale) };
  return {
    title: t.title,
    description: t.descripcion,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: site.nombre,
        url: site.url,
        inLanguage: t.locale,
        description: t.descripcion,
      },
      ...(data.hoy.siete?.length ? [listaSiete(data.hoy.siete, t, new URL(ctx.ruta(''), site.url).href)] : []),
      ...data.proximos.map((p) => {
        const nombre = p.condicion === 'visitante' ? `${p.rival} vs Estudiantes` : `Estudiantes vs ${p.rival}`;
        const equipos = [
          { '@type': 'SportsTeam', name: site.equipo, url: 'https://estudiantesdelaplata.com' },
          { '@type': 'SportsTeam', name: p.rival },
        ];
        return {
          '@context': 'https://schema.org',
          '@type': 'SportsEvent',
          name: `${p.torneo}${p.instancia ? ` (${p.instancia})` : ''}: ${nombre}`,
          description: `${nombre} por ${p.torneo}${p.instancia ? `, ${p.instancia.toLowerCase()}` : ''}${p.estadio ? ` en ${p.estadio}` : ''}.`,
          startDate: p.fecha,
          endDate: finEstimado(p.fecha),
          sport: 'Football',
          eventStatus: 'https://schema.org/EventScheduled',
          eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          ...(p.estadio && { location: { '@type': 'Place', name: p.estadio, address: p.estadio } }),
          organizer: organizador(p.torneo),
          competitor: equipos,
          performer: equipos,
        };
      }),
    ],
    body: html`
${header(ctxF)}
<main>
  ${hoy(data, ctxF, video(data, ctxF), html`<div id="partidos">${vivo(data, ctxF)}${franja(data, ctxF)}</div>`)}
  ${socio(data, ctxF)}
  ${notipinchas(data, ctxF)}
  ${partidos(data, ctxF)}
  ${tabla(data, ctxF)}
  ${club(data, ctxF)}
</main>
${footer(data, ctxF)}`,
  };
};
