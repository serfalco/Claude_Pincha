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

  const CONDICIONES = ['local', 'visitante', 'neutral'];
  if (!data.proximos?.length) errores.push('proximos vacío');
  (data.proximos ?? []).forEach((p, i) => {
    if (!esTexto(p.rival) || !esFecha(p.fecha) || !esTexto(p.torneo) || !CONDICIONES.includes(p.condicion)) errores.push(`proximos[${i}] incompleto`);
  });
  if (!CONDICIONES.includes(data.ultimo?.condicion)) errores.push('ultimo.condicion inválida');

  (data.noticias ?? []).forEach((n, i) => {
    if (!esTexto(n.titulo) || !esFecha(n.fecha) || !esTexto(n.url)) errores.push(`noticias[${i}] incompleta`);
  });

  (data.posiciones ?? []).forEach((p, i) => {
    if (!esTexto(p.tabla) || !esNum(p.puesto)) errores.push(`posiciones[${i}] incompleta`);
  });
  if (data.club && (!esNum(data.club.socios) || !Array.isArray(data.club.balance?.datos))) errores.push('club incompleto');

  if (errores.length) throw new Error(`Datos inválidos en data/home.json:\n- ${errores.join('\n- ')}`);
  return data;
};
