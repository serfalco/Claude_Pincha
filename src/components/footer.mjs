import { html } from '../lib/html.mjs';

export const footer = ({ nombre, simulado, anio }) => html`
<footer class="footer">
  <div class="wrap">
    ${simulado ? html`<p class="aviso">Datos de ejemplo: el sitio está en construcción.</p>` : ''}
    <p>© ${anio} ${nombre} · Sitio de hinchas, sin relación oficial con el Club Estudiantes de La Plata.</p>
  </div>
</footer>`;
