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
// - Foto de Hoy: como máximo 2 días seguidos (al 3.º, otra) y no volver a una usada en los últimos 14 días.
// - Siete noticias, rotación: cada una lleva `tema` (slug estable, el mismo mientras sea la misma historia).
//   Edad = días seguidos que lleva el tema (hoy cuenta como 1). Una noticia baja un puesto por día:
//   puesto ≥ edad (día 1: cualquier puesto; día 2: del 2 al 7; … día 7: solo el 7) y al 8.º día sale,
//   aunque siga vigente. Lo que tiene `vence` (venta, ventana de socios) puede ir arriba, pero el tope de 7 días vale igual.
//   Puede volver con al menos 2 días afuera (arranca de nuevo en edad 1), o antes solo con `novedad`
//   (frase con el hecho nuevo confirmado: "Correa recibió el alta"), que reinicia la edad; la misma novedad no se repite.
// - Otros deportes e inferiores (básquet, vóley, Reserva…) en las Siete: como máximo 1 por día, solo si no hay
//   noticias del fútbol profesional, y nunca la misma dos días (ni el día siguiente ni otro).
export const MAX_DIAS_FOTO = 2;
export const FOTO_SIN_REPETIR_DIAS = 14;
export const MAX_DIAS_NOTICIA = 7;
export const DESCANSO_NOTICIA = 2;
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
    else if (seguidos === 0) {
      const limite = new Date(Date.parse(`${hoyF}T12:00:00Z`) - FOTO_SIN_REPETIR_DIAS * 864e5).toISOString().slice(0, 10);
      const antes = previos.find((d) => d.fecha >= limite && d.foto?.id === id);
      if (antes) errores.push(`hoy.foto: "${id}" ya se usó el ${antes.fecha}; no repetir una foto de los últimos ${FOTO_SIN_REPETIR_DIAS} días`);
    }
  }
  // Rotación de las Siete (días seguidos = archivos de días consecutivos en data/dias/).
  const diaAntes = (f, n) => new Date(Date.parse(`${f}T12:00:00Z`) - n * 864e5).toISOString().slice(0, 10);
  const porFecha = new Map(previos.map((d) => [d.fecha, d]));
  const temaEn = (f, tema) => (porFecha.get(f)?.siete ?? []).find((n) => n.tema === tema);
  const vistos = new Set();
  (data.hoy?.siete ?? []).forEach((n, i) => {
    const puesto = i + 1;
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(n.tema ?? '')) { errores.push(`hoy.siete[${i}] "${n.titulo}": falta "tema" (slug estable, ej. "correa-lesion")`); return; }
    if (vistos.has(n.tema)) errores.push(`hoy.siete: el tema "${n.tema}" está dos veces`);
    vistos.add(n.tema);
    let edad = 1;
    if (n.novedad) {
      const usada = previos.find((d) => (d.siete ?? []).some((x) => x.tema === n.tema && x.novedad === n.novedad));
      if (usada) errores.push(`hoy.siete[${i}] "${n.titulo}": la novedad "${n.novedad}" ya se usó el ${usada.fecha}; si no hay un hecho nuevo, no reinicia`);
      if (!esTexto(n.novedad)) errores.push(`hoy.siete[${i}].novedad vacía`);
    } else {
      for (let k = 1; temaEn(diaAntes(hoyF, k), n.tema) && !temaEn(diaAntes(hoyF, k), n.tema).novedad; k++) edad++;
      if (temaEn(diaAntes(hoyF, edad), n.tema)?.novedad) edad++; // el día de la novedad cuenta como día 1
      if (edad === 1 && [...Array(DESCANSO_NOTICIA - 1)].some((_, j) => temaEn(diaAntes(hoyF, j + 2), n.tema)))
        errores.push(`hoy.siete[${i}] "${n.titulo}": el tema "${n.tema}" salió hace poco; puede volver con ${DESCANSO_NOTICIA} días afuera o con "novedad" (un hecho nuevo confirmado)`);
    }
    if (edad > MAX_DIAS_NOTICIA) errores.push(`hoy.siete[${i}] "${n.titulo}": el tema "${n.tema}" lleva ${edad - 1} días seguidos (máximo ${MAX_DIAS_NOTICIA}); sacarla, aunque siga vigente (vuelve con ${DESCANSO_NOTICIA} días afuera o con "novedad")`);
    else if (!n.vence && puesto < edad) errores.push(`hoy.siete[${i}] "${n.titulo}": es su día ${edad} y está en el puesto ${puesto}; va del puesto ${edad} para abajo (baja un puesto por día)`);
  });
  const otros = (data.hoy?.siete ?? []).filter((n) => OTRO_DEPORTE.test(n.titulo));
  if (otros.length > 1) errores.push(`hoy.siete: ${otros.length} noticias de otros deportes o inferiores (${otros.map((n) => n.titulo).join(' / ')}); máximo 1 y solo si no hay del fútbol profesional`);
  const norm = (x) => x.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');
  const usadas = new Map(previos.flatMap((d) => (d.siete ?? []).filter((n) => OTRO_DEPORTE.test(es(n.titulo))).map((n) => [norm(es(n.titulo)), d.fecha])));
  for (const n of otros) if (usadas.has(norm(n.titulo))) errores.push(`hoy.siete: "${n.titulo}" ya salió el ${usadas.get(norm(n.titulo))}; las de otros deportes o inferiores van un solo día`);
  if (errores.length) throw new Error(`Datos inválidos en data/home.json (comparado con días anteriores):\n- ${errores.join('\n- ')}`);
};

