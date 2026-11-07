import { html } from '../lib/html.mjs';
import { logo } from './logo.mjs';

// alternates: [{ lang, nombre, href, actual }]
export const header = ({ site, t, alternates, home }) => html`
<header class="header">
  <div class="wrap header__inner">
    <a class="brand" href="${home}" aria-label="${site.nombre}, ${t.inicio}">
      ${logo()}
      <span class="brand__name">El Pincha <strong>Hoy</strong></span>
    </a>
    <nav class="langs" aria-label="${t.idiomas}">
      ${alternates.map((a) =>
        a.actual
          ? html`<span class="langs__item is-actual" aria-current="true" title="${a.nombre}">${a.lang.toUpperCase()}</span>`
          : html`<a class="langs__item" href="${a.href}" hreflang="${a.lang}" lang="${a.lang}" title="${a.nombre}">${a.lang.toUpperCase()}</a>`
      )}
    </nav>
    <nav class="nav" aria-label="${t.secciones}">
      <ul class="menu">
        ${site.secciones.map((s) => html`<li><a href="${home}#${s}">${t.menu[s]}</a></li>`)}
      </ul>
    </nav>
  </div>
</header>`;
