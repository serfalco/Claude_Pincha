// Guarda el día en el historial: data/dias/AAAA-MM-DD.json
// Toma "Hoy" y "Lo último" de data/home.json (+ traducciones) y los suma al archivo de cada día.
// Se corre después de cada actualización (npm run archivar). Es acumulativo: nunca borra lo que ya estaba.
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import site from '../site.config.mjs';
import { combinar } from '../src/lib/traducir.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const existe = (p) => access(p).then(() => true, () => false);
const leer = async (rel) => JSON.parse(await readFile(join(root, rel), 'utf8'));
const diaDe = (iso) => new Intl.DateTimeFormat('sv-SE', { timeZone: site.zonaHoraria }).format(new Date(iso));

const base = await leer('data/home.json');
const [idiomaBase, ...otros] = site.idiomas;
const porIdioma = { [idiomaBase]: base };
for (const l of otros) {
  const p = `data/i18n/home.${l}.json`;
  porIdioma[l] = (await existe(join(root, p))) ? combinar(base, await leer(p)) : base;
}
const textos = (fn) => Object.fromEntries(site.idiomas.map((l) => [l, fn(porIdioma[l])]));

const hoy = diaDe(base.actualizado);
const items = (base.hoy.linea ?? []).map((n, i) => ({
  hora: n.hora, fuente: n.fuente, url: n.url, texto: textos((d) => d.hoy.linea[i].texto),
}));

// Agrupa los ítems por su día real (lo de "ayer" va al archivo de ayer).
const grupos = new Map();
for (const it of items) grupos.set(diaDe(it.hora), [...(grupos.get(diaDe(it.hora)) ?? []), it]);
if (!grupos.has(hoy)) grupos.set(hoy, []);

for (const [dia, nuevos] of grupos) {
  const archivo = join(root, 'data/dias', `${dia}.json`);
  const previo = (await existe(archivo)) ? JSON.parse(await readFile(archivo, 'utf8')) : { fecha: dia, linea: [] };
  const clave = (n) => n.url || `${n.hora}|${n.texto[idiomaBase]}`;
  const todos = new Map(previo.linea.map((n) => [clave(n), n]));
  for (const n of nuevos) todos.set(clave(n), n);
  const out = {
    fecha: dia,
    // El titular y el resumen del día son los de la última corrida de ese día.
    ...(dia === hoy
      ? {
          titular: textos((d) => d.hoy.titular), resumen: textos((d) => d.hoy.resumen), ultimo: base.ultimo,
          // La foto de Hoy de ese día (la de la última corrida): queda en el historial.
          ...(base.hoy.foto?.id ? { foto: { id: base.hoy.foto.id, alt: textos((d) => d.hoy.foto?.alt ?? base.hoy.foto.alt) } } : previo.foto ? { foto: previo.foto } : {}),
        }
      : { titular: previo.titular, resumen: previo.resumen, ultimo: previo.ultimo, ...(previo.foto ? { foto: previo.foto } : {}) }),
    linea: [...todos.values()].sort((a, b) => b.hora.localeCompare(a.hora)),
  };
  await mkdir(dirname(archivo), { recursive: true });
  await writeFile(archivo, `${JSON.stringify(out, null, 2)}\n`);
  console.log(`✓ ${dia}: ${out.linea.length} hechos`);
}
