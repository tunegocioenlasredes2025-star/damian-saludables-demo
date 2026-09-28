/* ============================================================
   nucleo.js · cuentas de la tienda (sin DOM)
   Precios, promociones, precio por kilo, ahorro de los boxes, stock.
   Lo usan el navegador (window.Nucleo) y el generador de páginas (Node).
   ============================================================ */
(function (raiz) {
  "use strict";

  const fmtNum = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
  /* Formato argentino: $ 12.345 (con espacio duro para que no se corte) */
  function fmt(n) { return n == null ? "—" : "$ " + fmtNum.format(Math.round(n)); }
  function num(n) { return fmtNum.format(Math.round(n)); }
  /* 500 → "0,500 kg" (como lo imprime la balanza) */
  function kgTicket(g) { return (g / 1000).toFixed(3).replace(".", ",") + " kg"; }

  function normalizar(s) {
    return (s || "").toString().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }
  function slug(s) {
    return normalizar(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "producto";
  }
  function escapar(s) {
    return (s == null ? "" : String(s)).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function presentacion(p, presId) {
    return p.presentaciones.find(function (x) { return x.id === presId; }) || p.presentaciones[0];
  }
  /* La primera con stock, para que la tarjeta nunca arranque en "sin stock" si hay otra */
  function presPorDefecto(p) {
    const conStock = p.presentaciones.filter(function (x) { return x.stock > 0; });
    if (!conStock.length) return p.presentaciones[0];
    /* en los que se venden por peso, arrancar en 500 g si existe (la más vendida) */
    return conStock.find(function (x) { return x.gramos === 500; }) || conStock[0];
  }
  function stockTotal(p) {
    return p.presentaciones.reduce(function (a, x) { return a + Math.max(0, x.stock || 0); }, 0);
  }
  function disponible(p) { return p.activo !== false && stockTotal(p) > 0; }

  /* Promoción activa que le toca a un producto (la de mayor descuento) */
  function promoDe(p, catalogo) {
    const promos = (catalogo.promociones || []).filter(function (pr) {
      if (!pr.activa) return false;
      if (pr.alcance === "todo") return true;
      if (pr.alcance === "categoria") return pr.objetivo === p.categoria;
      if (pr.alcance === "producto") return pr.objetivo === p.id;
      return false;
    });
    promos.sort(function (a, b) { return b.valor - a.valor; });
    return promos[0] || null;
  }

  /* Precio final de una presentación: { precio, antes, promo, precioKg } */
  function precio(p, pres, catalogo) {
    const promo = promoDe(p, catalogo);
    let final = pres.precio;
    if (promo) final = Math.round(pres.precio * (1 - promo.valor / 100) / 100) * 100;   // $ 7.500, no $ 7.470
    return {
      precio: final,
      antes: promo ? pres.precio : null,
      promo: promo,
      precioKg: pres.gramos ? Math.round(final * 1000 / pres.gramos) : null
    };
  }

  function porId(catalogo, id) {
    return catalogo.productos.find(function (x) { return x.id === id; }) || null;
  }

  /* Lo que trae un box, con nombres y lo que saldría comprarlo suelto */
  function contenidoBox(p, catalogo) {
    const items = (p.contenido || []).map(function (c) {
      const q = porId(catalogo, c.producto);
      if (!q) return { nombre: c.texto || c.producto, detalle: "", suelto: 0 };
      const pr = presentacion(q, c.presentacion);
      const cant = c.cantidad || 1;
      return {
        id: q.id,
        nombre: q.nombre,
        detalle: (cant > 1 ? cant + " × " : "") + (pr.gramos ? pr.etiqueta : pr.etiqueta === "Unidad" ? "" : pr.etiqueta),
        suelto: precio(q, pr, catalogo).precio * cant
      };
    });
    const suelto = items.reduce(function (a, x) { return a + x.suelto; }, 0);
    const pBox = precio(p, p.presentaciones[0], catalogo).precio;
    return { items: items, suelto: suelto, ahorro: Math.max(0, suelto - pBox) };
  }

  function nombreCategoria(catalogo, id) {
    const c = catalogo.categorias.find(function (x) { return x.id === id; });
    return c ? c.nombre : id;
  }

  /* Envío: { costo, gratis, faltaParaGratis } */
  function costoEnvio(envios, zonaId, subtotal) {
    if (zonaId === "retiro") return { costo: 0, gratis: true, faltaParaGratis: 0 };
    const zona = (envios.zonas || []).find(function (z) { return z.id === zonaId; });
    if (!zona) return { costo: 0, gratis: false, faltaParaGratis: 0, sinZona: true };
    const umbral = envios.gratisDesde || 0;
    if (umbral && subtotal >= umbral) return { costo: 0, gratis: true, faltaParaGratis: 0 };
    return { costo: zona.costo, gratis: false, faltaParaGratis: umbral ? umbral - subtotal : 0 };
  }

  /* Redondeo para los aumentos: al múltiplo de 10, 50 o 100 más cercano */
  function redondear(n, paso) { paso = paso || 10; return Math.round(n / paso) * paso; }

  const API = {
    fmt: fmt, num: num, kgTicket: kgTicket, normalizar: normalizar, slug: slug, escapar: escapar,
    presentacion: presentacion, presPorDefecto: presPorDefecto, stockTotal: stockTotal, disponible: disponible,
    promoDe: promoDe, precio: precio, porId: porId, contenidoBox: contenidoBox, nombreCategoria: nombreCategoria,
    costoEnvio: costoEnvio, redondear: redondear
  };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else raiz.Nucleo = API;
})(typeof window !== "undefined" ? window : globalThis);
