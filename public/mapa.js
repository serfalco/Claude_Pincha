// "Sumate al mapa" (bloque Mística). Vanilla, sin dependencias. Habla con /api/mapa.
// Pide los datos recién cuando el bloque entra en pantalla. Los puntos van al globo con el evento "pinchas".
(() => {
  const el = document.querySelector('.mapa');
  if (!el || !window.fetch || !('IntersectionObserver' in window)) return;
  const btn = el.querySelector('.mapa__btn'), cuenta = el.querySelector('.mapa__cuenta'), nota = el.querySelector('.mapa__nota');
  const t = el.dataset, lang = document.documentElement.lang || 'es';
  const num = (n) => n.toLocaleString(lang);
  const guardado = () => { try { return localStorage.getItem('mapa') === '1'; } catch { return false; } };
  const pais = (iso) => { try { return new Intl.DisplayNames([lang], { type: 'region' }).of(iso); } catch { return iso; } };

  const pintar = (d, sumado) => {
    if (!d || !Array.isArray(d.puntos)) return;
    dispatchEvent(new CustomEvent('pinchas', { detail: d.puntos }));
    if (d.total > 0) { cuenta.querySelector('span').textContent = t.cuenta.replace('{n}', num(d.total)).replace('{p}', num(d.paises)); cuenta.hidden = false; }
    if (sumado) { btn.hidden = true; nota.textContent = t.gracias; nota.hidden = false; nota.classList.add('mapa__nota--ok'); return; }
    if (!d.vos) return;
    const donde = [d.vos.ciudad, pais(d.vos.pais)].filter(Boolean).join(', ');
    btn.querySelector('span').textContent = t.boton.replace('{c}', donde);
    btn.hidden = false; nota.hidden = false;
  };
  const pedir = (init) => fetch('/api/mapa', init).then((r) => (r.ok ? r.json() : null)).catch(() => null);

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    const d = await pedir({ method: 'POST' });
    btn.disabled = false;
    if (!d) return;
    try { localStorage.setItem('mapa', '1'); } catch {}
    pintar(d, true);
  });

  const io = new IntersectionObserver(async ([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    pintar(await pedir(), guardado());
  }, { rootMargin: '300px' });
  io.observe(el);
})();
