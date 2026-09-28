/* ============================================================
   store.js · datos de la tienda en el navegador
   - Catálogo: data/productos.json, o la copia que guarda el panel /admin.
   - Carrito, pedidos, datos del cliente y envíos: localStorage.
   DEMO: lo que guarda el panel vive en ESTE navegador. En la versión
   final estas funciones leen y escriben en la base de datos.
   ============================================================ */
(function () {
  "use strict";
  const CFG = window.TIENDA_CONFIG;
  const K = {
    catalogo: "tienda_catalogo",
    envios: "tienda_envios",
    carrito: "tienda_carrito",
    pedidos: "tienda_pedidos",
    cliente: "tienda_cliente",
    historial: "tienda_historial"
  };

  function leer(clave, porDefecto) {
    try { const v = localStorage.getItem(clave); return v ? JSON.parse(v) : porDefecto; }
    catch (err) { return porDefecto; }
  }
  function escribir(clave, valor) {
    try { localStorage.setItem(clave, JSON.stringify(valor)); return true; }
    catch (err) { console.warn("No se pudo guardar", clave, err); return false; }
  }
  function borrar(clave) { try { localStorage.removeItem(clave); } catch (err) { /* nada */ } }

  let base = null;
  async function cargarBase() {
    if (base) return base;
    const r = await fetch("/data/productos.json", { cache: "no-store" });
    if (!r.ok) throw new Error("No se pudo leer data/productos.json");
    base = await r.json();
    return base;
  }

  /* Catálogo vigente: si el panel guardó cambios, esa copia; si no, el JSON */
  async function catalogo() {
    const guardado = leer(K.catalogo, null);
    if (guardado && guardado.productos) return guardado;
    return JSON.parse(JSON.stringify(await cargarBase()));
  }
  function guardarCatalogo(c) { c.actualizado = new Date().toISOString().slice(0, 10); return escribir(K.catalogo, c); }
  function hayCambios() { return !!leer(K.catalogo, null); }

  function envios() { return leer(K.envios, null) || CFG.envios; }
  function guardarEnvios(v) { return escribir(K.envios, v); }

  /* ---------- carrito: [{ id, pres, cant, dedicatoria }] ---------- */
  const oyentes = [];
  function carrito() { return leer(K.carrito, []); }
  function guardarCarrito(c) { escribir(K.carrito, c); oyentes.forEach(function (f) { f(c); }); }
  function alCambiarCarrito(f) { oyentes.push(f); }
  function agregar(id, pres, cant, dedicatoria) {
    const c = carrito();
    const linea = c.find(function (x) { return x.id === id && x.pres === pres; });
    if (linea) { linea.cant += cant; if (dedicatoria) linea.dedicatoria = dedicatoria; }
    else c.push({ id: id, pres: pres, cant: cant, dedicatoria: dedicatoria || "" });
    guardarCarrito(c);
  }
  function unidades() { return carrito().reduce(function (a, x) { return a + x.cant; }, 0); }
  window.addEventListener("storage", function (ev) { if (ev.key === K.carrito) oyentes.forEach(function (f) { f(carrito()); }); });

  /* ---------- pedidos (los ve el panel) ---------- */
  function pedidos() { return leer(K.pedidos, null) || pedidosEjemplo(); }
  function guardarPedidos(v) { return escribir(K.pedidos, v); }
  function proximoNumero() {
    const lista = pedidos();
    const max = lista.reduce(function (a, x) { return Math.max(a, x.numero || 0); }, CFG.primerNumeroPedido - 1);
    return max + 1;
  }
  function registrarPedido(p) { const lista = pedidos(); lista.unshift(p); guardarPedidos(lista); }

  /* Tres pedidos de ejemplo para que el panel no arranque vacío */
  function pedidosEjemplo() {
    const hoy = new Date();
    const hace = function (h) { return new Date(hoy.getTime() - h * 3600000).toISOString(); };
    return [
      { numero: 100, ejemplo: true, fecha: hace(3), estado: "nuevo", cliente: { nombre: "Laura G." },
        entrega: { tipo: "envio", zona: "Morón · Haedo · Ituzaingó", direccion: "Machado 800, Morón" }, pago: "Transferencia",
        items: [{ nombre: "Box Regalo Frutos Secos", pres: "Box", cant: 1, precio: 34900, dedicatoria: "¡Feliz cumple, Marta!" },
          { nombre: "Miel pura de monte", pres: "1 kg", cant: 1, precio: 13900 }], envio: 0, total: 48800 },
      { numero: 99, ejemplo: true, fecha: hace(26), estado: "preparando", cliente: { nombre: "Martín R." },
        entrega: { tipo: "retiro", zona: "Retiro en Castelar" }, pago: "Efectivo",
        items: [{ nombre: "Almendras non pareil", pres: "1 kg", cant: 1, precio: 26000 },
          { nombre: "Semillas de chía", pres: "500 g", cant: 2, precio: 5100 }], envio: 0, total: 36200 },
      { numero: 98, ejemplo: true, fecha: hace(50), estado: "entregado", cliente: { nombre: "Sofía P." },
        entrega: { tipo: "envio", zona: "Castelar", direccion: "Arias 2100, Castelar" }, pago: "Mercado Pago",
        items: [{ nombre: "Yerba mate orgánica con palo", pres: "1 kg", cant: 2, precio: 11900 },
          { nombre: "Mix energético", pres: "500 g", cant: 1, precio: 8100 }], envio: 2000, total: 33900 }
    ];
  }

  function cliente() { return leer(K.cliente, {}); }
  function guardarCliente(v) { return escribir(K.cliente, v); }
  function historial() { return leer(K.historial, []); }
  function anotar(texto) { const h = historial(); h.unshift({ fecha: new Date().toISOString(), texto: texto }); escribir(K.historial, h.slice(0, 30)); }

  /* Volver a la demo original (borra lo que hizo el panel en este navegador) */
  function reiniciar() { [K.catalogo, K.envios, K.pedidos, K.historial].forEach(borrar); }

  /* Variante visual para que Damián compare: ?v=b / ?v=c (se recuerda en la sesión) */
  (function () {
    try {
      const v = new URLSearchParams(location.search).get("v");
      if (v) sessionStorage.setItem("tienda_variante", v === "a" ? "" : v);
    } catch (err) { /* nada */ }
  })();

  window.Store = {
    CFG: CFG, cargarBase: cargarBase, catalogo: catalogo, guardarCatalogo: guardarCatalogo, hayCambios: hayCambios,
    envios: envios, guardarEnvios: guardarEnvios,
    carrito: carrito, guardarCarrito: guardarCarrito, alCambiarCarrito: alCambiarCarrito, agregar: agregar, unidades: unidades,
    pedidos: pedidos, guardarPedidos: guardarPedidos, proximoNumero: proximoNumero, registrarPedido: registrarPedido,
    cliente: cliente, guardarCliente: guardarCliente, historial: historial, anotar: anotar, reiniciar: reiniciar
  };
})();
