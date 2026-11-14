import { html, raw } from '../lib/html.mjs';

// Íconos de línea propios (24×24, trazo 2, color del texto). Decorativos: aria-hidden.
const P = {
  calendario: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M8 14h3v3H8z"/>',
  marcador: '<rect x="2.5" y="6" width="19" height="13" rx="3"/><path d="M12 6v13M7 10.5v4M17 10.5v4"/><path d="M9 3l3 3 3-3"/>',
  tabla: '<path d="M10 6h11M10 12h11M10 18h11"/><path d="M4 5.5l1.5-1V9M3.5 13.5c0-1 .8-1.5 1.5-1.5s1.5.5 1.5 1.3c0 1-2.8 2.2-2.8 3.2h2.8"/>',
  diario: '<path d="M4 5h13v14a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2z"/><path d="M17 9h3v10a2 2 0 0 1-2 2"/><path d="M8 9h5M8 13h5M8 17h3"/>',
  escudo: '<path d="M5 4h14v8c0 4.5-3.2 7.4-7 9-3.8-1.6-7-4.5-7-9z"/><path d="M9.5 7.5v8.5M14.5 7.5v8.5"/>',
  mundo: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3z"/>',
  nota: '<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  reloj: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  corazon: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20z"/>',
  persona: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.2-4 4.3-6 8-6s6.8 2 8 6"/>',
  copa: '<path d="M7 4h10v4a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8M9 17h6"/>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.5"/>',
  pelota: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5l4 2.9-1.5 4.7h-5L8 10.4z"/><path d="M12 3v4.5M21 10.4l-5 0M17.5 19.3l-3-4.2M6.5 19.3l3-4.2M3 10.4h5"/>',
};

export const icono = (nombre, clase = 'ico') =>
  html`<svg class="${clase}" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${raw(P[nombre])}</svg>`;
