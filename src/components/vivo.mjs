import { html, raw } from '../lib/html.mjs';

// Partido en vivo. Ocupa el lugar de la franja y la cuenta regresiva solo mientras se juega:
// el HTML sale vacío y oculto; el script se activa desde 30 min antes del próximo partido hasta 5 h después,
// consulta /api/vivo (functions/api/vivo.js) cada 30 s y arma marcador, goleadores y hechos con los textos del idioma.
// Si la API falla o no hay partido, no se muestra nada y queda la franja de siempre.
export const vivo = ({ proximos }, { t, f }) => {
  const p = proximos?.[0];
  if (!p) return '';
  const cfg = { fecha: p.fecha, torneo: p.torneo, instancia: p.instancia ?? '', t: t.vivo };
  return html`
<section class="vivo" aria-live="polite" aria-labelledby="vivo-titulo" hidden>
  <p class="vivo__kicker"><span class="dot" aria-hidden="true"></span><span id="vivo-titulo">${t.vivo.kicker} · ${p.torneo}</span></p>
  <div class="vivo__caja">
    <div class="vivo__top"><span class="vivo__ronda"></span><span class="vivo__tag"></span></div>
    <div class="vivo__marcador">
      <div class="vivo__eq vivo__eq--l"><span class="vivo__nombre"></span><ul class="vivo__goles"></ul></div>
      <strong class="vivo__res"></strong>
      <div class="vivo__eq vivo__eq--v"><span class="vivo__nombre"></span><ul class="vivo__goles"></ul></div>
    </div>
    <p class="vivo__min"></p>
  </div>
  <ol class="vivo__eventos"></ol>
  <p class="vivo__nota">${t.vivo.nota}</p>
</section>
<script type="application/json" id="vivo-cfg">${raw(JSON.stringify(cfg).replace(/</g, '\\u003c'))}</script>
<script src="/vivo.js" defer></script>`;
};
