# Instrucciones de actualización automática

Este archivo lo sigue la tarea programada que mantiene El Pincha Hoy. Corre dos veces por día (mañana y noche).
Objetivo: que `data/home.json` y sus traducciones reflejen **cómo está hoy Estudiantes de La Plata**.

## Reglas de oro

1. **Nunca inventar.** Cada dato (resultado, fecha, hora, tabla, socios, noticia) tiene que salir de una fuente verificable encontrada en esta corrida. Si no se puede confirmar, se deja el valor anterior.
2. **Dos fuentes para lo crítico**: resultados, fechas y horarios de partidos. Si las fuentes no coinciden, no se cambia y se anota en el resumen.
3. Horarios siempre en **hora argentina** (`-03:00`). Atención con páginas que muestran otra zona horaria.
4. **Textos propios**, nunca copiados: titulares y bajadas reescritos, cortos, en tono de hincha pero informativo.
5. Si no hay novedades, **no se hace commit**.

## Primer paso: cobertura por RSS

Correr `npm run cobertura`. Junta en `cobertura/ultimas.json` todo lo publicado en las últimas 72 h por el feed del club, El Día, 0221, Punto Capital, Olé, Perfil, Clarín, La Nación, Infobae, Infocielo, Diario Hoy y Google Noticias (que suma TyC, ESPN, DSports, Minuto Uno, etc.), filtrado para Estudiantes de La Plata y sin duplicados.
- `[CLUB]` = publicación oficial: manda sobre todo lo demás.
- `[SOCIOS]` = entradas, ventanas, ranking, cuota: revisar primero.
- `confirman` = otros medios que contaron lo mismo (sirve como segunda fuente).
- Las notas del club traen `texto` (el cuerpo completo, desde la API de la web del club): leerlo ahí, no hace falta abrirlas.
- Las de Google Noticias traen `sitio` (el dominio del medio). Su link de Google no se puede abrir ni decodificar desde acá (Google lo bloquea): para leer la nota y conseguir el link original, buscar el título con WebSearch limitado a ese dominio (`allowed_domains`). Si no aparece, se puede usar el link de Google, pero solo si otro medio confirma el dato.
- Abrir las notas relevantes (WebFetch) antes de usarlas: el título solo no alcanza.
- **Salud de las fuentes**: la cobertura avisa si un feed da error, responde vacío, si la API del club cayó al RSS o si un feed propio (club, 0221, El Día) lleva más de 36 h sin notas. Si aparece algún aviso, seguir con el resto, buscar en la web lo que falte y mencionarlo en el resumen final.

## Segundo paso: datos estructurados

Correr `npm run datos`. Trae de ESPN (API pública, no oficial) el último partido y los próximos de todas las competencias, ya en hora argentina, y la tabla de la zona de Estudiantes, que compara contra futbolargentino. Lo deja en `cobertura/datos.json` y muestra qué difiere de `data/home.json`.
- **Partidos**: cada partido de ESPN se compara con la página del club en futbolargentino. `✓ confirmado` = las dos fuentes coinciden en rival, día, hora y resultado: cuenta como dos fuentes. Si dice `solo ESPN` (futbolargentino no lista la Supercopa, por ejemplo) o hay diferencia, confirmar con el club o un medio antes de cambiar. Los nombres de torneo que da ESPN vienen en inglés: en `home.json` van los nuestros.
- **Tabla**: si ESPN y futbolargentino coinciden y `home.json` está desactualizada, `npm run datos -- --aplicar` escribe `tabla.filas`. `tabla.nombre`, `posiciones` y las traducciones siguen a mano. Si las fuentes no coinciden (suele pasar cuando una todavía no cargó un partido), no se toca y se anota en el resumen.
- Si una fuente falla, el script avisa y sigue: completar con la web como antes.

## Variedad de fuentes (obligatorio)

El sitio no puede parecer un rebote de un solo medio.
- En **"Lo último"** y en **noticias**: como máximo **2 ítems de la misma fuente** (el club cuenta como una fuente más).
- Si un hecho lo cuentan varios, elegir el medio que menos aparece ese día (`confirman` en la cobertura dice quién más lo publicó). Priorizar medios de La Plata: El Día, 0221, Diario Hoy, Infocielo, Punto Capital.
- Linkear a la nota original del medio. Si el medio solo aparece por Google Noticias y no se encuentra la URL original, se puede usar el link de Google Noticias (redirige al medio cuando lo abre una persona); en `fuente` va el nombre del medio, nunca "Google Noticias".
- **El build lo controla:** falla si hay más de 2 ítems de la misma fuente en "Lo último" o en noticias, o más de 3 sumando los dos.
- Rotar entre días: si ayer dominó un medio, hoy darle lugar a otros.
- `npm run cobertura` imprime "Fuentes distintas" con el conteo por medio: usarlo para chequear.

