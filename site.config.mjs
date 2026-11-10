// Configuración global del sitio. Los textos que cambian por idioma viven en src/i18n/.
export default {
  nombre: 'El Pincha Hoy',
  url: 'https://elpinchahoy.com.ar',
  zonaHoraria: 'America/Argentina/Buenos_Aires',
  equipo: 'Estudiantes de La Plata',
  // IndexNow (Bing, Yandex, Seznam…): la clave está publicada en public/<clave>.txt
  indexnow: '9b86f75d1953307d0b93c0793a35b0a0',
  colorTema: '#17171a',
  // El primero es el idioma base (va en "/"); el resto va en "/<idioma>/".
  idiomas: ['es', 'en', 'pt', 'zh', 'hi'],
  secciones: ['hoy', 'partidos', 'tabla', 'noticias', 'club'],
};
