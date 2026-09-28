/* ============================================================
   CONFIGURACIÓN DE LA TIENDA (demo para Damián, Castelar)
   Todo lo que cambia sin tocar el resto del código.
   Después de cambiar BRAND_NAME correr:  node _build/generar.js
   ============================================================ */
(function (raiz) {
  const CONFIG = {
    /* Nombre de marca: NO ESTÁ DEFINIDO. Cambiarlo acá cambia toda la tienda. */
    BRAND_NAME: "Tu Marca",
    marcaProvisoria: true,                 // muestra "nombre provisorio" junto al logotipo
    rubro: "Frutos secos, semillas, miel y yerba",
    localidad: "Castelar, Zona Oeste",
    urlBase: "https://damian-saludables-demo.vercel.app",

    /* WhatsApp que recibe los pedidos, con código de país y sin "+" (ej. "5491122334455").
       Vacío: WhatsApp se abre para elegir a quién mandarlo (sirve para probar la demo). */
    whatsapp: "",
    whatsappVisible: "",
    instagram: "",                         // ej. "https://www.instagram.com/tu_marca/"
    email: "",

    /* Envíos: el panel /admin los pisa (se guardan en el navegador en la demo) */
    envios: {
      retiro: { activo: true, nombre: "Retiro en Castelar", detalle: "Punto de retiro a confirmar · lunes a sábado" },
      gratisDesde: 60000,
      zonas: [
        { id: "castelar", nombre: "Castelar", costo: 2000 },
        { id: "moron-haedo", nombre: "Morón · Haedo · Ituzaingó", costo: 3000 },
        { id: "oeste", nombre: "Ramos Mejía · Hurlingham · Merlo · Padua", costo: 4200 },
        { id: "caba", nombre: "CABA", costo: 6500 }
      ]
    },

    /* Pagos. Mercado Pago queda preparado: ver api/mp-preferencia.js y el README. */
    pagos: {
      transferencia: true,
      efectivo: true,
      mercadoPago: { activo: false, endpoint: "/api/mp-preferencia" }
    },

    prefijoPedido: "TM",
    primerNumeroPedido: 101,
    adminPin: "1234",
    esDemo: true,
    avisoDemo: "Demo · Los productos, precios y el nombre son de ejemplo. Todo se reemplaza por los tuyos."
  };
  if (typeof module !== "undefined" && module.exports) module.exports = CONFIG;
  else raiz.TIENDA_CONFIG = CONFIG;
})(typeof window !== "undefined" ? window : globalThis);
