// Formateo de fechas siempre en hora argentina, independiente de dónde corra el build.
import config from '../../site.config.mjs';

const fmt = (opts) => new Intl.DateTimeFormat(config.idioma, { timeZone: config.zonaHoraria, ...opts });

const diaLargo = fmt({ weekday: 'long', day: 'numeric', month: 'long' });
const diaCorto = fmt({ day: 'numeric', month: 'short' });
const hora = fmt({ hour: '2-digit', minute: '2-digit', hour12: false });

const mayus = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export const fechaLarga = (iso) => mayus(diaLargo.format(new Date(iso)));
export const fechaCorta = (iso) => diaCorto.format(new Date(iso)).replace('.', '');
export const horaCorta = (iso) => `${hora.format(new Date(iso))} h`;
