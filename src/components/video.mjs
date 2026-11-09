import { html } from '../lib/html.mjs';

// Video destacado de YouTube, sin cargar YouTube hasta que se toca "play" (el sitio sigue sin JavaScript).
// Truco "srcdoc": el iframe arranca con una miniatura y un botón; al tocarlo navega al reproductor real.
// Si hay versión vertical, se muestra en celulares y la horizontal en pantallas anchas.
const reproductor = (id, titulo, vertical) => {
  const thumb = `https://i.ytimg.com/vi/${id}/${vertical ? 'hqdefault' : 'maxresdefault'}.jpg`;
  const doc = `<style>*{margin:0;padding:0}html,body{height:100%;overflow:hidden;background:#000}a{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}span{position:relative;width:72px;height:72px;border-radius:50%;background:#d4001f;box-shadow:0 4px 18px rgba(0,0,0,.4)}span:after{content:"";position:absolute;left:29px;top:22px;border-style:solid;border-width:14px 0 14px 22px;border-color:transparent transparent transparent #fff}</style><a href="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1"><img src="${thumb}" alt=""><span></span></a>`;
  return html`<div class="video__marco${vertical ? ' video__marco--vertical' : ''}">
    <iframe srcdoc="${doc}" src="https://www.youtube-nocookie.com/embed/${id}?rel=0" title="${titulo}" loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
  </div>`;
};

export const video = ({ video: v }, { t }) =>
  v
    ? html`
<section class="video" aria-labelledby="video-titulo">
  <h2 class="video__kicker">${t.video.kicker}</h2>
  <article class="card video__card">
    <div class="video__horizontal${v.vertical ? ' tiene-vertical' : ''}">${reproductor(v.youtube, v.titulo)}</div>
    ${v.vertical ? html`<div class="video__vertical">${reproductor(v.vertical, v.titulo, true)}</div>` : ''}
    <div class="video__texto">
      <h3 id="video-titulo" class="video__titulo">${v.titulo}</h3>
      ${v.texto ? html`<p>${v.texto}</p>` : ''}
      ${v.credito ? html`<p class="meta">${v.credito}</p>` : ''}
      <p class="meta"><a href="https://www.youtube.com/watch?v=${v.youtube}" rel="noopener">${t.video.verEnYoutube} →</a></p>
    </div>
  </article>
</section>`
    : '';
