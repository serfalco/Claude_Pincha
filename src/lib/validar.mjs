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

// Reglas que miran los días anteriores (data/dias/): que la portada no quede igual día tras día.
// - Foto de Hoy: puede repetirse, pero como máximo 3 días seguidos; al 4.º hay que cambiarla.
// - Otros deportes e inferiores (básquet, vóley, Reserva…) en las Siete: como máximo 1 por día, solo si no hay
//   noticias del fútbol profesional, y nunca la misma dos días (ni el día siguiente ni otro).
export const MAX_DIAS_FOTO = 3;
export const OTRO_DEPORTE = /b[aá]squet|basket|v[oó]ley|hockey|rugby|handball|h[aá]ndbol|f[uú]tsal|futsal|nataci[oó]n|tenis|atletismo|patin|inferiores|reserva|juveniles|cuarta|quinta divisi|sexta|s[eé]ptima|novena|sub-?1\d|sub-?20|femenino|amateur/i;
export const validarHistorial = (data, dias) => {
  const errores = [];
  const hoyF = data.actualizado.slice(0, 10);
  const previos = dias.filter((d) => d.fecha < hoyF).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const es = (o) => (typeof o === 'string' ? o : o?.es ?? '');
  const id = data.hoy?.foto?.id;
  if (id) {
    let seguidos = 0;
    for (const d of previos) { if (d.foto?.id === id) seguidos++; else break; }
    if (seguidos >= MAX_DIAS_FOTO) errores.push(`hoy.foto: "${id}" ya estuvo ${seguidos} días seguidos (máximo ${MAX_DIAS_FOTO}); elegir otra del banco`);
  }
  const otros = (data.hoy?.siete ?? []).filter((n) => OTRO_DEPORTE.test(n.titulo));
  if (otros.length > 1) errores.push(`hoy.siete: ${otros.length} noticias de otros deportes o inferiores (${otros.map((n) => n.titulo).join(' / ')}); máximo 1 y solo si no hay del fútbol profesional`);
  const norm = (x) => x.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');
  const usadas = new Map(previos.flatMap((d) => (d.siete ?? []).filter((n) => OTRO_DEPORTE.test(es(n.titulo))).map((n) => [norm(es(n.titulo)), d.fecha])));
  for (const n of otros) if (usadas.has(norm(n.titulo))) errores.push(`hoy.siete: "${n.titulo}" ya salió el ${usadas.get(norm(n.titulo))}; las de otros deportes o inferiores van un solo día`);
  if (errores.length) throw new Error(`Datos inválidos en data/home.json (comparado con días anteriores):\n- ${errores.join('\n- ')}`);
};
