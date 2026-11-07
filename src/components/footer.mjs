import { html } from '../lib/html.mjs';

export const footer = ({ simulado, actualizado }, { site, t, ruta }) => html`
<footer class="footer">
  <div class="wrap">
    ${simulado ? html`<p class="aviso">${t.footer.simulado}</p>` : ''}
    ${t.footer.traduccion ? html`<p>${t.footer.traduccion}</p>` : ''}
    ${ruta ? html`<p><a class="footer__link" href="${ruta('dias')}">${t.dia.todos}</a></p>` : ''}
    <p>© ${new Date(actualizado).getFullYear()} ${site.nombre} · ${t.footer.hinchas}</p>
  </div>
</footer>`;