// Verificación: que las Siete no digan algo que ya sabemos que dejó de ser cierto.
// - Lo que tiene plazo (una venta "hasta hoy", una ventana "hasta agotar") lleva `vence` (fecha ISO):
//   si ya pasó, el build falla. Sin `vence`, una frase con plazo también hace fallar el build.
// - data/plantel.json es la memoria de bajas: si un jugador está "afuera" (suspendido, operado),
//   las Siete no pueden ponerlo "en duda"; si está "en duda", no pueden darlo por descartado ni por confirmado sin actualizar plantel.json.
export const CON_PLAZO = /hasta (hoy|mañana|el (lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)|las \d)|hasta agotar|sigue (abierta|la venta)|todav[ií]a (hay|quedan) (entradas|plateas|lugares)|quedan (entradas|plateas)|cierra (hoy|mañana)/i;
const sinTildes = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export const validarVerificacion = (data, plantel) => {
  const errores = [];
  const ahora = Date.parse(data.actualizado);
  (data.hoy?.siete ?? []).forEach((n, i) => {
    const txt = `${n.titulo} ${n.texto}`;
    if (n.vence !== undefined && !esFecha(n.vence)) errores.push(`hoy.siete[${i}].vence no es una fecha`);
    else if (n.vence && Date.parse(n.vence) <= ahora) errores.push(`hoy.siete[${i}] "${n.titulo}": venció el ${n.vence}; verificar qué pasó (¿se agotó? ¿cerró?) y reescribirla`);
    if (CON_PLAZO.test(txt) && !n.vence) errores.push(`hoy.siete[${i}] "${n.titulo}": habla de un plazo ("${txt.match(CON_PLAZO)[0]}") y no tiene "vence"; ponerle la fecha y hora en que deja de ser cierto`);
  });
  for (const b of plantel?.bajas ?? []) {
    // Se lo busca por "alias" (cómo lo nombran los medios) o, si no hay, por cada parte del nombre.
    const nombres = (b.alias ?? b.jugador.split(' ')).map(sinTildes);
    for (const [i, n] of (data.hoy?.siete ?? []).entries()) {
      const txt = sinTildes(`${n.titulo} ${n.texto}`);
      if (!nombres.some((x) => new RegExp(`\\b${x}\\b`).test(txt))) continue;
      if (b.estado === 'afuera' && /\ben duda\b|\bduda\b|podria (jugar|estar|llegar)|llegaria|se recupera|recibio el alta/.test(txt))
        errores.push(`hoy.siete[${i}] "${n.titulo}": ${b.jugador} figura "afuera" en data/plantel.json (${b.motivo}: ${b.detalle}); no puede estar en duda. Si cambió, actualizar plantel.json con la fuente`);
      if (b.estado === 'en duda' && /\bse pierde\b|\bdescartado\b|\bconfirmado (como )?titular\b|recibio el alta/.test(txt))
        errores.push(`hoy.siete[${i}] "${n.titulo}": ${b.jugador} figura "en duda" en data/plantel.json; si ya se sabe más, actualizar plantel.json (estado, detalle y fuentes) antes de publicarlo`);
    }
  }
  if (errores.length) throw new Error(`Verificación (data/home.json vs. plazos y data/plantel.json):\n- ${errores.join('\n- ')}`);
};
