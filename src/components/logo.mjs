import { html } from '../lib/html.mjs';

// Escudo oficial de Estudiantes de La Plata, usado con autorización del club.
// Archivo: public/escudo.png (44×72, se muestra a 22×36 para pantallas de alta densidad).
export const logo = () => html`<img class="brand__logo" src="/escudo.png" width="22" height="36" alt="">`;
