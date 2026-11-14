#!/usr/bin/env python3
"""Genera las versiones web de las fotos del banco (imagenes/indice.json).

Por cada foto con "usos" (p. ej. ["hoy"]) recorta al formato de cada uso, centrado en "foco",
y escribe AVIF + JPG en cada ancho: imagenes/web/<id>/<uso>-<ancho>.{avif,jpg}.
También la foto de Hoy de cada día del historial (data/dias/*.json → "foto") y, para cada día,
la imagen para compartir (WhatsApp, redes): imagenes/web/og/<AAAA-MM-DD>.jpg, 1200×630.
Borra las versiones de fotos que ya no se usan. Es idempotente.

Uso:  python3 scripts/imagenes.py          (requiere Pillow ≥ 11 con AVIF: pip install pillow)
El build (Node, sin dependencias) solo copia imagenes/web/ al sitio y valida que exista lo que se usa.
"""
import json, shutil, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps, features

RAIZ = Path(__file__).resolve().parent.parent
BANCO = RAIZ / 'imagenes'
WEB = BANCO / 'web'
OG = WEB / 'og'
DIAS = RAIZ / 'data' / 'dias'
HOME = RAIZ / 'data' / 'home.json'

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


FUENTES = ['/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf']


def fuente(tam):
    for f in FUENTES:
        if Path(f).exists():
            return ImageFont.truetype(f, tam)
    return ImageFont.load_default(tam)


def imagen_og(img, fecha, destino):
    """Imagen para compartir: foto a sangre, degradé, marca y fecha, franja a bastones. Sin texto en un idioma:
    sirve igual para las 5 versiones (el titular lo pone cada red debajo, desde og:title)."""
    W, H = 1200, 630
    src = ImageOps.exif_transpose(Image.open(BANCO / img['archivo'])).convert('RGB')
    foto = recortar(src, W / H, img.get('foco', [0.5, 0.5])).resize((W, H), Image.LANCZOS)
    capa = Image.new('L', (1, H))
    for y in range(H):
        t = max(0, (y - H * 0.38) / (H * 0.62))
        capa.putpixel((0, y), int(235 * t ** 1.3))
    negro = Image.new('RGB', (W, H), (14, 14, 16))
    foto = Image.composite(negro, foto, capa.resize((W, H)))
    d = ImageDraw.Draw(foto)
    # Franja a bastones (como la imagen de marca).
    for x in range(0, W, 60):
        d.rectangle([x, H - 34, x + 59, H], fill=(215, 24, 42) if (x // 60) % 2 == 0 else (255, 255, 255))
    logo = Image.open(BANCO / 'marca' / 'logo-og.png').convert('RGBA')
    foto.paste(logo, (56, H - 34 - 40 - logo.height), logo)
    x = 56 + logo.width + 26
    base = H - 34 - 40
    d.text((x, base - 118), 'EL PINCHA', font=fuente(34), fill=(255, 255, 255))
    d.text((x - 3, base - 82), 'HOY', font=fuente(78), fill=(215, 24, 42))
    a, m, dd = fecha.split('-')
    f = fuente(30)
    txt = f'{dd}/{m}/{a}'
    w = d.textlength(txt, font=f)
    d.rounded_rectangle([W - 56 - w - 36, base - 52, W - 56, base], radius=26, fill=(215, 24, 42))
    d.text((W - 56 - w - 18, base - 47), txt, font=f, fill=(255, 255, 255))
    foto.save(destino, quality=82, optimize=True, progressive=True)


def main():
    if not features.check('avif'):
        sys.exit('Pillow no tiene soporte AVIF: pip install -U pillow')
    indice = json.loads((BANCO / 'indice.json').read_text())
    por_id = {i['id']: i for i in indice['imagenes']}
    # Qué se necesita: los usos del índice + la foto de Hoy de cada día del historial y de la home.
    necesarias = {i['id']: set(i.get('usos', [])) for i in indice['imagenes']}
    fotos_dia = {}
    for f in sorted(DIAS.glob('*.json')) if DIAS.exists() else []:
        d = json.loads(f.read_text())
        if d.get('foto', {}).get('id'):
            fotos_dia[d['fecha']] = d['foto']['id']
    home = json.loads(HOME.read_text())
    if home.get('hoy', {}).get('foto', {}).get('id'):
        fotos_dia[home['actualizado'][:10]] = home['hoy']['foto']['id']
    for fid in fotos_dia.values():
        if fid not in por_id:
            sys.exit(f'Foto "{fid}" usada en el historial o en la home: no está en imagenes/indice.json')
        necesarias[fid].add('hoy')

    usadas = set()
    for img in indice['imagenes']:
        for uso in sorted(necesarias[img['id']]):
            if uso not in FORMATOS:
                sys.exit(f'{img["id"]}: uso desconocido "{uso}" (ver imagenes/formatos.json)')
            fmt = FORMATOS[uso]
            destino = WEB / img['id']
            usadas.add(img['id'])
            hechas = [destino / f'{uso}-{w}.{e}' for w in fmt['anchos'] for e in ('avif', 'jpg')]
            if all(p.exists() for p in hechas) and (destino / '.foco').exists() and (destino / '.foco').read_text() == json.dumps(img.get('foco')):
                continue  # ya está generada con el mismo recorte
            src = ImageOps.exif_transpose(Image.open(BANCO / img['archivo'])).convert('RGB')
            base = recortar(src, fmt['ancho'] / fmt['alto'], img.get('foco', [0.5, 0.5]))
            destino.mkdir(parents=True, exist_ok=True)
            for ancho in fmt['anchos']:
                if ancho > base.width:
                    print(f'  ⚠ {img["id"]}: {uso}-{ancho} se omite (la foto mide {base.width} px de ancho)')
                    continue
                alto = round(ancho * fmt['alto'] / fmt['ancho'])
                v = base.resize((ancho, alto), Image.LANCZOS)
                v.save(destino / f'{uso}-{ancho}.avif', quality=fmt['calidad']['avif'], speed=4)
                v.save(destino / f'{uso}-{ancho}.jpg', quality=fmt['calidad']['jpg'], optimize=True, progressive=True)
            (destino / '.foco').write_text(json.dumps(img.get('foco')))
            kb = sum(p.stat().st_size for p in destino.glob(f'{uso}-*')) // 1024
            print(f'✓ {img["id"]} · {uso} ({fmt["ancho"]}:{fmt["alto"]}) · {kb} KB en total')

    # Imagen para compartir de cada día (se regenera si cambió la foto del día).
    OG.mkdir(parents=True, exist_ok=True)
    reg_path = OG / 'indice.json'
    reg = json.loads(reg_path.read_text()) if reg_path.exists() else {}
    for fecha, fid in sorted(fotos_dia.items()):
        clave = f'{fid}|{json.dumps(por_id[fid].get("foco"))}'
        if reg.get(fecha) == clave and (OG / f'{fecha}.jpg').exists():
            continue
        imagen_og(por_id[fid], fecha, OG / f'{fecha}.jpg')
        reg[fecha] = clave
        print(f'✓ compartir {fecha} · {fid} · {(OG / f"{fecha}.jpg").stat().st_size // 1024} KB')
    reg_path.write_text(json.dumps(dict(sorted(reg.items())), indent=2) + '\n')

    for d in WEB.iterdir():
        if d.is_dir() and d.name != 'og' and d.name not in usadas:
            shutil.rmtree(d)
            print(f'− {d.name} (ya no se usa)')


if __name__ == '__main__':
    main()
