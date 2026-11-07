import { html, raw } from '../lib/html.mjs';

// El Pincharrata: mascota del sitio. Una sola figura en SVG; cada estado cambia cara, brazos y extras.
// Se elige el estado según el último resultado (ver estadoPorResultado).

const C = {
  piel: '#a7b0bb', pielSombra: '#8b95a1', rosa: '#f29bb0', linea: '#1d1d22',
  rojo: '#d4001f', blanco: '#ffffff', short: '#1d1d22', zapato: '#1d1d22',
};

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

const L = `stroke="${C.linea}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"`;

// Brazos: [hombroIzq → mano, hombroDer → mano] como curvas suaves.
const BRAZOS = {
  goleamos: ['M78 128 Q52 98 44 62', 'M146 126 Q170 96 178 60'],
  ganamos: ['M78 130 Q56 150 52 172', 'M146 126 Q172 102 176 70'],
  empatamos: ['M78 132 Q52 128 38 112', 'M146 130 Q172 126 186 110'],
  perdimos: ['M80 134 Q60 160 52 186', 'M146 132 Q166 160 172 186'],
  golearon: ['M80 136 Q62 166 56 194', 'M146 134 Q164 166 168 194'],
};
const MANOS = {
  goleamos: [[44, 58], [178, 56]],
  ganamos: [[52, 176], [176, 66]],
  empatamos: [[36, 110], [188, 108]],
  perdimos: [[52, 190], [172, 190]],
  golearon: [[56, 198], [168, 198]],
};

const ojos = (e) => {
  if (e === 'goleamos') return `<path d="M54 68 q7 -9 14 0 M86 64 q7 -9 14 0" fill="none" ${L}/>`;
  if (e === 'golearon') return `<path d="M54 64 l12 8 M86 62 l12 8" fill="none" ${L}/><path d="M54 72 l12 -8 M86 70 l12 -8" fill="none" ${L}/>`;
  const r = e === 'perdimos' ? 5 : 6.5;
  const brillo = e === 'perdimos' ? '' : `<circle cx="63" cy="64" r="2" fill="#fff"/><circle cx="95" cy="61" r="2" fill="#fff"/>`;
  const cejas = e === 'perdimos' ? `<path d="M52 56 l14 -4 M86 50 l14 4" fill="none" ${L} stroke-width="3"/>` : e === 'empatamos' ? `<path d="M53 54 h12 M86 51 h12" fill="none" ${L} stroke-width="3"/>` : '';
  return `${cejas}<circle cx="61" cy="66" r="${r}" fill="${C.linea}"/><circle cx="93" cy="63" r="${r}" fill="${C.linea}"/>${brillo}`;
};

const boca = (e) => ({
  goleamos: `<path d="M58 82 Q76 108 98 80 Z" fill="#7a1020" ${L}/><path d="M66 92 Q77 100 88 91" fill="${C.rosa}"/>`,
  ganamos: `<path d="M60 82 Q77 98 96 80" fill="none" ${L}/>`,
  empatamos: `<path d="M64 86 H90" fill="none" ${L}/>`,
  perdimos: `<path d="M62 92 Q77 80 92 90" fill="none" ${L}/>`,
  golearon: `<path d="M60 94 q5 -6 10 0 t10 0 t10 0 t10 0" fill="none" ${L}/>`,
})[e];

const extras = (e) => ({
  goleamos: `<g stroke-width="0">${[[30,30,C.rojo,20],[196,34,C.rojo,-25],[18,110,'#f4c430',40],[204,120,'#f4c430',-10],[60,18,'#f4c430',15],[168,16,C.rojo,60],[200,80,C.rojo,30],[22,74,C.rojo,-40]]
    .map(([x,y,c,r]) => `<rect x="${x}" y="${y}" width="9" height="5" rx="1.5" fill="${c}" transform="rotate(${r} ${x} ${y})"/>`).join('')}</g>`,
  ganamos: `<path d="M190 40 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#f4c430"/>`,
  empatamos: `<path d="M120 50 q6 10 0 14 q-6 -4 0 -14z" fill="#7cc4f2" stroke="${C.linea}" stroke-width="2"/>`,
  perdimos: `<path d="M60 74 q5 9 0 13 q-5 -4 0 -13z" fill="#7cc4f2" stroke="${C.linea}" stroke-width="2"/>`,
  golearon: `<g transform="translate(-40 0)"><path d="M70 14 q0 -14 18 -12 q8 -12 24 -2 q16 -2 16 12 q8 6 -2 12 h-52 q-12 -2 -4 -10z" fill="#c9ced6" stroke="${C.linea}" stroke-width="3"/>
    <path d="M80 34 l-4 10 M98 34 l-4 10 M116 34 l-4 10" ${L} stroke="#7cc4f2" stroke-width="3"/></g>
    <path d="M60 74 v24 M92 72 v26" fill="none" stroke="#7cc4f2" stroke-width="4" stroke-linecap="round"/>`,
})[e];

