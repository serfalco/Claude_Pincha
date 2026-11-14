# Banco de imágenes

Fotos oficiales de Estudiantes de La Plata (estudiantesdelaplata.com) para usar en el sitio.

> **Permiso de republicación: confirmado por el club (14/11/2026).** Siempre con crédito (el sitio lo pone solo).
>
> **Exclusividad del club: 7 días.** No usamos sus fotos a la par: una foto se trae y se usa recién cuando pasó al menos una semana desde que el club la publicó (`esperaDias` en `indice.json`). `npm run fotos` no trae las de la última semana y el build falla si una foto usada es más nueva.

## Qué hay

| Carpeta | Fotos | Qué es |
|---|---|---|
| `primera/` | 150 | Primera masculina: partidos, entrenamientos, refuerzos (may–nov 2026, se suman con `npm run fotos`) |
| `estadio-uno/` | 2 | Estadio UNO |
| `country-city-bell/` | 7 | Country de City Bell |
| `web/` | — | Versiones para el sitio, **generadas** (no editar a mano) |

Nombre de cada archivo: `AAAA-MM-DD_<nota-del-club>_<n>.jpg`. La fecha es la de **publicación** de la nota, no necesariamente la de la foto. Los originales miden 1024 px de ancho (máximo): no se agrandan.

## Formatos (`formatos.json`)

Medidas fijas: cada lugar del sitio tiene un formato y solo uno. No se inventan tamaños sueltos.

| Uso | Proporción | Anchos | Dónde | Carga |
|---|---|---|---|---|
| `hoy` | 16:9 | 640, 1024 | Foto principal de Hoy, con el titular encima | primero (`fetchpriority=high`) |
| `banda` | 2:1 | 640, 1024 | Franja arriba de la tarjeta de socios | diferida (`lazy`) |

Cada versión sale en **AVIF** (la que bajan casi todos los navegadores: ~30–60 KB) y **JPG** de respaldo. El HTML lleva `width`/`height`: la página no salta mientras carga.

## indice.json

Una entrada por foto: `archivo`, `categoria`, `ancho`, `alto`, `orientacion`, `nota`/`notaUrl` (nota del club donde salió), `publicada`, `tomada`, `credito` (`null` → "Foto: Estudiantes de La Plata"), `original`, y:

- `usos`: en qué formatos se usa (`["hoy"]`, `["banda"]`…). Vacío = no llega al sitio.
- `foco`: `[x, y]` de 0 a 1, el punto que no se puede perder al recortar (default `[0.5, 0.5]`).
- `alt`: descripción por defecto (la que vale es la de `home.json`, que se traduce).

## Cómo poner una foto

1. En `indice.json`: agregar el uso a `usos` y, si hace falta, ajustar `foco`.
2. `npm run imagenes` (= `python3 scripts/imagenes.py`) → genera `web/<id>/<uso>-<ancho>.avif|jpg` (y borra las que ya no se usan). Requiere Pillow con AVIF (`pip install -U pillow`).
3. En `data/home.json`: `"foto": { "id": "<id>", "alt": "<qué se ve>" }` en `hoy` o en `club.campania`; el `alt` también en `data/i18n/home.<idioma>.json`.
4. `npm run build`: falla si la foto no existe, no tiene ese uso, faltan sus versiones o el `alt`.

Para sacar una foto: borrar `foto` de `home.json` (y de las traducciones).

## Criterio

- La foto acompaña el tema del día; si no hay una que corresponda, mejor la hinchada o el UNO que una que diga otra cosa (nada de festejo después de una derrota).
- No poner fotos de jugadores lesionados o que ya no están en el club como si fueran actuales.
- Una foto por lugar. Las noticias no llevan foto: linkean a otros medios y una foto del club ahí confundiría.

## Sumar fotos

**Automático:** `npm run fotos` trae las fotos nuevas de la web del club (API pública de WordPress) de las notas de fútbol profesional, estadio y country publicadas hace 7 a 21 días (nunca las de la última semana; `-- --dias 30` para mirar más atrás; `-- --prueba` para ver qué traería sin descargar). Baja la versión de 1024 px, hasta 4 por nota, saltea las repetidas (por `mediaId` / `original`) y las de menos de 640 px, y completa `indice.json` con nota, fecha, crédito (si el club lo pone en el epígrafe) y `usos: []`. Nunca borra ni publica nada.

Cada foto pesa ~120 KB en el repo: traer cuando hace falta (después de un partido, una vez por semana), no en cada corrida.

**A mano:** copiar el `.jpg` a su carpeta con el mismo formato de nombre y agregar su entrada a `indice.json` (`usos: []`).