## Fuentes

Orden de prioridad. Lo oficial manda; los medios sirven para confirmar y para llegar antes.

**Oficiales del club (se pueden leer automáticamente)**
- **Feed RSS de la web (empezar siempre por acá):** https://estudiantesdelaplata.com/feed/ — todas las publicaciones del club con fecha y hora, se actualiza en el momento.
- Web: https://estudiantesdelaplata.com/ — sobre todo la sección Entradas: https://estudiantesdelaplata.com/category/entradas/ (ventanas por ranking, precios, requisitos) y Socios.
- Asociarse: https://sumate.estudiantesdelaplata.com/

**Oficiales del club (no se pueden leer desde afuera: login o bloqueo a robots)**
- Canal de WhatsApp (oficial, ~102 mil seguidores): https://whatsapp.com/channel/0029Va6CN7H96H4KZqCeiF3e
- Facebook: https://www.facebook.com/EdelpOficial/ · TikTok: https://www.tiktok.com/@edelpoficial
- Instagram (verificada, ~552 mil seguidores): https://www.instagram.com/edelpoficial/
- X: https://x.com/EdelpOficial
Lo que el club publica en estas redes lo levantan rápido los medios de abajo: buscarlo por ahí y, si se puede, confirmarlo en la web del club.

**Competencias y entradas**
- CONMEBOL / ElevenTickets (Libertadores): https://libertadores.eleventickets.com/
- Liga Profesional / AFA para fixture y horarios oficiales.

**Medios (confirmación y velocidad)**
- La Plata: El Día (RSS propio de Estudiantes), 0221 (RSS propio), Punto Capital (RSS), Infocielo y Diario Hoy (vía Google Noticias por sitio). Cielosport bloquea el acceso automático y no figura en Google Noticias: no se puede leer.
- Nacionales: La Nación / Canchallena, Olé, TyC Sports, ESPN, Infobae, 442 Perfil, El Gráfico.
- Tablas y números: futbolargentino.com, promediosinfo.com.

## Para socios (prioridad alta)

Si hay una venta de entradas o un trámite de socios en curso, es lo primero que va en `hoy`:
qué ventana está abierta ahora, a qué puntajes le toca, hasta qué hora, dónde se compra y los requisitos clave.
Las ventanas que ya cerraron se sacan.

## Qué revisar en cada corrida

