import { icono } from './iconos.mjs';
import { html } from '../lib/html.mjs';

export const noticias = ({ noticias: lista }, { t, f }) => html`
<section id="noticias" class="wrap block" aria-labelledby="noticias-titulo">
  <h2 id="noticias-titulo" class="block__title">${icono('diario')}${t.noticias}</h2>
  <ul class="news">
    ${lista.map(
      (n) => html`<li class="news__item">
      <article>
        <h3 class="news__title"><a href="${n.url}" rel="noopener">${n.titulo}</a></h3>
        ${n.bajada ? html`<p class="news__bajada">${n.bajada}</p>` : ''}
        <p class="meta"><time datetime="${n.fecha}">${f.corta(n.fecha)}</time>${n.fuente ? ` · ${n.fuente}` : ''}</p>
      </article>
    </li>`
    )}
  </ul>
</section>`;
