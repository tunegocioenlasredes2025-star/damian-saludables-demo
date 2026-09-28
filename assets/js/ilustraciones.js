/* ============================================================
   ilustraciones.js · envases dibujados por código (SVG)
   Cada producto = su envase (bolsa, frasco, paquete, mate, bombilla, caja)
   + una ventana con el contenido dibujado con su forma real.
   Mismo encuadre para todos: aguanta 25 o 100 productos sin dibujar nada.
   Sirve en el navegador (window.Ilustraciones) y en Node (build).
   ============================================================ */
(function (raiz) {
  "use strict";

  /* ---------- azar con semilla (mismo producto = mismo dibujo) ---------- */
  function hash(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function azar(semilla) {
    let a = hash(semilla);
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const f1 = function (n) { return Math.round(n * 10) / 10; };

  /* ---------- piezas: cada una dibujada alrededor de (0,0), ~14 px ---------- */
  const PIEZA = {
    almendra: function () {
      return '<path d="M0-7C4-5 5 2 0 7-5 2-4-5 0-7Z" fill="#A5633A"/>' +
        '<path d="M-1-4C1-1 1 2-1 5" stroke="#C3845A" stroke-width="1" fill="none" stroke-linecap="round"/>';
    },
    nuez: function () {
      return '<path d="M-7-2C-7-7-2-7 0-4 2-7 7-7 7-2 7 3 4 7 0 6-4 7-7 3-7-2Z" fill="#C99C60"/>' +
        '<path d="M0-4V5M-4-2C-3 0-4 2-3 4M4-2C3 0 4 2 3 4" stroke="#A97B42" stroke-width="1" fill="none" stroke-linecap="round"/>';
    },
    caju: function () {
      return '<path d="M-7-3C-6-8 4-9 7-3 8 1 6 5 3 5 3 1 0-2-3 0-6 2-8 0-7-3Z" fill="#E7D0A2"/>' +
        '<path d="M-5-3C-3-6 3-6 5-3" stroke="#F4E6C7" stroke-width="1.2" fill="none" stroke-linecap="round"/>';
    },
    pistacho: function () {
      return '<ellipse rx="6.5" ry="4.6" fill="#DCC79D"/>' +
        '<path d="M-3.5 0Q0-3.2 3.5 0 0 2.2-3.5 0Z" fill="#8EA54A"/>';
    },
    mani: function () {
      return '<ellipse rx="4.6" ry="3.4" fill="#D09658"/>' +
        '<path d="M0-3.2V3.2" stroke="#B37A40" stroke-width="0.9"/>';
    },
    pasa: function () {
      return '<path d="M-3-3C1-5 4-1 3 2 2 5-3 4-4 1-5-1-4-2-3-3Z" fill="#4B2B2E"/>' +
        '<path d="M-2-1C0 0 1 1 1 2" stroke="#6E4448" stroke-width="0.8" fill="none"/>';
    },
    avellana: function () {
      return '<circle r="5.2" fill="#9B5B33"/><circle cx="-1.6" cy="-1.8" r="1.6" fill="#B87A50"/>';
    },
    banana: function () {
      return '<circle r="6" fill="#F0D48C"/><circle r="3.4" fill="none" stroke="#D5B363" stroke-width="0.9"/>' +
        '<circle r="0.8" fill="#8B6A35"/>';
    },
    coco: function () {
      return '<path d="M-7 1Q0-5 7 1Q0-1.5-7 1Z" fill="#FBF7EE" stroke="#DCCFB6" stroke-width="0.7"/>';
    },
    anana: function () {
      return '<path d="M-5 4L0-6 5 4Z" fill="#F2C040"/><path d="M-2 1H2" stroke="#D9A42A" stroke-width="0.8"/>';
    },
    granola: function (r) {
      let s = '<path d="M-7-2C-6-7 2-8 6-4 9-1 6 6 1 6-4 7-8 3-7-2Z" fill="#C4884A"/>';
      for (let i = 0; i < 3; i++) {
        s += '<ellipse cx="' + f1(r() * 8 - 4) + '" cy="' + f1(r() * 6 - 3) + '" rx="2.4" ry="1.2" fill="#E9D4A4" transform="rotate(' + Math.round(r() * 180) + ')"/>';
      }
      return s;
    },
    chia: function (r) { return '<ellipse rx="1.7" ry="1.15" fill="' + (r() < 0.55 ? "#2F2B29" : "#8B857D") + '"/>'; },
    lino: function () { return '<ellipse rx="2.8" ry="1.45" fill="#BC8840"/><ellipse cx="-0.8" cy="-0.4" rx="1" ry="0.4" fill="#DDB273"/>'; },
    girasol: function () { return '<path d="M0-4.5C2.2-3 2.2 2.5 0 4.5-2.2 2.5-2.2-3 0-4.5Z" fill="#BDB4A3"/>'; },
    zapallo: function () { return '<path d="M-5 0C-3-3 3-3 5 0 3 3-3 3-5 0Z" fill="#7E9B4C"/><path d="M-3 0H3" stroke="#9AB566" stroke-width="0.7"/>'; },
    sesamo: function () { return '<ellipse rx="1.5" ry="0.85" fill="#F1E4C8"/>'; },
    mascabo: function (r) { return '<rect x="-1" y="-1" width="2" height="2" rx="0.4" fill="' + (r() < 0.5 ? "#7B4A27" : "#94603A") + '"/>'; },
    yerba: function (r) {
      if (r() < 0.14) return '<path d="M-4 0H4" stroke="#CDBE8C" stroke-width="1.3" stroke-linecap="round"/>';
      return '<path d="M-1.6-1L1.4-1.4 1.8 1.2-1.2 1.5Z" fill="' + (r() < 0.5 ? "#6F8C3A" : "#557129") + '"/>';
    },
    yerbaoscura: function (r) {
      if (r() < 0.12) return '<path d="M-4 0H4" stroke="#A89A6C" stroke-width="1.3" stroke-linecap="round"/>';
      return '<path d="M-1.6-1L1.4-1.4 1.8 1.2-1.2 1.5Z" fill="' + (r() < 0.5 ? "#4C5A2A" : "#39461F") + '"/>';
    }
  };

  /* Qué piezas y qué fondo tiene cada relleno. tam = separación de la grilla de piezas */
  const RELLENO = {
    almendra: { fondo: "#8A4F2C", piezas: ["almendra"], tam: 11, suelto: "almendra" },
    nuez: { fondo: "#A97B44", piezas: ["nuez"], tam: 13, suelto: "nuez" },
    caju: { fondo: "#D6BC88", piezas: ["caju"], tam: 12, suelto: "caju" },
    pistacho: { fondo: "#BFA87A", piezas: ["pistacho"], tam: 11, suelto: "pistacho" },
    mani: { fondo: "#B47C43", piezas: ["mani"], tam: 8, suelto: "mani" },
    mix: { fondo: "#8F5A34", piezas: ["almendra", "nuez", "mani", "caju", "pasa", "pasa"], tam: 11, suelto: "mixto" },
    tropical: { fondo: "#E4C27A", piezas: ["banana", "coco", "anana", "pasa", "mani"], tam: 11, suelto: "mixto" },
    mixnatural: { fondo: "#94603A", piezas: ["almendra", "nuez", "caju", "avellana"], tam: 12, suelto: "mixto" },
    granola: { fondo: "#B37838", piezas: ["granola"], tam: 12, suelto: "granola" },
    chia: { fondo: "#6D6862", piezas: ["chia"], tam: 3.6, suelto: null },
    lino: { fondo: "#9A6A2E", piezas: ["lino"], tam: 5, suelto: null },
    girasol: { fondo: "#A69C8A", piezas: ["girasol"], tam: 5.5, suelto: "girasol" },
    zapallo: { fondo: "#62803A", piezas: ["zapallo"], tam: 7, suelto: "zapallo" },
    mixsemillas: { fondo: "#8F8570", piezas: ["girasol", "zapallo", "sesamo", "lino", "chia", "sesamo"], tam: 5, suelto: null },
    mascabo: { fondo: "#6A3E1F", piezas: ["mascabo"], tam: 3.4, suelto: null },
    yerba: { fondo: "#5E7A31", piezas: ["yerba"], tam: 4, suelto: null },
    yerbaoscura: { fondo: "#3E4B22", piezas: ["yerbaoscura"], tam: 4, suelto: null }
  };

  /* Llena un rectángulo con piezas en grilla con ruido (queda como el producto a granel) */
  function granel(clave, x, y, w, h, r, escala) {
    const R = RELLENO[clave] || RELLENO.mix;
    const t = R.tam * (escala || 1);
    let s = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + R.fondo + '"/>';
    for (let fy = y - t / 2; fy < y + h + t; fy += t * 0.78) {
      for (let fx = x - t / 2; fx < x + w + t; fx += t * 0.9) {
        const tipo = R.piezas[Math.floor(r() * R.piezas.length)];
        const px = fx + (r() - 0.5) * t * 0.7, py = fy + (r() - 0.5) * t * 0.6;
        s += '<g transform="translate(' + f1(px) + " " + f1(py) + ") rotate(" + Math.round(r() * 360) + ") scale(" + f1((escala || 1) * (0.85 + r() * 0.3)) + ')">' +
          PIEZA[tipo](r) + "</g>";
      }
    }
    return s;
  }

  /* Piezas sueltas delante del envase: le dan escala y apetito */
  function sueltos(clave, r) {
    const R = RELLENO[clave];
    if (!R || !R.suelto) return "";
    const lista = R.suelto === "mixto" ? R.piezas.filter(function (p) { return p !== "pasa" || r() < 0.5; }) : [R.suelto];
    const pos = [[40, 172, 1.9], [60, 182, 1.7], [150, 178, 1.8], [166, 168, 1.5]];
    let s = "";
    pos.forEach(function (p, i) {
      const tipo = lista[(i + Math.floor(r() * lista.length)) % lista.length];
      s += '<g transform="translate(' + p[0] + " " + p[1] + ") rotate(" + Math.round(r() * 360) + ") scale(" + p[2] + ')">' + PIEZA[tipo](r) + "</g>";
    });
    return s;
  }

  /* La etiqueta de ticket que llevan todos los envases (el hilo de la marca) */
  function ticket(x, y, w, h) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="#FFFFFF" stroke="#1C1917" stroke-width="1.2"/>' +
      '<rect x="' + (x + 4) + '" y="' + (y + 4) + '" width="' + (w * 0.46) + '" height="3" fill="#1C1917"/>' +
      '<rect x="' + (x + 4) + '" y="' + (y + 10) + '" width="' + (w * 0.3) + '" height="2" fill="#6A625A"/>' +
      '<rect x="' + (x + w - 4 - w * 0.32) + '" y="' + (y + h - 8) + '" width="' + (w * 0.32) + '" height="4" fill="#C73E1D"/>' +
      barras(x + 4, y + h - 9, w * 0.34, 5);
  }
  function barras(x, y, w, h) {
    let s = "", cx = x;
    const anchos = [1, 0.5, 1.5, 0.5, 1, 1, 0.5, 1.5, 0.5, 1, 0.5, 1];
    for (let i = 0; cx < x + w; i++) {
      const a = anchos[i % anchos.length];
      if (i % 2 === 0) s += '<rect x="' + f1(cx) + '" y="' + y + '" width="' + a + '" height="' + h + '" fill="#1C1917"/>';
      cx += a + 0.6;
    }
    return s;
  }
  const sombra = function (cx, w) { return '<ellipse cx="' + cx + '" cy="184" rx="' + w + '" ry="6" fill="#1C1917" opacity=".10"/>'; };

  /* ---------- envases ---------- */
  function bolsa(p, r, uid) {
    const clip = "v" + uid;
    return sombra(100, 50) +
      '<path d="M60 38H140L148 170C148 176 144 180 138 180H62C56 180 52 176 52 170Z" fill="#FFFFFF"/>' +
      '<path d="M128 38H140L148 170C148 176 144 180 138 180H132Z" fill="#ECE8E1"/>' +
      '<rect x="60" y="30" width="80" height="14" fill="#1C1917"/>' +
      '<path d="M63 52H137" stroke="#D8D3CA" stroke-width="1.4"/>' +
      '<clipPath id="' + clip + '"><rect x="68" y="64" width="64" height="64" rx="32"/></clipPath>' +
      '<g clip-path="url(#' + clip + ')">' + granel(p.relleno, 68, 64, 64, 64, r) + "</g>" +
      '<rect x="68" y="64" width="64" height="64" rx="32" fill="none" stroke="#1C1917" stroke-opacity=".12" stroke-width="1.5"/>' +
      ticket(70, 138, 60, 28) + sueltos(p.relleno, r);
  }

  function frasco(p, r, uid) {
    const clip = "v" + uid;
    let dentro;
    if (p.relleno === "mielcremosa") {
      dentro = '<rect x="62" y="62" width="76" height="116" fill="#F2D68D"/>' +
        '<path d="M70 80C90 72 112 90 130 78M70 150C92 142 110 160 130 148" stroke="#FBE9B8" stroke-width="3" fill="none" stroke-linecap="round"/>';
    } else {
      dentro = '<rect x="62" y="62" width="76" height="116" fill="#E39A18"/>' + panal(62, 62, 76, 116, "#F2B63A");
      if (p.relleno === "mielnuez") {
        for (let i = 0; i < 7; i++) {
          dentro += '<g transform="translate(' + f1(72 + r() * 56) + " " + f1(72 + r() * 96) + ") rotate(" + Math.round(r() * 360) + ') scale(1.5)" opacity=".92">' + PIEZA.nuez() + "</g>";
        }
      }
      dentro += '<rect x="68" y="66" width="7" height="104" rx="3.5" fill="#FFFFFF" opacity=".28"/>';
    }
    return sombra(100, 44) +
      '<clipPath id="' + clip + '"><rect x="62" y="62" width="76" height="116" rx="12"/></clipPath>' +
      '<g clip-path="url(#' + clip + ')">' + dentro + "</g>" +
      '<rect x="62" y="62" width="76" height="116" rx="12" fill="none" stroke="#1C1917" stroke-opacity=".15" stroke-width="1.5"/>' +
      '<rect x="66" y="40" width="68" height="24" rx="3" fill="#1C1917"/>' +
      '<path d="M72 46V58M80 46V58M88 46V58M96 46V58M104 46V58M112 46V58M120 46V58M128 46V58" stroke="#3A3531" stroke-width="2"/>' +
      '<rect x="62" y="112" width="76" height="34" fill="#FFFFFF"/>' + ticket(70, 116, 60, 26);
  }
  function panal(x, y, w, h, color) {
    let s = '<g fill="none" stroke="' + color + '" stroke-width="1.3" opacity=".7">';
    const a = 9, dx = a * 1.732, dy = a * 1.5;
    for (let fila = 0, py = y; py < y + h + a; py += dy, fila++) {
      for (let px = x + (fila % 2 ? dx / 2 : 0); px < x + w + a; px += dx) {
        s += '<path d="M' + f1(px) + " " + f1(py - a) + "l" + f1(dx / 2) + " " + f1(a / 2) + "v" + a + "l" + f1(-dx / 2) + " " + f1(a / 2) + "l" + f1(-dx / 2) + " " + f1(-a / 2) + "v" + (-a) + 'z"/>';
      }
    }
    return s + "</g>";
  }

  function paquete(p, r, uid) {
    const clip = "v" + uid;
    return sombra(100, 46) +
      '<path d="M62 46H138V178H62Z" fill="#1C1917"/>' +
      '<path d="M62 46L70 36H130L138 46Z" fill="#35302C"/>' +
      '<path d="M126 46H138V178H126Z" fill="#2A2522"/>' +
      '<clipPath id="' + clip + '"><rect x="72" y="62" width="50" height="58"/></clipPath>' +
      '<g clip-path="url(#' + clip + ')">' + granel(p.relleno, 72, 62, 50, 58, r) + "</g>" +
      ticket(70, 132, 54, 30);
  }

  function mate(p, r) {
    return sombra(96, 46) +
      '<path d="M100 34L142 6" stroke="#B9BDC3" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M140 7C146 3 152 6 150 12" stroke="#B9BDC3" stroke-width="5" fill="none" stroke-linecap="round"/>' +
      '<path d="M60 60C44 84 44 130 62 156 74 174 118 174 130 156 148 130 148 84 132 60Z" fill="#6B3A22"/>' +
      '<path d="M72 70C62 92 62 128 74 150" stroke="#8A5334" stroke-width="5" fill="none" stroke-linecap="round"/>' +
      '<path d="M60 60C62 82 130 82 132 60" stroke="#4E2915" stroke-width="2" fill="none" stroke-dasharray="3 4"/>' +
      '<ellipse cx="96" cy="58" rx="38" ry="11" fill="#C9CCD1"/>' +
      '<ellipse cx="96" cy="57" rx="31" ry="7" fill="#5E7A31"/>' +
      granelEnElipse(r) +
      '<path d="M84 60L100 34" stroke="#C9CCD1" stroke-width="5" stroke-linecap="round"/>' +
      ticket(80, 118, 34, 22);
  }
  function granelEnElipse(r) {
    let s = "";
    for (let i = 0; i < 26; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r());
      s += '<g transform="translate(' + f1(96 + Math.cos(a) * d * 28) + " " + f1(57 + Math.sin(a) * d * 6) + ') rotate(' + Math.round(r() * 360) + ')">' + PIEZA.yerba(r) + "</g>";
    }
    return s;
  }

  function bombilla() {
    return sombra(100, 54) +
      '<g transform="rotate(-38 100 104)">' +
      '<rect x="96" y="28" width="8" height="132" rx="4" fill="#C9CCD1"/>' +
      '<rect x="97.5" y="30" width="2.5" height="128" rx="1.2" fill="#E8EAED"/>' +
      '<path d="M100 30C100 16 88 12 84 20" stroke="#C9CCD1" stroke-width="8" fill="none" stroke-linecap="round"/>' +
      '<rect x="92" y="54" width="16" height="10" rx="3" fill="#B08D57"/>' +
      '<path d="M88 160C88 150 112 150 112 160V174C112 186 88 186 88 174Z" fill="#AEB2B8"/>' +
      '<path d="M92 162H108M92 168H108M92 174H108" stroke="#8C9096" stroke-width="1.6"/>' +
      "</g>" + ticket(126, 126, 44, 26);
  }

  /* Box: caja carbón abierta, con lo que trae asomando + faja miel + tarjeta */
  function caja(p, r) {
    let asoma;
    if (p.relleno === "box-matero") {
      asoma = '<path d="M68 90C62 70 70 52 88 50 104 48 114 64 110 90Z" fill="#6B3A22"/>' +
        '<ellipse cx="89" cy="54" rx="17" ry="5" fill="#C9CCD1"/><ellipse cx="89" cy="53.5" rx="13" ry="3" fill="#5E7A31"/>' +
        '<path d="M92 52L112 26" stroke="#C9CCD1" stroke-width="4" stroke-linecap="round"/>' +
        '<rect x="116" y="56" width="30" height="40" fill="#FFFFFF"/><rect x="116" y="50" width="30" height="8" fill="#1C1917"/>';
    } else if (p.relleno === "box-desayuno") {
      asoma = '<rect x="58" y="58" width="30" height="40" fill="#FFFFFF"/><rect x="58" y="52" width="30" height="8" fill="#1C1917"/>' +
        '<rect x="94" y="62" width="30" height="36" rx="6" fill="#E39A18"/><rect x="96" y="52" width="26" height="12" rx="2" fill="#1C1917"/>' +
        '<rect x="128" y="64" width="24" height="34" fill="#FFFFFF"/><rect x="128" y="58" width="24" height="8" fill="#1C1917"/>';
    } else {
      asoma = "";
      [[54, 60], [80, 52], [106, 58], [132, 64]].forEach(function (b, i) {
        asoma += '<rect x="' + b[0] + '" y="' + b[1] + '" width="24" height="' + (100 - b[1]) + '" fill="#FFFFFF"/>' +
          '<rect x="' + b[0] + '" y="' + (b[1] - 6) + '" width="24" height="7" fill="#1C1917"/>' +
          '<circle cx="' + (b[0] + 12) + '" cy="' + (b[1] + 16) + '" r="7" fill="' + ["#8A4F2C", "#A97B44", "#D6BC88", "#BFA87A"][i] + '"/>';
      });
    }
    return sombra(100, 62) +
      '<path d="M44 84H156L150 96H50Z" fill="#35302C"/>' + asoma +
      '<rect x="40" y="94" width="120" height="84" fill="#1C1917"/>' +
      '<rect x="40" y="94" width="120" height="6" fill="#2F2A26"/>' +
      '<rect x="88" y="94" width="18" height="84" fill="#E9A21B"/>' +
      '<rect x="40" y="128" width="120" height="12" fill="#E9A21B"/>' +
      '<path d="M97 128C84 112 72 118 80 128M97 128C110 112 122 118 114 128" stroke="#C98710" stroke-width="5" fill="none" stroke-linecap="round"/>' +
      '<g transform="rotate(-8 140 150)">' + ticket(122, 146, 40, 24) + "</g>";
  }

  const ENVASE = { bolsa: bolsa, frasco: frasco, paquete: paquete, mate: mate, bombilla: bombilla, caja: caja };
  let contador = 0;

  /* API: devuelve el <svg> como texto */
  function svg(p, opciones) {
    const o = opciones || {};
    const r = azar(p.id || p.nombre || "x");
    const uid = (p.id || "p").replace(/[^a-z0-9]/gi, "") + (o.uid || ++contador);
    const dibujar = ENVASE[p.envase] || bolsa;
    const titulo = o.titulo ? "<title>" + o.titulo + "</title>" : "";
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" ' +
      (o.decorativa === false ? 'role="img"' : 'aria-hidden="true" focusable="false"') + ">" +
      titulo + dibujar(p, r, uid) + "</svg>";
  }

  const API = { svg: svg, envases: Object.keys(ENVASE), rellenos: Object.keys(RELLENO) };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else raiz.Ilustraciones = API;
})(typeof window !== "undefined" ? window : globalThis);
