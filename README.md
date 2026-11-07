# El Pincha Hoy

¿Cómo está hoy el Pincha? Respuesta en menos de un minuto, desde el celular. En español, inglés y portugués.

## Cómo funciona

```
data/home.json  ─────────┐
data/i18n/home.<idioma>  ├─► scripts/build.mjs ─► dist/ (HTML estático: /, /en/, /pt/) ─► Cloudflare Pages
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

## Idiomas

- `site.config.mjs` → `idiomas: ['es', 'en', 'pt']`. El primero va en `/`, los demás en `/<idioma>/`.
- `src/i18n/<idioma>.mjs` → textos fijos de la interfaz (menú, etiquetas, fechas).
- `data/i18n/home.<idioma>.json` → traducción del contenido del día.
- SEO: `hreflang` + `x-default`, `og:locale` y sitemap con alternativas por idioma.

Sumar un idioma: copiar `src/i18n/es.mjs`, traducirlo, agregarlo a `idiomas` y crear su `data/i18n/home.<idioma>.json`.

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
public/                   favicon, íconos, imagen OG, _headers
```

## Uso

```bash
npm run build     # genera dist/
npm run preview   # build + servidor local
```

## Deploy (Cloudflare Pages)

Conectar el repo: build command `npm run build`, output `dist`, variable `NODE_VERSION = 20`. Cada push a `main` publica.

## Identidad

El logo y el Pincharrata son diseños propios, no el escudo oficial. Sitio de hinchas, sin relación oficial con el club.
