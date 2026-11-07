// Aplica una traducción sobre los datos base (español).
// La traducción solo trae los textos; números, fechas y links salen siempre del archivo base.
// Los arrays se combinan posición por posición: si falta un elemento traducido, queda en español.
const esObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

export const combinar = (base, trad) => {
  if (trad === undefined) return base;
  if (Array.isArray(base)) return base.map((item, i) => combinar(item, Array.isArray(trad) ? trad[i] : undefined));
  if (esObj(base)) {
    const out = { ...base };
    for (const k of Object.keys(base)) if (esObj(trad) && k in trad) out[k] = combinar(base[k], trad[k]);
    return out;
  }
  return typeof trad === typeof base ? trad : base;
};

// Lista lo que quedó sin traducir (elementos de arrays o bloques nuevos), para avisar en el build.
export const pendientes = (base, trad, ruta = '') => {
  if (trad === undefined) return [ruta || '(todo)'];
  if (Array.isArray(base)) {
    const t = Array.isArray(trad) ? trad : [];
    return base.flatMap((item, i) => (typeof item === 'object' ? pendientes(item, t[i], `${ruta}[${i}]`) : i >= t.length && typeof item === 'string' ? [`${ruta}[${i}]`] : []));
  }
  if (esObj(base)) {
    return Object.keys(base).flatMap((k) => (esObj(trad) && k in trad ? pendientes(base[k], trad[k], ruta ? `${ruta}.${k}` : k) : []));
  }
  return [];
};
