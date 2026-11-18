// Páginas de partido: /partido/AAAA-MM-DD-rival/. El slug sale de la fecha (hora argentina) y el rival,
// así la misma URL sirve antes (previa + en vivo) y después (resultado): no hace falta guardar nada aparte.
export const slugPartido = (p) =>
  `partido/${p.fecha.slice(0, 10)}-${p.rival.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;

// "Estudiantes vs Palmeiras" o "Palmeiras vs Estudiantes" si somos visitantes.
export const nombrePartido = (p, equipo = 'Estudiantes') => (p.condicion === 'visitante' ? `${p.rival} vs ${equipo}` : `${equipo} vs ${p.rival}`);
export const marcadorPartido = (p, equipo = 'Estudiantes') =>
  p.condicion === 'visitante' ? `${p.rival} ${p.golesRival}-${p.golesPropios} ${equipo}` : `${equipo} ${p.golesPropios}-${p.golesRival} ${p.rival}`;
export const golesTexto = (goles = [], t) => goles.map((g) => `${g.jugador} ${g.min}'${g.ec ? ` (${t.gol.ec})` : ''}${g.pen ? ` (${t.gol.pen})` : ''}`).join(', ');
