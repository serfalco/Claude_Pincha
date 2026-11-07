import { html } from '../lib/html.mjs';
import { header } from '../components/header.mjs';
import { hoy } from '../components/hoy.mjs';
import { partidos } from '../components/partidos.mjs';
import { tabla } from '../components/tabla.mjs';
import { noticias } from '../components/noticias.mjs';
import { club } from '../components/club.mjs';
import { footer } from '../components/footer.mjs';

// Una página = una función que recibe (site, data) y devuelve { path, title, description, jsonLd, body }.
// Para sumar páginas nuevas se agrega un archivo acá y se registra en scripts/build.mjs.
export default (site, data) => {
  const p = data.proximo;
  return {
    path: '/',
    title: `${site.nombre} · Cómo está hoy Estudiantes de La Plata`,
    description: site.descripcion,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: site.nombre,
        url: site.url,
        inLanguage: site.idioma,
        description: site.descripcion,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'SportsEvent',
        name: p.local ? `Estudiantes vs ${p.rival}` : `${p.rival} vs Estudiantes`,
        startDate: p.fecha,
        sport: 'Fútbol',
        eventStatus: 'https://schema.org/EventScheduled',
        ...(p.estadio && { location: { '@type': 'Place', name: p.estadio } }),
        homeTeam: { '@type': 'SportsTeam', name: p.local ? site.equipo : p.rival },
        awayTeam: { '@type': 'SportsTeam', name: p.local ? p.rival : site.equipo },
      },
    ],
    body: html`
${header(site)}
<main>
  ${hoy(data)}
  ${partidos(data)}
  ${tabla(data)}
  ${noticias(data)}
  ${club(data)}
</main>
${footer({ nombre: site.nombre, simulado: data.simulado, anio: new Date(data.actualizado).getFullYear() })}`,
  };
};
