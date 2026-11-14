// Globo giratorio de filiales (bloque Mística). Vanilla, sin dependencias.
// Reemplaza a public/globo-filiales.svg (que queda como versión sin JS / movimiento reducido).
// Tierra: máscara de bits de puntos cada 2° (filas de latitud con paso de longitud ∝ 1/cos(lat)).
(() => {
  const img = document.querySelector('.mistica__globo');
  if (!img || matchMedia('(prefers-reduced-motion: reduce)').matches || !window.CanvasRenderingContext2D) return;
  const LAND = 'AAAAADQAAH6AAMAeAQAA9gOAAAAeHwA4AoA5PgDiDwDAOD4A1P8D/EvFBzjw///5/2cOwPf//7/+/zuGwfb////j/z+IAWD/////D///YRAA7v///58Bw//hAQA4////PwgA4P/xAICY////fxAAAP+/HwAY+P///w8MAAD/vz8AUP//////QwAA4P//BwDw//////8HAAAA/v9PAAD//////38AAACA//9FAAD+v/////8BAAAA+P9/AQDA93X+//9/AAAAAPz/PwAA4NGD+f///xgAAACA//8HAAA4+u75//9/AAAAAAD//wcAAPBA/ef//z9CAAAAAOD/fwAAABwD/vP//38iAAAAAMD//wAAAOAPwP/////oAQAAAAD4/wcAAAD+A/j///9/CAAAAAAA6P8DAAAA/s/9/////wEAAAAAAAB/EAAAAPD//7////8/AAAAAAAA0A8EAAAA/v+/n////w8AAAAAAACADwAAAAD8///+gv//vwAAAAAAAADwgAAAAOD//5//4P//FwAAAAAAAAB4hAEAAPD//99/wJ+/AAAAAAAIAADwDAgAAOD//3//gB9+AQAAAAAAAAAAPwAAAAD////3A3jgBwQAAAAAAAAAAB8AAADg////HQAO8IMAAAAAAAAAAAAGAAAA+P///wIAB+jBAAAAAAAAAAAAggMAAPD///8ZAAbAgQAAAAAAAAAAAOB/AADA////PwAIAAAAAAAAAAAAAAAA/gMAAPz///8AgAACIAAAAAAAAAAAAPD/AADA4v//BwAANDAAAAAAAAAAAACA/x8AAAD4/x8AAIDCAQAAAAAAAAAAAPz/AQAAgP//AAAAGF4AAAAAAAAAAADA/38AAAD8/wcAAADjgQEAAAAAAAAAAPz/PwAAgP8/AAAAYG7UAQAAAAAAAADg//8HAAD4/wEAAAACBDwAAAAAAAAAAP7/fwAAgP8PAAAA4AHgQwAAAAAAAADw//8DAAD+fwAAAAAAABoAAAAAAAAAwP//AwAA+P8AAAAAAAAEAAAAAAAAAID//wMAAPj/EAAAAABwAgAAAAAAAADA//8AAAD+fwQAAACAjwEAAAAAAAAAwP8fAADA/+cAAAAA+DsAAAAAAAAAAPz/AAAA/g8DAAAA8P8AAAAAAAAAAPj/AQAA/A8HAAAA/P8DAAAAAAAAAPh/AAAA/IcBAACA//8BAAAAAAAAAP8DAADAfxgAAAD4/x8AAAAAAAAA/AcAAAD/AAAAAPD/HwAAAAAAAAD/AwAAgB8AAAAA/P8DAAAAAAAA8B8AAAD4AAAAAPD/DwAAAAAAAOAfAAAAeAAAAADw8AcAAAAAAAD4AQAAAAAAAAAAAT8AAAAAAADgBwAAAAAAAAAAADwAAAAAAAD4AAAAAAAAAAAAAAAQAAAAAMABAAAAAAAAAAAAAhAAAAAA4AAAAAAAAAAAACCAAAAAAIADAAAAAAAAAAAAMAAAAADgAAAAAAAAAAAAAAAAAADAAQAAAAAAAAAAAAAAAAAYAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAO8BAAAQAECf/x8AAAiA////A4Aw8P///8D7wP//P/gH/v8//NP///Hn/w///9f///8=';
  const LP = [-57.95, -34.92];
  const EXT = [[-0.48,38.35],[2.17,41.39],[1.43,38.91],[-4.42,36.72],[2.65,39.57],[-0.38,39.47],[9.09,45.81],[12.5,41.9],[-41.88,-22.75],[-51.23,-30.03],[-0.13,51.51],[34.78,32.09],[54.37,24.45],[-97.14,49.9],[-99.13,19.43],[-79.52,8.98],[-82.38,23.13],[-66.9,10.49],[-74.07,4.71],[-79.89,-2.17],[-77.04,-12.05],[-68.15,-16.5],[-70.67,-33.45],[-54.95,-34.96]];
  const ARG = [[-60.5,-36.6,25],[-65.3,-25,14],[-63.5,-31.5,10],[-58.45,-34.6,9],[-68.5,-42,8],[-68.5,-33,2]];
  const R = Math.PI / 180;
  const v3 = ([lo, la]) => [Math.cos(la * R) * Math.cos(lo * R), Math.cos(la * R) * Math.sin(lo * R), Math.sin(la * R)];
  const raw = atob(LAND), dots = [];
  let k = 0;
  for (let lat = 89; lat > -90; lat -= 2) {
    const n = Math.max(1, Math.round(180 * Math.cos(lat * R)));
    for (let i = 0; i < n; i++, k++) if (raw.charCodeAt(k >> 3) & (1 << (k & 7))) dots.push(v3([-180 + (i + .5) * 360 / n, lat]));
  }
  // Arcos por gran círculo (slerp) desde La Plata, con una leve elevación sobre la superficie.
  const a0 = v3(LP);
  const arcs = EXT.map((p) => {
    const b = v3(p), w = Math.acos(Math.min(1, a0[0]*b[0] + a0[1]*b[1] + a0[2]*b[2])), s = Math.sin(w);
    return Array.from({ length: 48 }, (_, i) => {
      const t = i / 47, f1 = Math.sin((1 - t) * w) / s, f2 = Math.sin(t * w) / s, h = 1 + Math.sin(Math.PI * t) * w * 0.12;
      return [0, 1, 2].map((j) => (f1 * a0[j] + f2 * b[j]) * h);
    });
  });
  const pts = EXT.map(v3), arg = ARG.map((a) => [v3(a), a[2]]);
  // Hinchas que se sumaron al mapa (los manda public/mapa.js): [[lon, lat, n], …]
  let fans = [];
  addEventListener('pinchas', (e) => { fans = e.detail.map(([lo, la, n]) => [v3([lo, la]), n]); });

  // Nombres al pasar el mouse (solo en pantallas con mouse; en el celular no se activa nada).
  let nombres = { ext: [], arg: {} };
  try { nombres = { ...nombres, ...JSON.parse(img.dataset.etiquetas || '{}') }; } catch {}
  const conMouse = matchMedia('(hover: hover) and (pointer: fine)').matches;
  let mouse = null;
  const cv = document.createElement('canvas');
  cv.className = img.className; cv.setAttribute('aria-hidden', 'true');
  const ctx = cv.getContext('2d');
  let W = 0, dpr = 1, visible = true, start = performance.now();
  const box = img.parentElement;
  const size = () => { dpr = Math.min(2, devicePixelRatio || 1); W = Math.min(box.clientWidth, 460); cv.width = cv.height = Math.round(W * dpr); cv.style.width = cv.style.height = W + 'px'; };
  const tilt = -22 * R; // muestra más el hemisferio sur
  const proj = (p, rot) => {
    const c = Math.cos(rot), s = Math.sin(rot);
    const x = p[0] * c - p[1] * s, y = p[0] * s + p[1] * c, z = p[2];
    const ct = Math.cos(tilt), st = Math.sin(tilt);
    const x2 = x * ct + z * st, z2 = -x * st + z * ct; // inclinación hacia el sur
    return [y, -z2, x2]; // pantalla x, pantalla y, profundidad (>0 = cara visible)
  };
  const frame = (now) => {
    if (!visible) return;
    const r = W * dpr * 0.44, cx = W * dpr / 2, cy = W * dpr / 2;
    // Vaivén entre las Américas y Medio Oriente (donde están todas las filiales), arranca sobre La Plata.
    const rot = (-42 + 57 * Math.sin((now - start) / 1000 * 0.2 - 0.266)) * R;
    const rr = -rot;
    ctx.clearRect(0, 0, cv.width, cv.height);
    // halo + océano
    let g = ctx.createRadialGradient(cx, cy, r * .92, cx, cy, r * 1.12);
    g.addColorStop(0, 'rgba(211,18,47,0)'); g.addColorStop(.35, 'rgba(211,18,47,.45)'); g.addColorStop(1, 'rgba(211,18,47,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r * 1.12, 0, 7); ctx.fill();
    g = ctx.createRadialGradient(cx - r * .3, cy - r * .4, r * .1, cx, cy, r);
    g.addColorStop(0, '#2a2a33'); g.addColorStop(1, '#0b0b0e');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
    // tierra
    const ds = Math.max(1.2, r / 115);
    for (const d of dots) {
      const [x, y, z] = proj(d, rr); if (z <= 0) continue;
      ctx.fillStyle = 'rgba(255,255,255,' + (0.18 + z * 0.5).toFixed(2) + ')';
      ctx.fillRect(cx + x * r - ds / 2, cy + y * r - ds / 2, ds, ds);
    }
    // arcos
    ctx.lineWidth = 1.3 * dpr; ctx.strokeStyle = 'rgba(255,51,82,.85)';
    const dash = ((now - start) / 40) % 16;
    ctx.setLineDash([3 * dpr, 5 * dpr]); ctx.lineDashOffset = -dash * dpr;
    for (const a of arcs) {
      ctx.beginPath(); let on = false;
      for (const p of a) { const [x, y, z] = proj(p, rr); if (z > 0 || x * x + y * y > 1) { on ? ctx.lineTo(cx + x * r, cy + y * r) : ctx.moveTo(cx + x * r, cy + y * r); on = true; } else on = false; }
      ctx.stroke();
    }
    ctx.setLineDash([]);
    // puntos con brillo
    ctx.shadowColor = '#ff2443'; ctx.shadowBlur = 10 * dpr;
    const marcas = [];
    for (const [p, c] of arg) { const [x, y, z] = proj(p, rr); if (z <= 0) continue; if (mouse && nombres.arg[c]) marcas.push([cx + x * r, cy + y * r, nombres.arg[c]]); ctx.fillStyle = '#ff3352'; ctx.beginPath(); ctx.arc(cx + x * r, cy + y * r, (1.6 + Math.sqrt(c) * .9) * dpr, 0, 7); ctx.fill(); }
    for (const [i, p] of pts.entries()) { const [x, y, z] = proj(p, rr); if (z <= 0) continue; if (mouse && nombres.ext[i]) marcas.push([cx + x * r, cy + y * r, nombres.ext[i]]); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx + x * r, cy + y * r, 2.4 * dpr, 0, 7); ctx.fill(); }
    ctx.shadowColor = '#f5c84b'; ctx.shadowBlur = 8 * dpr; ctx.fillStyle = '#f5c84b';
    for (const [p, c] of fans) { const [x, y, z] = proj(p, rr); if (z <= 0) continue; ctx.beginPath(); ctx.arc(cx + x * r, cy + y * r, Math.min(6, 1.8 + Math.log2(c) * .6) * dpr, 0, 7); ctx.fill(); }
    ctx.shadowBlur = 0;
    // La Plata: punto + onda
    const [x, y, z] = proj(a0, rr);
    if (z > 0) {
      const ph = ((now - start) % 2400) / 2400;
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx + x * r, cy + y * r, 5 * dpr, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,' + (1 - ph).toFixed(2) + ')'; ctx.lineWidth = 2 * dpr;
      ctx.beginPath(); ctx.arc(cx + x * r, cy + y * r, (5 + ph * 16) * dpr, 0, 7); ctx.stroke();
    }
    // etiqueta de la filial más cercana al mouse (a menos de 16 px)
    if (mouse) {
      let m = null, dm = 16 * dpr;
      for (const k of marcas) { const d = Math.hypot(k[0] - mouse[0] * dpr, k[1] - mouse[1] * dpr); if (d < dm) { dm = d; m = k; } }
      if (m) {
        ctx.font = `700 ${13 * dpr}px system-ui, sans-serif`;
        const w = ctx.measureText(m[2]).width + 16 * dpr, h = 24 * dpr;
        const bx = Math.max(2, Math.min(cv.width - w - 2, m[0] - w / 2)), by = m[1] - h - 10 * dpr < 2 ? m[1] + 10 * dpr : m[1] - h - 10 * dpr;
        ctx.fillStyle = 'rgba(12,12,15,.92)'; ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = dpr;
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(bx, by, w, h, 7 * dpr) : ctx.rect(bx, by, w, h); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.fillText(m[2], bx + 8 * dpr, by + h / 2 + dpr);
      }
    }
    requestAnimationFrame(frame);
  };
  size(); img.replaceWith(cv);
  if (conMouse) {
    cv.addEventListener('mousemove', (e) => { const b = cv.getBoundingClientRect(); mouse = [e.clientX - b.left, e.clientY - b.top]; });
    cv.addEventListener('mouseleave', () => { mouse = null; });
  }
  addEventListener('resize', () => { if (Math.abs(Math.min(box.clientWidth, 460) - W) > 1) size(); });
  new IntersectionObserver(([e]) => { const was = visible; visible = e.isIntersecting; if (visible && !was) requestAnimationFrame(frame); }).observe(cv);
  requestAnimationFrame(frame);
})();
