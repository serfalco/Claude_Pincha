# Instrucciones de actualización automática

Este archivo lo sigue la tarea programada que mantiene El Pincha Hoy. Corre dos veces por día (mañana y noche).
Objetivo: que `data/home.json` y sus traducciones reflejen **cómo está hoy Estudiantes de La Plata**.

## Reglas de oro

1. **Nunca inventar.** Cada dato (resultado, fecha, hora, tabla, socios, noticia) tiene que salir de una fuente verificable encontrada en esta corrida. Si no se puede confirmar, se deja el valor anterior.
2. **Dos fuentes para lo crítico**: resultados, fechas y horarios de partidos. Si las fuentes no coinciden, no se cambia y se anota en el resumen.
3. Horarios siempre en **hora argentina** (`-03:00`). Atención con páginas que muestran otra zona horaria.
4. **Textos propios**, nunca copiados: titulares y bajadas reescritos, cortos, en tono de hincha pero informativo.
5. Si no hay novedades, **no se hace commit**.

## Qué revisar en cada corrida

- **ultimo**: último partido oficial jugado (rival, goles, fecha, torneo, condición `local`/`visitante`/`neutral`). La mascota se calcula sola con los goles.
- **proximos**: próximos partidos oficiales confirmados (máx. 4), ordenados por fecha. Sacar los ya jugados.
- **tabla** y **posiciones**: tabla del torneo en curso (zona de Estudiantes), puesto en la anual y en promedios. Si el torneo terminó, la tabla final con su nombre indicando que es final. `clasifican` según el formato vigente.
- **hoy**: titular + resumen (2 frases) + 3 puntos sobre lo más importante del día para el hincha (partido de hoy, resultado de ayer, lesiones, entradas, el club).
- **noticias**: las 4 más relevantes de los últimos días, con link a la nota original y su fuente.
- **club**: socios y balance solo si hay un dato oficial nuevo. Campaña de socios: mantener el link.
- **actualizado**: fecha y hora de la corrida.

## Traducciones

Después de cambiar `data/home.json`, actualizar `data/i18n/home.en.json` y `data/i18n/home.pt.json` con **las mismas posiciones de arrays**.
Solo campos de texto: `hoy`, `instancia` de cada partido, `ultimo.torneo`, `posiciones[].tabla/detalle`, `tabla.nombre`, textos de `club`, `titulo`/`bajada` de noticias.

- Inglés británico de fútbol (matchday, fixture, home/away). Portugués de Brasil (rodada, mandante).
- **No se traducen**: Pincha, Pincharrata, el UNO, nombres de torneos (Torneo Clausura, Copa Libertadores, Supercopa Argentina), clubes y estadios.
- Números en formato de cada idioma (63,002 en inglés; 63.002 en portugués). Montos en pesos como `ARS`.

## Cierre

1. `npm run build`: tiene que terminar sin errores y **sin avisos de "sin traducir"**. Si falla, corregir; si no se puede, no publicar.
2. Commit en `main` con mensaje `Actualización AAAA-MM-DD HH:MM: <qué cambió>` y push. Cloudflare Pages publica solo.
3. Resumen final corto: qué cambió, fuentes usadas y cualquier dato dudoso que se dejó sin tocar.
