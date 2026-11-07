// Formateo de fechas siempre en hora argentina, en el idioma de cada página.
import config from '../../site.config.mjs';

const mayus = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const cache = new Map();

export const fechas = (locale) => {
  if (cache.has(locale)) return cache.get(locale);
  const fmt = (opts) => new Intl.DateTimeFormat(locale, { timeZone: config.zonaHoraria, ...opts });
  const largo = fmt({ weekday: 'long', day: 'numeric', month: 'long' });
  const dia = fmt({ day: 'numeric' });
  const mes = fmt({ month: 'short' });
  const hora = fmt({ hour: '2-digit', minute: '2-digit', hour12: false });
  const f = {
    larga: (iso) => mayus(largo.format(new Date(iso))),
    dia: (iso) => dia.format(new Date(iso)),
    mes: (iso) => mes.format(new Date(iso)).replace('.', ''),
    corta: (iso) => `${f.dia(iso)} ${f.mes(iso)}`,
    hora: (iso) => (locale.startsWith('es') ? `${hora.format(new Date(iso))} h` : hora.format(new Date(iso))),
  };
  cache.set(locale, f);
  return f;
};
