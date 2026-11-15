"""El Pincha Hoy -> X.

- Todos los dias a las 6:00 ART: el titular del dia + link, #EDLP #EstudiantesLP,
  y una linea a otro idioma del sitio (rota en/pt/zh/hi): la semillita global.
- Dia de partido (proximos[0] es hoy): un segundo post 2 h antes del inicio.

Lee data/home.json y data/i18n/home.<idioma>.json. Uso:
  python3 pincha_x.py --data ../../data [--fecha AAAA-MM-DD]
"""
import argparse
import json
import os
from datetime import datetime, time, timedelta

from buffer_x import AR, ahora_ar, ajustar, publicar

CANAL = "6af9e06aece6dfde5fd48ed5"  # @ElPinchaHoy en Buffer
SITIO = "https://elpinchahoy.com.ar"
HASHTAGS = "#EDLP #EstudiantesLP #LaPlata"
HORA = time(6, 0)

OTROS = [  # (idioma, invitacion en ese idioma)
    ("en", "🌍 In English"),
    ("pt", "🌍 Em português"),
    ("zh", "🌍 中文"),
    ("hi", "🌍 हिंदी में"),
]


def leer(ruta):
    try:
        return json.load(open(ruta, encoding="utf-8"))
    except Exception:
        return {}


def utm(url, campana):
    return f"{url}?utm_source=x&utm_medium=social&utm_campaign={campana}"


def post_diario(home, hoy):
    titular = ((home.get("hoy") or {}).get("titular") or "").strip()
    cabeza = f"☀️ Buen día, pincha. {titular}" if titular else "☀️ Buen día, pincha."
    idioma, invitacion = OTROS[hoy.toordinal() % len(OTROS)]
    pie = "\n".join([
        f"Lo importante del Pincha en un minuto 👉 {utm(SITIO + '/', 'dia-' + hoy.isoformat())}",
        f"{invitacion}: {utm(f'{SITIO}/{idioma}/', 'dia-' + hoy.isoformat())}",
        HASHTAGS,
    ])
    return ajustar(cabeza, [], pie)


def post_partido(home, hoy):
    """Devuelve (texto, cuando) si el Pincha juega hoy; si no, None."""
    prox = (home.get("proximos") or [None])[0]
    if not prox or not prox.get("fecha"):
        return None
    try:
        inicio = datetime.fromisoformat(prox["fecha"]).astimezone(AR)
    except ValueError:
        return None
    if inicio.date() != hoy:
        return None
    torneo = " · ".join(x for x in (prox.get("torneo"), prox.get("instancia")) if x)
    cabeza = f"⚽ Hoy juega el Pincha: Estudiantes vs {prox.get('rival', '')}"
    datos = [f"🕐 {inicio.strftime('%H:%M')} h" + (f" · {torneo}" if torneo else "")]
    if prox.get("estadio"):
        datos.append(f"🏟️ {prox['estadio']}")
    pie = "\n".join([
        f"Seguilo en vivo 👉 {utm(SITIO + '/', 'partido-' + hoy.isoformat())}",
        HASHTAGS,
    ])
    cuando = max(inicio - timedelta(hours=2), datetime.combine(hoy, time(8, 0), tzinfo=AR))
    return ajustar(cabeza, datos, pie), cuando


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", required=True)
    ap.add_argument("--fecha")
    a = ap.parse_args()
    hoy = datetime.strptime(a.fecha, "%Y-%m-%d").date() if a.fecha else ahora_ar().date()
    home = leer(os.path.join(a.data, "home.json"))
    if not home:
        print("::warning::No pude leer data/home.json; hoy no sale nada.")
        return

    publicar(CANAL, post_diario(home, hoy), datetime.combine(hoy, HORA, tzinfo=AR))
    partido = post_partido(home, hoy)
    if partido:
        publicar(CANAL, *partido)


if __name__ == "__main__":
    main()
