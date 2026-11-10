import { html, raw } from '../lib/html.mjs';
import { icono } from './iconos.mjs';
import { mascotaSVG, estadoPorResultado } from './mascota.mjs';

// Franja "en un vistazo" debajo del titular: próximo partido + último resultado,
// y cuenta regresiva al partido marcado como `destacado` (ej. la final).
const DIA = 86400e3;
const diasHasta = (iso, desde, zona) => {
  // Diferencia en días de calendario en hora argentina.
  const d = (x) => new Date(new Intl.DateTimeFormat('sv-SE', { timeZone: zona }).format(x) + 'T00:00:00Z').getTime();
  return Math.round((d(new Date(iso)) - d(desde)) / DIA);
};

export const franja = ({ proximos, ultimo: u }, { t, f, site }) => {
  const p = proximos[0];
  const estado = estadoPorResultado(u.golesPropios, u.golesRival);
  const dest = proximos.find((x) => x.destacado);
  const n = dest ? diasHasta(dest.fecha, new Date(), site.zonaHoraria) : null;
  return html`
<div class="franja">
  <a class="franja__item" href="#partidos">
    <span class="franja__label">${icono('calendario')}${t.proximo}</span>
    <span class="franja__rival">${t.vs} ${p.rival}</span>
    <span class="franja__dato"><time datetime="${p.fecha}">${f.corta(p.fecha)} · ${f.hora(p.fecha)}</time></span>
    <span class="franja__meta">${p.torneo}</span>
  </a>
  <a class="franja__item franja__item--ultimo" href="#partidos">
    <span class="franja__label">${icono('marcador')}${t.ultimo}</span>
    <span class="franja__rival">${t.vs} ${u.rival}</span>
    <span class="franja__dato">${u.golesPropios} - ${u.golesRival}</span>
    <span class="franja__meta">${t.estados[estado]}</span>
    <span class="franja__mascota" aria-hidden="true">${raw(mascotaSVG(estado, { titulo: false }))}</span>
  </a>
</div>
${dest && n >= 0
  ? html`<a class="cuenta" href="#partidos" data-fecha="${dest.fecha}">
  <span class="cuenta__ico">${icono('copa')}</span>
  <span class="cuenta__texto">
    <span class="cuenta__que">${dest.torneo} · ${dest.instancia ?? ''} ${t.vs} ${dest.rival}</span>
    <strong class="cuenta__num" data-t0="${t.cuenta.hoy}" data-t1="${t.cuenta.manana}" data-tn="${t.cuenta.faltan(0)}">${n === 0 ? t.cuenta.hoy : n === 1 ? t.cuenta.manana : t.cuenta.faltan(n)}</strong>
    <span class="cuenta__cuando">${f.larga(dest.fecha)} · ${f.hora(dest.fecha)}</span>
  </span>
</a>
<script>${raw(`(()=>{const e=document.querySelector('.cuenta');if(!e)return;const z='${site.zonaHoraria}',k=x=>new Date(new Intl.DateTimeFormat('sv-SE',{timeZone:z}).format(x)+'T00:00:00Z'),n=Math.round((k(new Date(e.dataset.fecha))-k(new Date()))/864e5),s=e.querySelector('.cuenta__num');if(n<0){e.remove();return}s.textContent=n===0?s.dataset.t0:n===1?s.dataset.t1:s.dataset.tn.replace('0',n)})()`)}</script>`
  : ''}`;
};
