// Configuración global del sitio. Los textos que cambian por idioma viven en src/i18n/.
export default {
  nombre: 'El Pincha Hoy',
  url: 'https://elpinchahoy.com.ar',
  zonaHoraria: 'America/Argentina/Buenos_Aires',
  equipo: 'Estudiantes de La Plata',
  colorTema: '#d4001f',
  // El primero es el idioma base (va en "/"); el resto va en "/<idioma>/".
  idiomas: ['es', 'en', 'pt'],
  secciones: ['hoy', 'partidos', 'tabla', 'noticias', 'club'],
};
