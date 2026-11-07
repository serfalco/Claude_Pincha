import { html } from '../lib/html.mjs';
import { logo } from './logo.mjs';

export const header = ({ nombre, menu }) => html`
<header class="header">
  <div class="wrap header__inner">
    <a class="brand" href="/" aria-label="${nombre}, inicio">
      ${logo()}
      <span class="brand__name">El Pincha <strong>Hoy</strong></span>
    </a>
    <nav aria-label="Secciones">
      <ul class="menu">
        ${menu.map((m) => html`<li><a href="${m.href}">${m.texto}</a></li>`)}
      </ul>
    </nav>
  </div>
</header>`;
