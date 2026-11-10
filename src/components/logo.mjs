import { html } from '../lib/html.mjs';

// Logo propio de El Pincha Hoy (almanaque a bastones con "HOY").
// Archivo: public/logo.svg (vectorial, texto convertido a trazos).
export const logo = () => html`<img class="brand__logo" src="/logo.svg" width="36" height="36" alt="">`;
