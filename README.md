# El Pincha Hoy

¿Cómo está hoy el Pincha? Respuesta en menos de un minuto, desde el celular.

**Etapa 1 — Infraestructura base.** Una Home rápida, clara y lista para crecer. Datos simulados.

## Cómo funciona

```
data/home.json  ─┐
src/ (plantillas)├─► scripts/build.mjs ─► dist/ (HTML estático) ─► Cloudflare Pages
site.config.mjs ─┘
```

- **Cero dependencias.** Solo Node (≥20). Sin framework: para una home con 6 bloques, un framework suma peso y mantenimiento sin aportar nada.
- **HTML generado en el build**, no en el navegador: los buscadores leen todo el contenido, y el sitio no carga JavaScript.
- **CSS inline** (≈5 KB): una sola petición para ver la página. Home completa ≈ 4,5 KB comprimida.
- **Datos separados de la vista.** Cambiar el contenido = editar `data/home.json`. El build valida los datos y falla si falta algo, para no publicar una home rota.

## Estructura

```
site.config.mjs        nombre, dominio, menú, textos SEO
data/home.json         contenido de la home (hoy, partidos, tabla, noticias)
src/
  layout.mjs           <head> y SEO: title, description, canonical, Open Graph, JSON-LD
  pages/home.mjs       arma la home con los componentes
  components/          un archivo por bloque (header, hoy, partidos, tabla, noticias, footer)
  lib/                 html (escape seguro), fechas (hora argentina), validar
  styles.css           estilos mobile-first, modo oscuro automático
scripts/build.mjs      genera dist/, sitemap.xml y robots.txt
public/                favicon, íconos, imagen OG, _headers (seguridad y caché)
assets/og.svg          fuente de la imagen Open Graph
```

## Uso

```bash
npm run build     # genera dist/
npm run preview   # build + servidor local
```

## Deploy (Cloudflare Pages)

Conectar el repo en Cloudflare Pages:

- Build command: `npm run build`
- Output directory: `dist`
- Variable: `NODE_VERSION = 20`

Cada push a `main` publica.

## Cómo crece

- **Datos reales / IA (Etapa 2):** un Cloudflare Worker con cron obtiene datos, genera el bloque "Hoy" y actualiza `data/home.json` (o lo lee de KV en el build) y dispara el *deploy hook* de Pages. Las plantillas no cambian.
- **Partido en vivo:** ruta dinámica aparte (Pages Function) solo para esa página; la home sigue estática.
- **Páginas nuevas:** un archivo en `src/pages/` + una línea en el registro de `scripts/build.mjs`. Entran solas al sitemap.
- **Publicidad / PWA / push:** se agregan en `layout.mjs` sin tocar los bloques.

## Identidad

El logo es una marca propia (bastones rojo y blanco), no el escudo oficial. Sitio de hinchas, sin relación oficial con el club.
