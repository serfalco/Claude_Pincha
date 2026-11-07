import { html } from '../lib/html.mjs';
import { fechaCorta } from '../lib/fechas.mjs';

export const noticias = ({ noticias: lista }) => html`
<section id="noticias" class="wrap block" aria-labelledby="noticias-titulo">
  <h2 id="noticias-titulo" class="block__title">Noticias</h2>
  <ul class="news">
    ${lista.map(
      (n) => html`<li class="news__item">
      <article>
        <h3 class="news__title"><a href="${n.url}">${n.titulo}</a></h3>
        ${n.bajada ? html`<p class="news__bajada">${n.bajada}</p>` : ''}
        <p class="meta"><time datetime="${n.fecha}">${fechaCorta(n.fecha)}</time>${n.fuente ? ` · ${n.fuente}` : ''}</p>
      </article>
    </li>`
    )}
  </ul>
</section>`;
