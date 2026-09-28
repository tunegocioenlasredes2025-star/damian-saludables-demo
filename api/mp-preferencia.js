/* ============================================================
   /api/mp-preferencia · Mercado Pago Checkout Pro (PREPARADO, apagado en la demo)

   Para activarlo:
   1. En Vercel → Settings → Environment Variables: MP_ACCESS_TOKEN = access token
      de producción de la cuenta de Mercado Pago del cliente (nunca en el código).
   2. En assets/js/config.js: pagos.mercadoPago.activo = true
   3. Redeploy.

   Los precios NO se toman del navegador: se recalculan con data/productos.json
   (en la versión final, con la base de datos). Así nadie paga $1 editando la página.
   ============================================================ */
const N = require("../assets/js/nucleo.js");
const CFG = require("../assets/js/config.js");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Usar POST" });
  }
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    return res.status(501).json({ error: "Mercado Pago todavía no está conectado (falta MP_ACCESS_TOKEN)." });
  }

  let pedido = req.body;
  if (typeof pedido === "string") { try { pedido = JSON.parse(pedido); } catch (x) { pedido = null; } }
  if (!pedido || !Array.isArray(pedido.items) || !pedido.items.length || pedido.items.length > 60) {
    return res.status(400).json({ error: "Pedido vacío o inválido" });
  }

  const catalogo = require("../data/productos.json");
  const items = [];
  for (const it of pedido.items) {
    const p = N.porId(catalogo, String(it.id || ""));
    if (!p) return res.status(400).json({ error: "Producto inexistente: " + it.id });
    const pres = p.presentaciones.find(function (x) { return x.etiqueta === it.pres; }) || p.presentaciones[0];
    const cant = Math.max(1, Math.min(50, parseInt(it.cant, 10) || 1));
    items.push({
      id: p.id + "-" + pres.id,
      title: (p.nombre + " " + (p.tipo === "pack" ? "" : pres.etiqueta)).trim().slice(0, 250),
      quantity: cant,
      unit_price: N.precio(p, pres, catalogo).precio,
      currency_id: "ARS"
    });
  }
  const subtotal = items.reduce(function (a, x) { return a + x.unit_price * x.quantity; }, 0);
  const zonaId = pedido.entrega && pedido.entrega.tipo === "envio"
    ? ((CFG.envios.zonas.find(function (z) { return z.nombre === pedido.entrega.zona; }) || {}).id || "") : "retiro";
  const envio = N.costoEnvio(CFG.envios, zonaId, subtotal);
  if (envio.costo > 0) items.push({ id: "envio", title: "Envío · " + pedido.entrega.zona, quantity: 1, unit_price: envio.costo, currency_id: "ARS" });

  const base = CFG.urlBase.replace(/\/$/, "");
  const r = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({
      items: items,
      external_reference: CFG.prefijoPedido + "-" + (parseInt(pedido.numero, 10) || 0),
      back_urls: { success: base + "/?pago=ok", pending: base + "/?pago=pendiente", failure: base + "/?pago=error" },
      auto_return: "approved",
      statement_descriptor: String(CFG.BRAND_NAME).slice(0, 22)
    })
  });
  const d = await r.json();
  if (!r.ok) return res.status(502).json({ error: "Mercado Pago rechazó la preferencia", detalle: d.message || null });
  return res.status(200).json({ id: d.id, init_point: d.init_point });
};
