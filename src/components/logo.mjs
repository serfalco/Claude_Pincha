import { html, raw } from '../lib/html.mjs';

// Marca propia (no el escudo oficial): cuadrado redondeado con bastones rojo y blanco.
// Se reutiliza para el favicon y la imagen Open Graph.
export const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="15" fill="#fff"/><rect x="10" y="10" width="9" height="44" rx="2" fill="#d4001f"/><rect x="27.5" y="10" width="9" height="44" rx="2" fill="#d4001f"/><rect x="45" y="10" width="9" height="44" rx="2" fill="#d4001f"/></svg>`;

export const logo = () => html`<span class="brand__logo" aria-hidden="true">${raw(LOGO_SVG)}</span>`;
