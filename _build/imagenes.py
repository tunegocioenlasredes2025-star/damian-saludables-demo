"""Genera favicon, íconos, og.png y una PNG por producto (para Google y redes).

    node _build/generar.js      (primero: arma los SVG de productos)
    python _build/imagenes.py

Necesita Playwright (pip install playwright && playwright install chromium).
El logotipo es solo tipográfico: la marca todavía no tiene logo.
"""
import base64
import json
import re
from pathlib import Path
from playwright.sync_api import sync_playwright

RAIZ = Path(__file__).resolve().parent.parent
IMG = RAIZ / "assets" / "img"
CONFIG = (RAIZ / "assets" / "js" / "config.js").read_text(encoding="utf-8")
MARCA = re.search(r'BRAND_NAME:\s*"([^"]+)"', CONFIG).group(1)
CAT = json.loads((RAIZ / "data" / "productos.json").read_text(encoding="utf-8"))
FUENTES = RAIZ / "assets" / "fonts"


def fuente(nombre):
    """data URI: las fuentes por file:// no cargan en set_content"""
    return "data:font/woff2;base64," + base64.b64encode((FUENTES / nombre).read_bytes()).decode()


CSS = f"""
@font-face {{ font-family: Young; src: url({fuente("young-serif.woff2")}); }}
@font-face {{ font-family: Plex; src: url({fuente("plex-mono-500.woff2")}); }}
@font-face {{ font-family: Schib; src: url({fuente("schibsted-600.woff2")}); }}
* {{ margin: 0; box-sizing: border-box; }}
body {{ background: transparent; }}
.plato {{ background: radial-gradient(120% 90% at 50% 20%, #EFEDE9 0%, #E3E1DC 62%); }}
.plato svg {{ width: 100%; height: 100%; display: block; }}
"""

inicial = MARCA.strip()[0].upper()
(IMG / "favicon.svg").write_text(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'
    '<rect width="64" height="64" rx="10" fill="#1C1917"/>'
    f'<text x="32" y="45" text-anchor="middle" font-family="Georgia, \'Times New Roman\', serif" font-size="40" fill="#F7F4EE">{inicial}</text>'
    '<rect x="14" y="52" width="36" height="3" fill="#C73E1D"/></svg>', encoding="utf-8")


def svg(pid):
    return (IMG / "productos" / f"{pid}.svg").read_text(encoding="utf-8")


with sync_playwright() as pw:
    nav = pw.chromium.launch()
    pag = nav.new_page()

    def foto(html, ancho, alto, salida):
        pag.set_viewport_size({"width": ancho, "height": alto})
        pag.set_content(f"<html><head><style>{CSS}</style></head><body>{html}</body></html>")
        pag.evaluate("document.fonts.ready")
        pag.wait_for_timeout(150)
        pag.screenshot(path=str(salida), clip={"x": 0, "y": 0, "width": ancho, "height": alto})

    # una PNG por producto (800 x 800)
    for p in CAT["productos"]:
        foto(f'<div class="plato" style="width:800px;height:800px">{svg(p["id"])}</div>', 800, 800, IMG / "productos" / f'{p["id"]}.png')

    # íconos
    icono = (f'<div style="width:{{t}}px;height:{{t}}px;background:#1C1917;display:grid;place-items:center;position:relative">'
             f'<span style="font:400 calc({{t}}px*.62)/1 Young;color:#F7F4EE;margin-top:-6%">{inicial}</span>'
             f'<span style="position:absolute;left:22%;right:22%;bottom:14%;height:4.5%;background:#C73E1D"></span></div>')
    foto(icono.format(t=180), 180, 180, IMG / "apple-touch-icon.png")
    foto(icono.format(t=512), 512, 512, IMG / "icon-512.png")

    # og.png (1200 x 630)
    tres = "".join(f'<div class="plato" style="width:228px;height:228px;border-radius:4px">{svg(i)}</div>'
                   for i in ["almendras", "miel-pura", "box-regalo"])
    og = f"""
    <div style="width:1200px;height:630px;background:#F7F4EE;padding:64px 70px;display:grid;grid-template-columns:1fr auto;gap:40px;align-items:center;font-family:Schib;color:#1C1917">
      <div>
        <p style="font:500 18px/1 Plex;letter-spacing:.08em;text-transform:uppercase;color:#6A625A">Almacén online · Castelar</p>
        <p style="font:400 92px/1 Young;margin:22px 0 18px">{MARCA}</p>
        <p style="font:600 34px/1.2 Schib;max-width:520px">Frutos secos, semillas, miel y yerba. Con el precio por kilo a la vista.</p>
        <p style="margin-top:34px;display:inline-block;font:500 20px/1 Plex;border:1.5px solid #1C1917;padding:12px 16px">ALMENDRAS 0,500 kg · $/kg 27.600</p>
      </div>
      <div style="display:grid;grid-template-columns:228px 228px;gap:14px">{tres}
        <div style="background:#1C1917;color:#E9A21B;border-radius:4px;display:grid;place-items:center;font:400 34px/1.1 Young;text-align:center;padding:20px">Pedí por<br>WhatsApp</div>
      </div>
    </div>"""
    foto(og, 1200, 630, IMG / "og.png")
    nav.close()

print("OK · imágenes de", MARCA)
