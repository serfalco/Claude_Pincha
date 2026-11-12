// Feli: mascota del sitio, inspirado en Felipe, el primer pincharrata.
// Una imagen por estado en public/feli/; se elige según el último resultado (ver estadoPorResultado).
// Durante el partido: "vivo" (nervioso), "gol-pincha" y "gol-rival" (los cambia public/vivo.js).

export const ESTADOS = {
  goleamos: 'Goleamos',
  ganamos: 'Ganamos',
  empatamos: 'Empatamos',
  perdimos: 'Perdimos',
  golearon: 'Nos golearon',
};

export const estadoPorResultado = (propios, rival) => {
  const d = propios - rival;
  if (d >= 3) return 'goleamos';
  if (d > 0) return 'ganamos';
  if (d === 0) return 'empatamos';
  if (d > -3) return 'perdimos';
  return 'golearon';
};

// Tamaño real de cada imagen (evita saltos de layout).
const TAM = {
  goleamos: [260, 400], ganamos: [260, 475], empatamos: [260, 464],
  perdimos: [260, 463], golearon: [260, 480], vivo: [260, 266],
  'gol-pincha': [260, 270], 'gol-rival': [260, 269],
};

export const mascota = (estado = 'ganamos', { alt = '', clase = '' } = {}) => {
  const e = TAM[estado] ? estado : 'ganamos';
  const [w, h] = TAM[e];
  return `<img class="feli ${clase}" src="/feli/${e}.webp" width="${w}" height="${h}" alt="${alt}" decoding="async">`;
};
