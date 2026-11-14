#!/usr/bin/env python3
"""Genera las versiones web de las fotos del banco (imagenes/indice.json).

Por cada foto con "usos" (p. ej. ["hoy"]) recorta al formato de cada uso, centrado en "foco",
y escribe AVIF + JPG en cada ancho: imagenes/web/<id>/<uso>-<ancho>.{avif,jpg}.
Borra las versiones de fotos que ya no se usan. Es idempotente.

Uso:  python3 scripts/imagenes.py          (requiere Pillow ≥ 11 con AVIF: pip install pillow)
El build (Node, sin dependencias) solo copia imagenes/web/ al sitio y valida que exista lo que se usa.
"""
import json, shutil, sys
from pathlib import Path
from PIL import Image, ImageOps, features

RAIZ = Path(__file__).resolve().parent.parent
BANCO = RAIZ / 'imagenes'
WEB = BANCO / 'web'

# Formatos del sitio. Única fuente de verdad: si cambia algo acá, cambia en todo el sitio.
FORMATOS = json.loads((BANCO / 'formatos.json').read_text())['formatos']


def recortar(im, proporcion, foco):
    """Recorte de la mayor área con esa proporción, lo más centrada posible en el foco (x, y de 0 a 1)."""
    w, h = im.size
    if w / h > proporcion:
        nw, nh = round(h * proporcion), h
    else:
        nw, nh = w, round(w / proporcion)
    x = min(max(round(foco[0] * w - nw / 2), 0), w - nw)
    y = min(max(round(foco[1] * h - nh / 2), 0), h - nh)
    return im.crop((x, y, x + nw, y + nh))


def main():
    if not features.check('avif'):
        sys.exit('Pillow no tiene soporte AVIF: pip install -U pillow')
    indice = json.loads((BANCO / 'indice.json').read_text())
    usadas = set()
    for img in indice['imagenes']:
        for uso in img.get('usos', []):
            if uso not in FORMATOS:
                sys.exit(f'{img["id"]}: uso desconocido "{uso}" (ver imagenes/formatos.json)')
            fmt = FORMATOS[uso]
            src = ImageOps.exif_transpose(Image.open(BANCO / img['archivo'])).convert('RGB')
            base = recortar(src, fmt['ancho'] / fmt['alto'], img.get('foco', [0.5, 0.5]))
            destino = WEB / img['id']
            destino.mkdir(parents=True, exist_ok=True)
            usadas.add(img['id'])
            for ancho in fmt['anchos']:
                if ancho > base.width:
                    print(f'  ⚠ {img["id"]}: {uso}-{ancho} se omite (la foto mide {base.width} px de ancho)')
                    continue
                alto = round(ancho * fmt['alto'] / fmt['ancho'])
                v = base.resize((ancho, alto), Image.LANCZOS)
                v.save(destino / f'{uso}-{ancho}.avif', quality=fmt['calidad']['avif'], speed=4)
                v.save(destino / f'{uso}-{ancho}.jpg', quality=fmt['calidad']['jpg'], optimize=True, progressive=True)
            kb = sum(p.stat().st_size for p in destino.glob(f'{uso}-*')) // 1024
            print(f'✓ {img["id"]} · {uso} ({fmt["ancho"]}:{fmt["alto"]}) · {kb} KB en total')
    if WEB.exists():
        for d in WEB.iterdir():
            if d.is_dir() and d.name not in usadas:
                shutil.rmtree(d)
                print(f'− {d.name} (ya no se usa)')


if __name__ == '__main__':
    main()
