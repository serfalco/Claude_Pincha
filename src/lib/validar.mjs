// Validación liviana de los datos: si falta algo, el build falla con un mensaje claro
// en vez de publicar una home rota. Cuando los datos lleguen de un Worker o de la IA, esto los protege igual.
const esFecha = (v) => typeof v === 'string' && !Number.isNaN(Date.parse(v));
const esTexto = (v) => typeof v === 'string' && v.trim() !== '';
const esNum = (v) => Number.isInteger(v);

const reglas = {
  actualizado: esFecha,
  'hoy.titular': esTexto,
  'hoy.resumen': esTexto,
  'ultimo.rival': esTexto,
  'ultimo.fecha': esFecha,
  'ultimo.golesPropios': esNum,
  'ultimo.golesRival': esNum,
  'tabla.nombre': esTexto,
};

const get = (obj, path) => path.split('.').reduce((o, k) => o?.[k], obj);

export const validarHome = (data) => {
  const errores = Object.entries(reglas)
    .filter(([path, ok]) => !ok(get(data, path)))
    .map(([path]) => `campo inválido o faltante: ${path}`);

  (data.tabla?.filas ?? []).forEach((f, i) => {
    if (!esTexto(f.equipo) || !esNum(f.pj) || !esNum(f.pts) || !esNum(f.dg)) errores.push(`tabla.filas[${i}] incompleta`);
  });
  if (!data.tabla?.filas?.length) errores.push('tabla.filas vacía');

  (data.hoy?.linea ?? []).forEach((n, i) => {
    if (!esFecha(n.hora) || !esTexto(n.texto)) errores.push(`hoy.linea[${i}] incompleta`);
  });
  const CONDICIONES = ['local', 'visitante', 'neutral'];
  if (!data.proximos?.length) errores.push('proximos vacío');
  (data.proximos ?? []).forEach((p, i) => {
    if (!esTexto(p.rival) || !esFecha(p.fecha) || !esTexto(p.torneo) || !CONDICIONES.includes(p.condicion)) errores.push(`proximos[${i}] incompleto`);
  });
  if (!CONDICIONES.includes(data.ultimo?.condicion)) errores.push('ultimo.condicion inválida');

  // Siete noticias: exactamente 7, cada una con título y texto; sin links ni fuente (se leen ahí).
  if (data.hoy?.siete) {
    if (data.hoy.siete.length !== 7) errores.push(`hoy.siete: tiene ${data.hoy.siete.length} noticias (tienen que ser 7)`);
    data.hoy.siete.forEach((n, i) => {
      if (!esTexto(n.titulo) || !esTexto(n.texto)) errores.push(`hoy.siete[${i}] incompleta (titulo y texto)`);
      if (n.url || n.fuente) errores.push(`hoy.siete[${i}]: sin url ni fuente (eso va en hoy.linea)`);
    });
  }
  (data.hoy?.linea ?? []).forEach((n, i) => {
    if (!esTexto(n.fuente) || !esTexto(n.url)) errores.push(`hoy.linea[${i}]: Notipinchas lleva fuente y url`);
  });

  (data.posiciones ?? []).forEach((p, i) => {
    if (!esTexto(p.tabla) || !esNum(p.puesto)) errores.push(`posiciones[${i}] incompleta`);
  });
  if (data.club && (!esNum(data.club.socios) || !Array.isArray(data.club.balance?.datos))) errores.push('club incompleto');

  // Variedad de fuentes en "Notipinchas en los medios": máximo 3 ítems por fuente (el club cuenta como una más).
  const cuenta = (lista) => lista.reduce((a, n) => ({ ...a, [n.fuente]: (a[n.fuente] ?? 0) + 1 }), {});
  const linea = data.hoy?.linea ?? [];
  if (linea.length > 14) errores.push(`hoy.linea: ${linea.length} notas (máximo 14)`);
  for (const [nombre, lista, max] of [['hoy.linea', linea, 3]]) {
    for (const [f, n] of Object.entries(cuenta(lista))) if (n > max) errores.push(`${nombre}: ${n} ítems de "${f}" (máximo ${max}); usar otras fuentes`);
  }

  if (errores.length) throw new Error(`Datos inválidos en data/home.json:\n- ${errores.join('\n- ')}`);
  return data;
};