export const mascotaSVG = (estado = 'ganamos', { titulo = true } = {}) => {
  const e = ESTADOS[estado] ? estado : 'ganamos';
  const salto = e === 'goleamos' ? -10 : e === 'golearon' ? 4 : 0;
  const cabeza = e === 'golearon' ? 'rotate(10 110 90)' : e === 'perdimos' ? 'rotate(5 110 90)' : '';
  const [b1, b2] = BRAZOS[e];
  const [m1, m2] = MANOS[e];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 280" role="img" aria-label="Pincharrata: ${ESTADOS[e]}">${titulo ? `<title>Pincharrata: ${ESTADOS[e]}</title>` : ''}
<defs><clipPath id="cam-${e}"><path d="M80 112 H146 L166 214 H58 Z"/></clipPath></defs>
<ellipse cx="112" cy="268" rx="62" ry="7" fill="#000" opacity=".12"/>
<g transform="translate(0 ${salto})">
  <path d="M160 206 q34 -4 30 -34 q-3 -20 16 -24" fill="none" stroke="${C.rosa}" stroke-width="6" stroke-linecap="round"/>
  <path d="M84 222 L78 252 M140 222 L146 252" ${L} stroke-width="7"/>
  <path d="M66 254 q12 -8 20 0 q-2 6 -20 4z M140 254 q8 -8 20 0 q0 6 -20 4z" fill="${C.zapato}" ${L} stroke-width="3"/>
  <path d="${b1}" fill="none" ${L} stroke-width="7"/><path d="${b2}" fill="none" ${L} stroke-width="7"/>
  <circle cx="${m1[0]}" cy="${m1[1]}" r="7" fill="${C.piel}" ${L} stroke-width="3"/><circle cx="${m2[0]}" cy="${m2[1]}" r="7" fill="${C.piel}" ${L} stroke-width="3"/>
  <path d="M100 90 V118 M126 90 V118" fill="none" ${L}/><rect x="102" y="90" width="22" height="28" fill="${C.piel}"/>
  <path d="M58 212 H166 L168 228 H56 Z" fill="${C.short}" ${L} stroke-width="3"/>
  <g clip-path="url(#cam-${e})"><rect x="40" y="100" width="150" height="130" fill="${C.blanco}"/>${[66, 96, 126, 156].map((x) => `<rect x="${x}" y="100" width="15" height="130" fill="${C.rojo}"/>`).join('')}</g>
  <path d="M80 112 H146 L166 214 H58 Z" fill="none" ${L}/>
  <path d="M98 112 L113 128 L128 112" fill="none" ${L} stroke-width="5"/>
  <g transform="${cabeza}">
    <circle cx="124" cy="28" r="15" fill="${C.piel}" ${L}/><circle cx="124" cy="28" r="7" fill="${C.rosa}"/>
    <circle cx="152" cy="40" r="15" fill="${C.piel}" ${L}/><circle cx="152" cy="40" r="7" fill="${C.rosa}"/>
    <path d="M150 46 C136 20 92 18 66 34 C50 42 34 52 26 64 C18 76 26 90 44 94 C70 100 104 104 132 98 C158 92 166 70 150 46 Z" fill="${C.piel}" ${L}/>
    <path d="M60 38 C88 22 128 24 152 46" fill="none" stroke="${C.rojo}" stroke-width="11" stroke-linecap="round"/>
    <path d="M60 38 C88 22 128 24 152 46" fill="none" stroke="${C.blanco}" stroke-width="3" stroke-dasharray="1 10" stroke-linecap="round"/>
    <path d="M152 46 l18 -14 q4 8 -4 16z M152 46 l20 6 q-2 8 -12 4z" fill="${C.rojo}" ${L} stroke-width="3"/>
    <circle cx="23" cy="68" r="7" fill="${C.rosa}" ${L} stroke-width="3"/>
    <path d="M30 78 l-14 6 M32 82 l-12 10" fill="none" stroke="${C.linea}" stroke-width="2" stroke-linecap="round"/>
    <ellipse cx="112" cy="76" rx="9" ry="5" fill="${C.rosa}" opacity=".7"/>
    ${ojos(e)}
    ${boca(e)}
  </g>
  ${extras(e)}
</g>
</svg>`;
};

export const mascota = (estado) =>
  html`<figure class="mascota">${raw(mascotaSVG(estado, { titulo: false }))}<figcaption>${ESTADOS[estado]}</figcaption></figure>`;
