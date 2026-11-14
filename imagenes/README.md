# Banco de imágenes

Fotos oficiales de Estudiantes de La Plata (estudiantesdelaplata.com) para usar en el sitio.

> **Permiso de republicación: pendiente.** Hasta que el club lo confirme, ninguna está marcada para publicar y ninguna llega al sitio.

## Qué hay

| Carpeta | Fotos | Qué es |
|---|---|---|
| `primera/` | 144 | Primera masculina: partidos, entrenamientos, refuerzos (may–nov 2026) |
| `estadio-uno/` | 2 | Estadio UNO |
| `country-city-bell/` | 6 | Country de City Bell |

Nombre de cada archivo: `AAAA-MM-DD_<nota-del-club>_<n>.jpg`. La fecha es la de **publicación** de la nota, no necesariamente la de la foto. La mayoría mide 1024 px de ancho.

## indice.json

Una entrada por foto:

- `archivo`, `categoria`, `ancho`, `alto`, `orientacion`
- `nota` / `notaUrl`: la nota del club donde salió. `publicada` y `tomada` (si figura).
- `credito`: fotógrafo si el club lo indica (si no, `null`: se acredita "Foto: Estudiantes de La Plata").
- `original`: URL de la imagen en la web del club.
- `alt`: descripción para accesibilidad. **Obligatoria para publicar.**
- `publicar`: `false` por defecto.

## Cómo usar una foto en el sitio

1. Buscarla en `indice.json`, completar `alt` y poner `"publicar": true`.
2. `npm run build` la copia a `dist/img/<categoria>/<archivo>` (el build falla si falta `alt` o el archivo).
3. Referenciarla como `/img/<categoria>/<archivo>`, siempre con crédito.

Las que no están marcadas no se publican: viven solo en el repo.

## Sumar fotos

Copiar el `.jpg` a su carpeta con el mismo formato de nombre y agregar su entrada a `indice.json`.
