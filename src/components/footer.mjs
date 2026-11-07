import { html } from '../lib/html.mjs';

export const footer = ({ simulado, actualizado }, { site, t }) => html`
<footer class="footer">
  <div class="wrap">
    ${simulado ? html`<p class="aviso">${t.footer.simulado}</p>` : ''}
    ${t.footer.traduccion ? html`<p>${t.footer.traduccion}</p>` : ''}
    <p>© ${new Date(actualizado).getFullYear()} ${site.nombre} · ${t.footer.hinchas}</p>
  </div>
</footer>`;
