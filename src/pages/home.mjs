import { html } from '../lib/html.mjs';
import { fechas } from '../lib/fechas.mjs';
import { header } from '../components/header.mjs';
import { hoy } from '../components/hoy.mjs';
import { partidos } from '../components/partidos.mjs';
import { tabla } from '../components/tabla.mjs';
import { noticias } from '../components/noticias.mjs';
import { club } from '../components/club.mjs';
import { footer } from '../components/footer.mjs';

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
      ...data.proximos.map((p) => ({
        '@context': 'https://schema.org',
        '@type': 'SportsEvent',
        name: `${p.torneo}: ${p.condicion === 'visitante' ? `${p.rival} vs Estudiantes` : `Estudiantes vs ${p.rival}`}`,
        startDate: p.fecha,
        sport: 'Football',
        eventStatus: 'https://schema.org/EventScheduled',
        ...(p.estadio && { location: { '@type': 'Place', name: p.estadio } }),
        competitor: [
          { '@type': 'SportsTeam', name: site.equipo },
          { '@type': 'SportsTeam', name: p.rival },
        ],
      })),
    ],
    body: html`
${header(ctxF)}
<main>
  ${hoy(data, ctxF)}
  ${partidos(data, ctxF)}
  ${tabla(data, ctxF)}
  ${noticias(data, ctxF)}
  ${club(data, ctxF)}
</main>
${footer(data, ctxF)}`,
  };
};
