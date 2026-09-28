/* ============================================================
   carrito.js · panel del pedido + checkout en una sola pantalla
   Productos → entrega → datos → pago → WhatsApp con el mensaje armado.
   Mercado Pago queda preparado (pagos.mercadoPago en config.js).
   ============================================================ */
(function () {
  "use strict";
  const S = window.Store, N = window.Nucleo, V = window.Vistas, CFG = S.CFG;
  const e = N.escapar;
  let catalogo = null, panel = null, ultimoFoco = null;

  function lineas() {
    return S.carrito().map(function (l) {
      const p = N.porId(catalogo, l.id);
      if (!p) return null;
      const pres = N.presentacion(p, l.pres);
      const pr = N.precio(p, pres, catalogo);
      return { l: l, p: p, pres: pres, pr: pr, total: pr.precio * l.cant };
    }).filter(Boolean);
  }

  /* ---------- contador del header ---------- */
  function actualizarContador() {
    const n = S.unidades();
    document.querySelectorAll("[data-contador]").forEach(function (el) {
      el.textContent = n;
      el.hidden = n === 0;
    });
    document.querySelectorAll(".cab__carrito").forEach(function (b) {
      b.setAttribute("aria-label", n ? "Ver pedido, " + n + (n === 1 ? " producto" : " productos") : "Ver pedido, vacío");
    });
    /* barra fija abajo en el celular: el total siempre a la vista */
    const barra = document.querySelector(".barra-pedido");
    if (barra && catalogo) {
      const total = lineas().reduce(function (a, x) { return a + x.total; }, 0);
      barra.hidden = n === 0;
      document.body.classList.toggle("con-barra", n > 0);
      barra.querySelector("[data-barra-n]").textContent = n + (n === 1 ? " producto" : " productos");
      barra.querySelector("[data-barra-total]").textContent = N.fmt(total);
    }
    document.querySelectorAll(".cab__n:not([hidden])").forEach(function (el) {
      el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop");
    });
  }

  /* Aviso corto al agregar (no abre el panel: el que sigue mirando, sigue comprando) */
  let timerAviso;
  function avisar(texto) {
    let t = document.querySelector(".aviso-agregado");
    if (!t) {
      t = document.createElement("div");
      t.className = "aviso-agregado";
      t.setAttribute("role", "status");
      document.body.appendChild(t);
    }
    t.innerHTML = '<span>' + e(texto) + '</span><button type="button" class="aviso-agregado__ver" data-abrir-carrito>Ver pedido</button>';
    t.classList.add("aviso-agregado--on");
    clearTimeout(timerAviso);
    timerAviso = setTimeout(function () { t.classList.remove("aviso-agregado--on"); }, 3200);
  }

  /* ---------- panel ---------- */
  function abrir() {
    ultimoFoco = document.activeElement;
    pintar();
    if (typeof panel.showModal === "function") panel.showModal(); else panel.setAttribute("open", "");
    document.documentElement.classList.add("sin-scroll");
    const cerrar = panel.querySelector("[data-cerrar]");
    if (cerrar) cerrar.focus();
  }
  function cerrar() {
    if (typeof panel.close === "function") panel.close(); else panel.removeAttribute("open");
  }

  function pintar(estadoEnviado) {
    const cuerpo = panel.querySelector(".panel__cuerpo");
    if (estadoEnviado) { cuerpo.innerHTML = estadoEnviado; return; }
    const ls = lineas();
    if (!ls.length) {
      cuerpo.innerHTML = '<div class="panel__vacio"><p class="panel__vacio-t">Tu pedido está vacío.</p>' +
        '<p>Elegí lo que quieras del catálogo: cada producto tiene su precio por kilo a la vista.</p>' +
        '<a class="btn btn--linea" href="/#catalogo" data-cerrar>Ver productos</a></div>';
      return;
    }
    const cli = S.cliente();
    const env = S.envios();
    const subtotal = ls.reduce(function (a, x) { return a + x.total; }, 0);
    const entrega = cli.entrega || (env.retiro && env.retiro.activo ? "retiro" : "envio");
    const zona = cli.zona || "";
    const ce = N.costoEnvio(env, entrega === "retiro" ? "retiro" : zona, subtotal);
    const pago = cli.pago || "Transferencia";

    let h = '<ul class="lineas">';
    ls.forEach(function (x, i) {
      h += '<li class="linea" data-i="' + i + '">' +
        '<a class="linea__foto" href="' + V.url(x.p) + '" tabindex="-1" aria-hidden="true">' + V.plato(x.p, x.p.tipo === "pack" ? "plato--box" : "") + "</a>" +
        '<div class="linea__info"><p class="linea__nombre">' + e(x.p.nombre) + "</p>" +
        '<p class="linea__det">' + e(x.pres.etiqueta) + " · " + N.fmt(x.pr.precio) + (x.pr.antes ? ' <span class="linea__promo">−' + x.pr.promo.valor + " %</span>" : "") + "</p>" +
        '<div class="cantidad cantidad--chica" role="group" aria-label="Cantidad de ' + e(x.p.nombre) + '">' +
        '<button type="button" class="cantidad__btn" data-linea="menos" aria-label="Uno menos">−</button>' +
        '<span class="cantidad__num" aria-live="polite">' + x.l.cant + "</span>" +
        '<button type="button" class="cantidad__btn" data-linea="mas" aria-label="Uno más"' + (x.l.cant >= x.pres.stock ? " disabled" : "") + ">+</button></div>" +
        (x.p.tipo === "pack" && x.p.dedicatoria
          ? '<label class="linea__dedic"><span>Dedicatoria (opcional)</span><input type="text" maxlength="160" data-dedicatoria value="' + e(x.l.dedicatoria) + '" placeholder="Ej.: ¡Feliz cumple!"></label>' : "") +
        "</div>" +
        '<div class="linea__der"><p class="linea__total">' + N.fmt(x.total) + "</p>" +
        '<button type="button" class="linea__quitar" data-linea="quitar">Quitar<span class="sr"> ' + e(x.p.nombre) + "</span></button></div></li>";
    });
    h += "</ul>";

    /* entrega */
    h += '<form class="checkout" novalidate><fieldset class="bloque"><legend>Entrega</legend><div class="opciones">';
    if (env.retiro && env.retiro.activo) {
      h += opcion("entrega", "retiro", entrega === "retiro", env.retiro.nombre, "Sin cargo · " + env.retiro.detalle);
    }
    h += opcion("entrega", "envio", entrega === "envio", "Envío a domicilio",
      env.gratisDesde ? "Gratis desde " + N.fmt(env.gratisDesde) : "Según la zona");
    h += "</div>";
    if (entrega === "envio") {
      h += '<div class="campo"><label for="ck-zona">Zona</label><select id="ck-zona" name="zona" required>' +
        '<option value="">Elegí tu zona</option>';
      env.zonas.forEach(function (z) {
        h += '<option value="' + e(z.id) + '"' + (z.id === zona ? " selected" : "") + ">" + e(z.nombre) + " · " + N.fmt(z.costo) + "</option>";
      });
      h += '</select></div><div class="campo"><label for="ck-dir">Dirección</label>' +
        '<input id="ck-dir" name="direccion" autocomplete="street-address" required value="' + e(cli.direccion || "") + '" placeholder="Calle, número y localidad"></div>';
      if (env.gratisDesde && ce.faltaParaGratis > 0 && zona) {
        const pct = Math.min(100, Math.round(subtotal / env.gratisDesde * 100));
        h += '<div class="falta"><p>Te faltan <strong>' + N.fmt(ce.faltaParaGratis) + "</strong> para el envío gratis.</p>" +
          '<div class="falta__barra" aria-hidden="true"><span style="width:' + pct + '%"></span></div></div>';
      }
    }
    h += "</fieldset>";

    /* datos */
    h += '<fieldset class="bloque"><legend>Tus datos</legend>' +
      '<div class="campo"><label for="ck-nombre">Nombre</label><input id="ck-nombre" name="nombre" autocomplete="name" required value="' + e(cli.nombre || "") + '" placeholder="Cómo te llamás"></div>' +
      '<div class="campo"><label for="ck-notas">Notas <span class="opcional">(opcional)</span></label><input id="ck-notas" name="notas" value="' + e(cli.notas || "") + '" placeholder="Horario, timbre, si es para regalar…"></div>' +
      "</fieldset>";

    /* pago */
    h += '<fieldset class="bloque"><legend>Pago</legend><div class="opciones opciones--pago">';
    const pagos = [];
    if (CFG.pagos.transferencia) pagos.push(["Transferencia", "Te pasamos el alias por WhatsApp"]);
    if (CFG.pagos.efectivo) pagos.push(["Efectivo", "Al retirar o al recibir"]);
    pagos.push(["Mercado Pago", CFG.pagos.mercadoPago.activo ? "Tarjeta, débito o dinero en cuenta" : "Te mandamos el link de pago"]);
    pagos.forEach(function (x) { h += opcion("pago", x[0], pago === x[0], x[0], x[1]); });
    h += "</div>";
    if (pago === "Mercado Pago" && !CFG.pagos.mercadoPago.activo && CFG.esDemo) {
      h += '<p class="ayuda ayuda--demo">En la versión final este botón abre el pago de Mercado Pago acá mismo. En la demo, el link te llega por WhatsApp.</p>';
    }
    h += "</fieldset>";

    /* totales + botón */
    h += '<div class="totales">' +
      fila("Subtotal", N.fmt(subtotal)) +
      fila(entrega === "retiro" ? "Retiro" : "Envío", entrega === "retiro" ? "Sin cargo" : !zona ? "Elegí zona" : ce.gratis ? "Gratis" : N.fmt(ce.costo)) +
      '<div class="totales__fila totales__total"><span>Total</span><span>' + N.fmt(subtotal + ce.costo) + "</span></div></div>" +
      '<p class="checkout__error" role="alert" hidden></p>' +
      '<button type="submit" class="btn btn--wa btn--grande">' + iconoWA() + "Enviar pedido por WhatsApp</button>" +
      '<p class="ayuda ayuda--centro">Te respondemos para confirmar stock, pago y horario. No hace falta registrarse.</p>' +
      "</form>";
    cuerpo.innerHTML = h;
  }
  function opcion(nombre, valor, on, titulo, detalle) {
    return '<label class="opcion"><input type="radio" name="' + nombre + '" value="' + e(valor) + '"' + (on ? " checked" : "") + ">" +
      '<span class="opcion__caja"><span class="opcion__t">' + e(titulo) + '</span><span class="opcion__d">' + e(detalle) + "</span></span></label>";
  }
  function fila(a, b) { return '<div class="totales__fila"><span>' + a + "</span><span>" + b + "</span></div>"; }
  function iconoWA() {
    return '<svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.6.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.3.8 3.2.7a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z"/></svg>';
  }

  /* Guarda lo que va escribiendo la persona (así no se pierde si cierra el panel) */
  function recordarCampos(form) {
    const cli = S.cliente();
    const fd = new FormData(form);
    ["entrega", "zona", "direccion", "nombre", "notas", "pago"].forEach(function (k) {
      if (fd.has(k)) cli[k] = String(fd.get(k)).trim();
    });
    S.guardarCliente(cli);
    return cli;
  }

  /* ---------- el mensaje de WhatsApp ---------- */
  function armarMensaje(pedido) {
    const L = [];
    L.push("¡Hola! Quiero hacer este pedido en " + CFG.BRAND_NAME + " (#" + CFG.prefijoPedido + "-" + pedido.numero + "):");
    L.push("");
    pedido.items.forEach(function (it) {
      L.push("• " + it.cant + " × " + it.nombre + (it.pres && !/^(box|unidad)$/i.test(it.pres) ? " " + it.pres : "") + " — " + N.fmt(it.precio * it.cant));
      if (it.dedicatoria) L.push("   Dedicatoria: “" + it.dedicatoria + "”");
    });
    L.push("");
    L.push("Subtotal: " + N.fmt(pedido.subtotal));
    L.push(pedido.entrega.tipo === "retiro" ? "Retiro en Castelar: sin cargo"
      : "Envío (" + pedido.entrega.zona + "): " + (pedido.envio ? N.fmt(pedido.envio) : "gratis"));
    L.push("*Total: " + N.fmt(pedido.total) + "*");
    L.push("");
    L.push("Nombre: " + pedido.cliente.nombre);
    L.push("Entrega: " + (pedido.entrega.tipo === "retiro" ? "Retiro en Castelar" : "Envío a " + pedido.entrega.direccion));
    L.push("Pago: " + pedido.pago);
    if (pedido.notas) L.push("Notas: " + pedido.notas);
    /*   del formato de precio → espacio normal (en WhatsApp se ve igual y no rompe nada) */
    return L.join("\n").replace(/ /g, " ");
  }
  function linkWA(texto) {
    const numero = (CFG.whatsapp || "").replace(/\D/g, "");
    return "https://wa.me/" + numero + "?text=" + encodeURIComponent(texto);
  }

  async function enviar(form) {
    const cli = recordarCampos(form);
    const err = form.querySelector(".checkout__error");
    const faltan = [];
    if (!cli.nombre) faltan.push(["ck-nombre", "tu nombre"]);
    if (cli.entrega === "envio" || (!cli.entrega && !(S.envios().retiro || {}).activo)) {
      if (!cli.zona) faltan.push(["ck-zona", "la zona"]);
      if (!cli.direccion) faltan.push(["ck-dir", "la dirección"]);
    }
    if (faltan.length) {
      err.hidden = false;
      err.textContent = "Nos falta " + faltan.map(function (f) { return f[1]; }).join(" y ") + ".";
      const primero = document.getElementById(faltan[0][0]);
      if (primero) { primero.setAttribute("aria-invalid", "true"); primero.focus(); }
      return;
    }
    const ls = lineas();
    const env = S.envios();
    const subtotal = ls.reduce(function (a, x) { return a + x.total; }, 0);
    const tipo = cli.entrega || "retiro";
    const ce = N.costoEnvio(env, tipo === "retiro" ? "retiro" : cli.zona, subtotal);
    const zona = (env.zonas.find(function (z) { return z.id === cli.zona; }) || {}).nombre || "";
    const pedido = {
      numero: S.proximoNumero(),
      fecha: new Date().toISOString(),
      estado: "nuevo",
      cliente: { nombre: cli.nombre },
      entrega: { tipo: tipo, zona: tipo === "retiro" ? "Retiro en Castelar" : zona, direccion: tipo === "retiro" ? "" : cli.direccion },
      pago: cli.pago || "Transferencia",
      notas: cli.notas || "",
      items: ls.map(function (x) {
        return { id: x.p.id, nombre: x.p.nombre, pres: x.pres.etiqueta, cant: x.l.cant, precio: x.pr.precio, dedicatoria: x.l.dedicatoria || "" };
      }),
      subtotal: subtotal, envio: ce.costo, total: subtotal + ce.costo
    };

    /* Mercado Pago conectado: se crea la preferencia y se va al checkout */
    if (pedido.pago === "Mercado Pago" && CFG.pagos.mercadoPago.activo) {
      try {
        const r = await fetch(CFG.pagos.mercadoPago.endpoint, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(pedido)
        });
        const d = await r.json();
        if (d.init_point) { S.registrarPedido(pedido); S.guardarCarrito([]); location.href = d.init_point; return; }
      } catch (x) { /* si falla, sigue por WhatsApp */ }
    }

    const texto = armarMensaje(pedido);
    S.registrarPedido(pedido);
    S.guardarCarrito([]);
    const link = linkWA(texto);
    window.__ultimoWA = link;   // para las pruebas automáticas
    window.open(link, "_blank", "noopener");
    pintar('<div class="panel__listo"><p class="panel__listo-num">Pedido #' + e(CFG.prefijoPedido + "-" + pedido.numero) + "</p>" +
      '<p class="panel__vacio-t">Se abrió WhatsApp con tu pedido.</p>' +
      "<p>Mandá el mensaje y te respondemos para confirmar. Si no se abrió, tocá acá:</p>" +
      '<a class="btn btn--wa" href="' + e(link) + '" target="_blank" rel="noopener">' + iconoWA() + "Abrir WhatsApp</a>" +
      '<button type="button" class="btn btn--linea" data-cerrar>Seguir mirando</button></div>');
  }

  /* ---------- eventos ---------- */
  function cablear() {
    panel.addEventListener("close", function () {
      document.documentElement.classList.remove("sin-scroll");
      if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
    });
    panel.addEventListener("click", function (ev) {
      if (ev.target === panel) { cerrar(); return; }        // click en el fondo
      if (ev.target.closest("[data-cerrar]")) { cerrar(); return; }
      const b = ev.target.closest("[data-linea]");
      if (b) {
        const i = +b.closest(".linea").dataset.i;
        const c = S.carrito();
        const accion = b.dataset.linea;
        if (accion === "mas") c[i].cant++;
        if (accion === "menos") c[i].cant--;
        if (accion === "quitar" || c[i].cant < 1) c.splice(i, 1);
        S.guardarCarrito(c);
        pintar();
        const mismo = panel.querySelector('.linea[data-i="' + i + '"] [data-linea="' + accion + '"]');
        if (mismo && !mismo.disabled) mismo.focus();
        else { const x = panel.querySelector("[data-cerrar]"); if (x) x.focus(); }
      }
    });
    panel.addEventListener("change", function (ev) {
      const form = ev.target.closest(".checkout");
      if (ev.target.matches("[data-dedicatoria]")) {
        const i = +ev.target.closest(".linea").dataset.i;
        const c = S.carrito(); c[i].dedicatoria = ev.target.value.trim(); S.guardarCarrito(c);
        return;
      }
      if (form && (ev.target.name === "entrega" || ev.target.name === "zona" || ev.target.name === "pago")) {
        recordarCampos(form);
        const nombre = ev.target.name, valor = ev.target.value;
        pintar();
        const vuelta = panel.querySelector('[name="' + nombre + '"]' + (ev.target.type === "radio" ? '[value="' + valor + '"]' : ""));
        if (vuelta) vuelta.focus();
      } else if (form) recordarCampos(form);
    });
    panel.addEventListener("submit", function (ev) { ev.preventDefault(); enviar(ev.target); });

    document.addEventListener("click", function (ev) {
      if (ev.target.closest("[data-abrir-carrito]")) { ev.preventDefault(); abrir(); }
    });
    S.alCambiarCarrito(actualizarContador);
  }

  async function iniciar(cat) {
    catalogo = cat || await S.catalogo();
    panel = document.getElementById("panel-pedido");
    if (!panel) return;
    cablear();
    actualizarContador();
    if (location.hash === "#pedido") abrir();
  }

  window.Carrito = { iniciar: iniciar, abrir: abrir, avisar: avisar, armarMensaje: armarMensaje, actualizarContador: actualizarContador };
})();
