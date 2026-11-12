// Partido en vivo (ver src/components/vivo.mjs y functions/api/vivo.js). Sin dependencias.
(() => {
  const el = document.querySelector('.vivo');
  const cfgEl = document.getElementById('vivo-cfg');
  if (!el || !cfgEl) return;
  const cfg = JSON.parse(cfgEl.textContent);
  const T = cfg.t;
  const prueba = new URLSearchParams(location.search).get('vivo'); // ?vivo=<id ESPN> para probar con otro partido
  const ini = new Date(cfg.fecha).getTime() - 30 * 60e3;
  const fin = new Date(cfg.fecha).getTime() + 5 * 3600e3;
  if (!prueba && (Date.now() < ini - 6 * 3600e3 || Date.now() > fin)) return; // fuera del día: nada que hacer

  const $ = (s, r = el) => r.querySelector(s);
  const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const fmt = (s, o) => s.replace(/\{(\w)\}/g, (_, k) => esc(o[k] ?? ''));
  const titulo = document.getElementById('hoy-titulo');
  const tituloOriginal = titulo?.textContent;
  let visto = 0;
  let timer;

  const goleadores = (d, propio) => {
    const porJugador = new Map();
    for (const e of d.eventos) {
      if (e.tipo !== 'gol' || (e.equipo === 'propio') !== propio) continue;
      const k = (e.jugador ?? '') + (e.ec ? ' ' + T.ec : '');
      porJugador.set(k, [...(porJugador.get(k) ?? []), e.min + (e.pen ? ' ' + T.pen : '')]);
    }
    return [...porJugador].map(([j, m]) => `<li>⚽ ${esc(j)} ${esc(m.join(', '))}</li>`).join('');
  };

  const texto = (e, rival) => {
    const o = { j: e.jugador, s: e.sale, r: rival };
    if (e.tipo === 'gol') {
      const base = e.equipo === 'propio' ? `<b>${esc(T.ev.golPropio)}</b>` : `<b>${fmt(T.ev.golRival, o)}</b>`;
      return base + (e.jugador ? ` · ${esc(e.jugador)}${e.ec ? ' ' + esc(T.ec) : ''}${e.pen ? ' ' + esc(T.pen) : ''}` : '');
    }
    const s = T.ev[e.tipo];
    return s ? fmt(s, o) + (e.equipo === 'rival' && ['amarilla', 'roja', 'cambio'].includes(e.tipo) ? ` <span class="vivo__rival">(${esc(rival)})</span>` : '') : '';
  };
  const ICONO = { gol: '⚽', amarilla: '🟨', roja: '🟥', cambio: '🔁', inicio: '▶️', entretiempo: '⏸️', segundo: '▶️' };

  const pintar = (d) => {
    const [L, V] = [d.local, d.visitante];
    const yo = L.propio ? L : V;
    const otro = L.propio ? V : L;
    const dif = yo.goles - otro.goles + ((yo.penales ?? 0) - (otro.penales ?? 0));
    const final = d.estado === 'post';
    const clave = (final ? 'fin_' : '') + (dif > 0 ? 'gana' : dif < 0 ? 'pierde' : 'empata');

    $('.vivo__ronda').textContent = [cfg.instancia, d.estadio].filter(Boolean).join(' · ');
    $('.vivo__tag').textContent = final ? T.final : T.etiqueta;
    $('.vivo__tag').classList.toggle('vivo__tag--fin', final);
    $('#vivo-titulo').textContent = `${final ? T.final : T.kicker} · ${cfg.torneo}`;
    el.classList.toggle('vivo--fin', final);
    const eqs = el.querySelectorAll('.vivo__eq');
    [L, V].forEach((x, i) => {
      $('.vivo__nombre', eqs[i]).textContent = x.propio ? 'Estudiantes' : x.nombre.trim();
      $('.vivo__goles', eqs[i]).innerHTML = goleadores(d, x.propio);
    });
    $('.vivo__res').textContent = `${L.goles} - ${V.goles}`;
    const pen = L.penales != null && V.penales != null ? ' · ' + fmt(T.penales, { l: L.penales, v: V.penales }) : '';
    // Terminado: la etiqueta de arriba ya dice "Terminó"; la pastilla solo queda si hubo penales.
    const min = final ? pen.replace(' · ', '') : (d.entretiempo ? T.entretiempo : d.reloj) + pen;
    $('.vivo__min').textContent = min;
    $('.vivo__min').hidden = !min;

    const evs = d.eventos.filter((e) => ICONO[e.tipo]);
    $('.vivo__eventos').innerHTML = evs
      .map((e, i) => `<li class="vivo__ev${i >= visto && visto ? ' vivo__ev--nuevo' : ''}"><span class="vivo__m">${esc(e.min || (e.tipo === 'inicio' ? "0'" : ''))}</span><span aria-hidden="true">${ICONO[e.tipo]}</span><span>${texto(e, otro.nombre.trim())}</span></li>`)
      .reverse()
      .join('');
    visto = evs.length;

    if (titulo) titulo.textContent = T.titular[clave];
    el.hidden = false;
    document.querySelectorAll('.franja, .cuenta').forEach((x) => (x.hidden = true));
  };

  const ocultar = () => {
    el.hidden = true;
    if (titulo && tituloOriginal) titulo.textContent = tituloOriginal;
    document.querySelectorAll('.franja, .cuenta').forEach((x) => (x.hidden = false));
  };

  const consultar = async () => {
    clearTimeout(timer);
    const ahora = Date.now();
    if (!prueba && ahora < ini) { timer = setTimeout(consultar, ini - ahora); return; }
    if (!prueba && ahora > fin) { ocultar(); return; }
    try {
      const r = await fetch('/api/vivo' + (prueba ? `?evento=${encodeURIComponent(prueba)}` : ''), { cache: 'no-store' });
      const d = await r.json();
      if ((d.estado === 'in' || d.estado === 'post') && d.local && d.visitante) pintar(d);
      else if (d.estado !== 'error') ocultar();
      if (d.estado === 'post' && el.hidden === false) return; // terminó: queda el resultado final, no se consulta más
    } catch { /* sin conexión: se reintenta */ }
    if (!document.hidden) timer = setTimeout(consultar, 30e3);
  };

  document.addEventListener('visibilitychange', () => { if (!document.hidden) consultar(); else clearTimeout(timer); });
  consultar();
})();