- **ultimo**: último partido oficial jugado (rival, goles, fecha, torneo, condición `local`/`visitante`/`neutral`). La mascota se calcula sola con los goles.
- **proximos**: próximos partidos oficiales confirmados (máx. 4), ordenados por fecha. Sacar los ya jugados.
- **tabla** y **posiciones**: tabla del torneo en curso (zona de Estudiantes), puesto en la anual y en promedios. Si el torneo terminó, la tabla final con su nombre indicando que es final. `clasifican` según el formato vigente.
- **proximos[].destacado**: `true` en el partido más importante que viene (activa la cuenta regresiva arriba de todo). Uno solo; sacarlo cuando se juegue.
- **hoy.puntos**: no repetir lo que ya muestra la franja de arriba (rival, fecha y hora del próximo partido, último resultado, cuenta regresiva). Usarlos para lo práctico: entradas, micros, trámites, lesiones.
- **hoy**: titular + resumen (2 frases) + 3 puntos sobre lo más importante del día para el hincha (partido de hoy, resultado de ayer, lesiones, entradas, el club).
- **hoy.linea** ("Lo último"): lo que pasó hoy, de lo más nuevo a lo más viejo, 3 a 6 ítems. Cada uno: `hora` (hora real de la publicación, en hora argentina), `texto` (una frase propia), `fuente` ("Club" si es oficial, si no el medio) y `url`. Si es temprano y hay poco del día, completar con lo de ayer a la tarde/noche (se muestra como "Ayer"). Nada de más de 24 h. No es minuto a minuto: solo hechos que le importan al hincha.
- **noticias**: las 4 más relevantes de los últimos días, con link a la nota original y su fuente.
- **club**: socios y balance solo si hay un dato oficial nuevo. Campaña de socios: mantener el link. No publicar cuotas ni precios: para eso está el link del club. La cita de Verón y el bloque "mística" no se tocan: es el tono del sitio (apoyar al club, no obtener beneficios).
- **Sección Mundo** (`data/mundo.json` + `data/i18n/mundo.<idioma>.json`): revisar una vez por semana o cuando haya novedad. Filiales nuevas en https://estudiantesdelaplata.com/filiales/, y la situación rumbo al Mundial de Clubes 2029 (ranking CONMEBOL, clasificación). Después de la final del 28/11, actualizar la nota y el bloque del Mundial según el resultado.
- **hoy.foto** (foto principal, con el titular encima): solo del banco `imagenes/`, y **nunca una foto que el club publicó hace menos de 7 días** (exclusividad del club: no usarlas a la par; el build lo controla y falla) (ver `imagenes/README.md`). Cambiarla cuando cambia el tema del día por una que lo acompañe (partido, festejo, entrenamiento, hinchada, el UNO). Si ninguna corresponde, dejar una neutra (hinchada, estadio): nunca una que diga otra cosa (festejo tras una derrota, un jugador lesionado como si jugara). Para cambiarla: sumar `"hoy"` a sus `usos` (y sacarlo de la anterior) en `imagenes/indice.json`, ajustar `foco` si hace falta, correr `npm run imagenes` y actualizar `id` + `alt` en `home.json` y el `alt` en las 4 traducciones. Revisar el recorte 16:9 antes de publicar.
- **Fotos nuevas del club**: en la primera corrida después de cada partido (y si no, una vez por semana) correr `npm run fotos`: trae al banco las fotos de la web del club con al menos 7 días de publicadas (nunca las de la última semana), sin publicarlas. La foto del último partido llega recién a la semana: hasta entonces, usar una anterior que acompañe el tema. Mirar las nuevas antes de elegir (algunas son conferencias o capturas de video).
- **club.campania.foto**: no se toca salvo pedido del dueño del sitio.
- **video** (canción destacada en Hoy): no se toca. Lo maneja el dueño del sitio. Si viene `vertical: null`, dejarlo así.
- **actualizado**: fecha y hora de la corrida.

## Traducciones

Después de cambiar `data/home.json`, actualizar `data/i18n/home.en.json`, `home.pt.json`, `home.zh.json` y `home.hi.json` con **las mismas posiciones de arrays**.
Solo campos de texto: `hoy` (incluido `hoy.linea[].texto` y `hoy.foto.alt`), `instancia` de cada partido, `ultimo.torneo`, `posiciones[].tabla/detalle`, `tabla.nombre`, textos de `club`, `titulo`/`bajada` de noticias.

- Inglés británico de fútbol (matchday, fixture, home/away). Portugués de Brasil (rodada, mandante).
- Chino simplificado (zh-CN), registro de prensa deportiva. Clubes y jugadores en letras latinas, salvo nombres ya establecidos (帕尔梅拉斯 la primera vez, con "(Palmeiras)").
- Hindi (hi-IN) en devanagari, registro de prensa deportiva; términos de fútbol como se usan en India (फ़ाइनल, राउंड, अंक). Clubes y jugadores en letras latinas.
- **No se traducen**: Pincha, Pincharrata, el UNO, nombres de torneos (Torneo Clausura, Copa Libertadores, Supercopa Argentina), clubes y estadios.
- Números en formato de cada idioma (63,002 en inglés; 63.002 en portugués). Montos en pesos como `ARS`.

## Cierre

1. `npm run archivar`: guarda el día en `data/dias/AAAA-MM-DD.json` (suma lo nuevo de "Lo último", no borra nada). Lo de ayer va solo al archivo de ayer.
2. `npm run build`: tiene que terminar sin errores y **sin avisos de "sin traducir"**. Si falla, corregir; si no se puede, no publicar.
3. Commit en `main` (incluye `data/dias/`) con mensaje `Actualización AAAA-MM-DD HH:MM: <qué cambió>` y push. Cloudflare Pages publica solo.
4. Cuando el sitio ya muestre lo nuevo, correr `npm run indexnow` para avisar a Bing y otros buscadores (si falla, seguir: no es bloqueante).
5. Resumen final corto: qué cambió, fuentes usadas y cualquier dato dudoso que se dejó sin tocar.
