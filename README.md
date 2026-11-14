# El Pincha Hoy

¿Cómo está hoy el Pincha? Respuesta en menos de un minuto, desde el celular. En español, inglés, portugués, chino e hindi.

## Cómo funciona

```
data/home.json  ─────────┐
data/i18n/home.<idioma>  ├─► scripts/build.mjs ─► dist/ (HTML estático: /, /en/, /pt/, /zh/, /hi/) ─► Cloudflare Pages
src/ (plantillas + i18n) ┘
```

- **Cero dependencias.** Solo Node (≥20). Sin framework: para una home de pocos bloques suma peso y mantenimiento sin aportar nada.
- **HTML generado en el build**, no en el navegador: los buscadores leen todo, y el sitio no carga JavaScript.
- **CSS inline**: una sola petición para ver la página (~7 KB comprimida por idioma).
- **Datos separados de la vista.** El build valida los datos y falla si falta algo, para no publicar una home rota.

## Cómo se actualiza

**Hoy (manual, desde el celular):**

1. En GitHub, abrir `data/home.json` → lápiz (editar).
2. Cambiar lo que haga falta: resultado, próximos partidos, tabla, noticias, socios. Actualizar `actualizado`.
3. Si cambian textos (titular, noticias, etc.), actualizar también `data/i18n/home.en.json` y `home.pt.json`.
4. *Commit changes* → Cloudflare Pages publica solo en ~1 minuto.

Si una traducción falta, ese texto sale en español y el build avisa qué quedó pendiente. Números, fechas, goles y links solo se cargan en `home.json`: las traducciones tienen únicamente texto.

La mascota cambia sola según `ultimo.golesPropios` y `ultimo.golesRival`.

**Etapa 2 (automático):** un Cloudflare Worker con cron:
1. trae resultados, fixture y tabla de una API de fútbol,
2. genera el bloque "Hoy" con IA,
3. traduce los textos con IA (instrucciones de estilo + glosario: "Pincha", "el UNO", "clásico" no se traducen),
4. hace commit de los JSON y Cloudflare vuelve a publicar.

Las plantillas no cambian.

## Historial día por día

Cada corrida guarda el día con `npm run archivar` en `data/dias/AAAA-MM-DD.json` (titular, resumen, último resultado y todo "Lo último" del día, en los 3 idiomas).
El build genera `/dia/AAAA-MM-DD/` por día y `/dias/` con el índice, en cada idioma, y los suma al sitemap. Un día sin hechos todavía se publica con `noindex` y queda fuera del sitemap (y la home no lo enlaza) hasta que tenga contenido.

## Idiomas

- `site.config.mjs` → `idiomas: ['es', 'en', 'pt', 'zh', 'hi']`. El primero va en `/`, los demás en `/<idioma>/`.
- `src/i18n/<idioma>.mjs` → textos fijos de la interfaz (menú, etiquetas, fechas).
- `data/i18n/home.<idioma>.json` → traducción del contenido del día.
- SEO: `hreflang` + `x-default`, `og:locale` y sitemap con alternativas por idioma (incluido `x-default`).

Sumar un idioma: copiar `src/i18n/es.mjs`, traducirlo, agregarlo a `idiomas` y crear su `data/i18n/home.<idioma>.json`.

## Partido en vivo

Mientras se juega el próximo partido (`proximos[0]` de `data/home.json`), arriba de todo aparece un bloque con marcador, goleadores y hechos (goles, tarjetas, cambios) que se actualiza solo cada 30 s. Antes y después se ve la franja de siempre.

- `functions/api/vivo.js`: Pages Function (Worker) en `/api/vivo`. Busca el partido de Estudiantes del día en ESPN (API pública, no oficial), lo resume en un JSON chico y lo cachea 30 s en Cloudflare.
- `src/components/vivo.mjs` + `public/vivo.js`: el bloque y su script (sin dependencias). Solo consulta desde 30 min antes hasta 5 h después del partido.
- Textos en `src/i18n/*.mjs` (`vivo`): se arman con plantillas propias en cada idioma, no se copia el relato de ESPN.
- Si ESPN falla o no hay partido, el bloque no aparece. No escribe en `home.json`: el resultado se confirma con dos fuentes en la actualización de siempre.
- Probar con un partido ya jugado: `/?vivo=401841661` (Talleres 1-1, 07/11).

## Estructura

```
site.config.mjs           nombre, dominio, idiomas, secciones
data/home.json            contenido base (español)
data/i18n/                traducciones del contenido
src/
  layout.mjs              <head> y SEO
  pages/home.mjs          arma la home
  components/             un archivo por bloque + mascota.mjs (Pincharrata, 5 estados)
  i18n/                   textos fijos por idioma
  lib/                    html (escape), fechas, validar, traducir (combina traducciones)
  styles.css              mobile-first, modo oscuro automático
scripts/build.mjs         genera dist/, sitemap.xml y robots.txt
scripts/datos.mjs         partidos y tabla desde ESPN + futbolargentino (npm run datos)
public/                   favicon, íconos, imagen OG, _headers
imagenes/                 banco de fotos, formatos.json e indice.json; web/ = versiones AVIF/JPG que van a /img/ (ver imagenes/README.md)
scripts/imagenes.py       genera imagenes/web/ (Python + Pillow, solo al cambiar una foto; el build sigue sin dependencias)
```

## Uso

```bash
npm run build     # genera dist/
npm run preview   # build + servidor local
```

## Deploy (Cloudflare Pages)

Conectar el repo: build command `npm run build`, output `dist`, variable `NODE_VERSION = 20`. Cada push a `main` publica.

## Dominio y métricas

- Dominio: https://elpinchahoy.com.ar (DNS en Cloudflare, delegado desde NIC.ar) y www. Provisorio: elpinchahoy.pages.dev.
- Visitas: Cloudflare Web Analytics, activado en el proyecto de Pages (Métricas). Cloudflare inyecta el script en cada deploy; sin cookies. Muestra visitas, páginas, países, referentes y dispositivos.

## Identidad

El logo y el Pincharrata son diseños propios, no el escudo oficial. Sitio de hinchas, sin relación oficial con el club.

## Foto de la cita del club

La cita de la campaña de socios (`club.campania.cita` en `data/home.json`) muestra un avatar redondo al estilo Instagram. Sin foto, muestra las iniciales del autor. Para poner una foto:

1. Subí la imagen a `public/` (por ejemplo `public/img/cita-autor.jpg`), cuadrada y de 120×120 px o más. Tiene que ser una foto que el sitio pueda usar (por ejemplo, una foto oficial del club con permiso).
2. En `data/home.json`, agregá `"foto": "/img/cita-autor.jpg"` dentro de `cita`.

