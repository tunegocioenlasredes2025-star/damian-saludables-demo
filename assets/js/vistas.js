/* ============================================================
   vistas.js · markup de tarjetas, boxes, ticket y ficha
   Mismo HTML en el navegador y en el generador (las páginas de
   producto salen prearmadas para Google y el JS las actualiza).
   ============================================================ */
(function (raiz) {
  "use strict";
  const esNode = typeof module !== "undefined" && module.exports;
  const N = esNode ? require("./nucleo.js") : raiz.Nucleo;
  const I = esNode ? require("./ilustraciones.js") : raiz.Ilustraciones;
  const e = N.escapar;

  const ETIQUETAS = { "sin-tacc": "Sin TACC", "sin-azucar": "Sin azúcar agregada" };

  function url(p) { return "/producto/" + p.id; }

  /* El plato de acero: foto (cualquier calidad) o ilustración, siempre con el mismo encuadre */
  function plato(p, clase) {
    const dentro = p.foto
      ? '<img class="plato__foto" src="' + e(p.foto) + '" alt="" loading="lazy" decoding="async">'
      : I.svg(p);
    return '<div class="plato ' + (clase || "") + '">' + dentro + "</div>";
  }

  function selectorPesos(p, pres, grande) {
    const cls = "pesos" + (grande ? " pesos--grande" : "");
    if (p.presentaciones.length === 1) {
      return '<p class="' + cls + ' pesos--unica"><span class="peso">' + e(pres.etiqueta) + "</span></p>";
    }
    let s = '<div class="' + cls + '" role="radiogroup" aria-label="Presentación de ' + e(p.nombre) + '">';
    p.presentaciones.forEach(function (x) {
      const on = x.id === pres.id;
      s += '<button type="button" class="peso' + (x.stock > 0 ? "" : " peso--agotado") + '" role="radio" aria-checked="' + on +
        '" tabindex="' + (on ? "0" : "-1") + '" data-pres="' + e(x.id) + '">' + e(x.etiqueta) +
        (x.stock > 0 ? "" : '<span class="sr"> (sin stock)</span>') + "</button>";
    });
    return s + "</div>";
  }

  function lineaStock(pres) {
    if (!(pres.stock > 0)) return '<p class="stock stock--no">Sin stock en ' + e(pres.etiqueta) + "</p>";
    if (pres.stock <= 5) return '<p class="stock stock--poco">Quedan ' + pres.stock + "</p>";
    return '<p class="stock">En stock</p>';
  }

  function bloquePrecio(pr, pres) {
    return '<div class="precio">' +
      '<span class="precio__importe">' + N.fmt(pr.precio) + "</span>" +
      (pr.antes ? '<s class="precio__antes"><span class="sr">Antes </span>' + N.fmt(pr.antes) + "</s>" : "") +
      (pr.precioKg ? '<span class="precio__kg"><abbr title="precio por kilo">$/kg</abbr> ' + N.num(pr.precioKg) + "</span>"
        : '<span class="precio__kg">por ' + (pres.etiqueta === "Box" ? "box" : "unidad") + "</span>") +
      "</div>";
  }

  /* ---------- tarjeta de producto suelto ---------- */
  function tarjeta(p, ctx, presId) {
    if (p.tipo === "pack") return tarjetaBox(p, ctx);
    const cat = ctx.catalogo;
    const pres = presId ? N.presentacion(p, presId) : N.presPorDefecto(p);
    const pr = N.precio(p, pres, cat);
    const agotado = !N.disponible(p);
    const hayPres = pres.stock > 0;
    return '<article class="prod' + (agotado ? " prod--agotado" : "") + '" data-id="' + e(p.id) + '" data-cat="' + e(p.categoria) + '" data-pres="' + e(pres.id) + '">' +
      '<a class="prod__foto" href="' + url(p) + '" tabindex="-1" aria-hidden="true">' + plato(p) +
      (pr.promo ? '<span class="sello sello--promo">−' + pr.promo.valor + " %</span>" : "") +
      (agotado ? '<span class="sello sello--agotado">Sin stock</span>' : "") + "</a>" +
      '<div class="prod__cuerpo">' +
      '<p class="prod__origen">' + e(p.origen || N.nombreCategoria(cat, p.categoria)) + "</p>" +
      '<h3 class="prod__nombre"><a href="' + url(p) + '">' + e(p.nombre) + "</a></h3>" +
      selectorPesos(p, pres) + bloquePrecio(pr, pres) +
      '<button type="button" class="btn btn--agregar" data-accion="agregar"' + (hayPres ? "" : " disabled") + ">" +
      (hayPres ? "Agregar" : "Sin stock") + '<span class="sr"> ' + e(p.nombre) + " " + e(pres.etiqueta) + "</span></button>" +
      "</div></article>";
  }

  /* ---------- tarjeta de box de regalo: misma estructura, otro tratamiento ---------- */
  function tarjetaBox(p, ctx) {
    const cat = ctx.catalogo;
    const pres = p.presentaciones[0];
    const pr = N.precio(p, pres, cat);
    const cb = N.contenidoBox(p, cat);
    const hay = pres.stock > 0 && p.activo !== false;
    let lista = "";
    cb.items.forEach(function (x) {
      lista += "<li><span>" + e(x.nombre) + "</span>" + (x.detalle ? "<span>" + e(x.detalle) + "</span>" : "") + "</li>";
    });
    return '<article class="prod prod--box' + (hay ? "" : " prod--agotado") + '" data-id="' + e(p.id) + '" data-cat="' + e(p.categoria) + '" data-pres="' + e(pres.id) + '">' +
      '<a class="prod__foto" href="' + url(p) + '" tabindex="-1" aria-hidden="true">' + plato(p, "plato--box") +
      (cb.ahorro > 0 ? '<span class="sello sello--ahorro">Ahorrás ' + N.fmt(cb.ahorro) + "</span>" : "") + "</a>" +
      '<div class="prod__cuerpo">' +
      '<p class="prod__origen prod__origen--box">Para regalar</p>' +
      '<h3 class="prod__nombre"><a href="' + url(p) + '">' + e(p.nombre) + "</a></h3>" +
      '<p class="trae__titulo">Qué trae</p><ul class="trae">' + lista + "</ul>" +
      '<div class="precio precio--box"><span class="precio__importe">' + N.fmt(pr.precio) + "</span>" +
      (cb.ahorro > 0 ? '<span class="precio__kg">Suelto: <s>' + N.fmt(cb.suelto) + "</s></span>" : "") + "</div>" +
      (p.dedicatoria ? '<p class="box__extra">Con tarjeta y tu dedicatoria</p>' : "") +
      '<button type="button" class="btn btn--agregar btn--miel" data-accion="agregar"' + (hay ? "" : " disabled") + ">" +
      (hay ? "Agregar box" : "Sin stock") + '<span class="sr"> ' + e(p.nombre) + "</span></button>" +
      "</div></article>";
  }

  /* ---------- el ticket de la balanza ---------- */
  function ticket(p, pres, pr, opciones) {
    const o = opciones || {};
    let filas = "";
    if (o.box) {
      filas += fila("Trae", o.box.items.length + " productos");
      if (o.box.ahorro > 0) { filas += fila("Suelto", N.fmt(o.box.suelto)); filas += fila("Ahorrás", "−" + N.fmt(o.box.ahorro)); }
    } else if (pres.gramos) {
      filas += fila("Peso neto", N.kgTicket(pres.gramos));
      filas += fila("Precio x kg", N.fmt(pr.precioKg));
    } else {
      filas += fila("Presentación", pres.etiqueta);
      filas += fila("Cantidad", "1");
    }
    if (pr.antes) filas += fila("Promo", "−" + pr.promo.valor + " %");
    return '<div class="ticket' + (o.clase ? " " + o.clase : "") + '">' +
      (o.titulo ? '<p class="ticket__prod">' + e(o.titulo) + "</p>" : "") + filas +
      '<div class="ticket__fila ticket__total"><span>Importe</span><span>' + N.fmt(pr.precio) + "</span></div>" +
      '<div class="ticket__barras" aria-hidden="true"></div></div>';
  }
  function fila(a, b) { return '<div class="ticket__fila"><span>' + a + "</span><span>" + b + "</span></div>"; }

  /* "En 1 kg el kilo te sale 21 % menos que en 250 g": nadie en el rubro lo dice */
  function ahorroPorTamano(p, cat) {
    const conPeso = p.presentaciones.filter(function (x) { return x.gramos; });
    if (conPeso.length < 2) return "";
    const chica = conPeso[0], grande = conPeso[conPeso.length - 1];
    const kc = N.precio(p, chica, cat).precioKg, kg = N.precio(p, grande, cat).precioKg;
    const pct = Math.round((1 - kg / kc) * 100);
    if (pct < 3) return "";
    return '<p class="ahorro-tam">En ' + e(grande.etiqueta) + " el kilo te sale <strong>" + pct + " % menos</strong> que en " + e(chica.etiqueta) + ".</p>";
  }

  /* ---------- ficha de producto (página propia) ---------- */
  function ficha(p, ctx, presId) {
    const cat = ctx.catalogo, cfg = ctx.config;
    const esBox = p.tipo === "pack";
    const pres = presId ? N.presentacion(p, presId) : N.presPorDefecto(p);
    const pr = N.precio(p, pres, cat);
    const hay = pres.stock > 0 && p.activo !== false;
    const catNombre = N.nombreCategoria(cat, p.categoria);

    let etiquetas = "";
    (p.etiquetas || []).forEach(function (t) { if (ETIQUETAS[t]) etiquetas += '<li>' + ETIQUETAS[t] + "</li>"; });

    let box = "";
    if (esBox) {
      const cb = N.contenidoBox(p, cat);
      box = '<div class="ficha__trae"><h2>Qué trae</h2><ul class="trae trae--ficha">';
      cb.items.forEach(function (x) {
        box += "<li>" + (x.id ? '<a href="/producto/' + e(x.id) + '">' + e(x.nombre) + "</a>" : e(x.nombre)) +
          (x.detalle ? "<span>" + e(x.detalle) + "</span>" : "") + "</li>";
      });
      box += "</ul>" + (cb.ahorro > 0
        ? '<p class="ficha__ahorro">Comprado suelto sale <s>' + N.fmt(cb.suelto) + "</s>. En el box ahorrás <strong>" + N.fmt(cb.ahorro) + "</strong>.</p>"
        : "") + "</div>";
      if (p.dedicatoria) {
        box += '<div class="campo ficha__dedicatoria"><label for="dedicatoria">Dedicatoria para la tarjeta <span class="opcional">(opcional)</span></label>' +
          '<textarea id="dedicatoria" rows="2" maxlength="160" placeholder="Ej.: ¡Feliz cumple, Ana! Te quiero mucho."></textarea>' +
          '<p class="ayuda">La escribimos a mano. Si es para regalar, no incluimos el precio.</p></div>';
      }
    }

    const env = cfg.envios;
    const minZona = Math.min.apply(null, env.zonas.map(function (z) { return z.costo; }));
    const entrega = '<ul class="ficha__entrega">' +
      (env.retiro && env.retiro.activo ? "<li><strong>" + e(env.retiro.nombre) + "</strong> sin cargo</li>" : "") +
      "<li><strong>Envío en Zona Oeste</strong> desde " + N.fmt(minZona) + "</li>" +
      (env.gratisDesde ? "<li><strong>Envío gratis</strong> desde " + N.fmt(env.gratisDesde) + "</li>" : "") + "</ul>";

    return '<article class="ficha' + (esBox ? " ficha--box" : "") + '" data-id="' + e(p.id) + '" data-cat="' + e(p.categoria) + '" data-pres="' + e(pres.id) + '">' +
      '<nav class="migas" aria-label="Estás en"><a href="/">Inicio</a><span aria-hidden="true">/</span>' +
      '<a href="/?cat=' + e(p.categoria) + '#catalogo">' + e(catNombre) + '</a></nav>' +
      '<div class="ficha__grilla">' +
      '<div class="ficha__media">' + plato(p, "plato--grande" + (esBox ? " plato--box" : "")) +
      (pr.promo ? '<span class="sello sello--promo">−' + pr.promo.valor + " %</span>" : "") + "</div>" +
      '<div class="ficha__info">' +
      '<p class="prod__origen' + (esBox ? " prod__origen--box" : "") + '">' + (esBox ? "Para regalar · " : "Origen · ") + e(p.origen || catNombre) + "</p>" +
      "<h1>" + e(p.nombre) + "</h1>" +
      (etiquetas ? '<ul class="etiquetas">' + etiquetas + "</ul>" : "") +
      (esBox ? "" : selectorPesos(p, pres, true) + ahorroPorTamano(p, cat)) +
      ticket(p, pres, pr, { clase: "ticket--ficha", box: esBox ? N.contenidoBox(p, cat) : null }) +
      lineaStock(pres) +
      box +
      '<div class="comprar">' +
      '<div class="cantidad" role="group" aria-label="Cantidad">' +
      '<button type="button" class="cantidad__btn" data-accion="menos" aria-label="Uno menos">−</button>' +
      '<input class="cantidad__num" type="number" inputmode="numeric" min="1" max="' + Math.max(1, pres.stock) + '" value="1" aria-label="Cantidad">' +
      '<button type="button" class="cantidad__btn" data-accion="mas" aria-label="Uno más">+</button></div>' +
      '<button type="button" class="btn btn--agregar btn--grande' + (esBox ? " btn--miel" : "") + '" data-accion="agregar"' + (hay ? "" : " disabled") + ">" +
      (hay ? "Agregar al pedido" : "Sin stock") + "</button></div>" +
      '<div class="ficha__texto"><h2>Cómo es</h2><p>' + e(p.descripcion) + "</p>" +
      (p.uso ? "<h2>Cómo se usa</h2><p>" + e(p.uso) + "</p>" : "") + "</div>" +
      entrega +
      "</div></div></article>";
  }

  /* ---------- el producto del hero: plato + ticket que cambia con el peso ---------- */
  function hero(p, ctx, presId) {
    const pres = presId ? N.presentacion(p, presId) : N.presPorDefecto(p);
    const pr = N.precio(p, pres, ctx.catalogo);
    const selector = p.presentaciones.length > 1
      ? '<div class="pesos pesos--hero" role="radiogroup" aria-label="Probá otra presentación">' +
        p.presentaciones.map(function (x) {
          const on = x.id === pres.id;
          return '<button type="button" class="peso" role="radio" aria-checked="' + on + '" tabindex="' + (on ? 0 : -1) + '" data-pres="' + e(x.id) + '">' + e(x.etiqueta) + "</button>";
        }).join("") + "</div>" : "";
    return '<div class="hero__prod" data-id="' + e(p.id) + '" data-cat="' + e(p.categoria) + '" data-pres="' + e(pres.id) + '">' +
      '<a class="hero__plato" href="' + url(p) + '" tabindex="-1" aria-hidden="true">' + plato(p) + "</a>" +
      '<div class="hero__ticket">' + ticket(p, pres, pr, { titulo: p.nombre }) + "</div>" +
      '<div class="hero__acciones">' + selector +
      '<button type="button" class="btn btn--agregar" data-accion="agregar"' + (pres.stock > 0 ? "" : " disabled") + ">Agregar " + e(pres.etiqueta) + "</button></div></div>";
  }

  const API = { tarjeta: tarjeta, tarjetaBox: tarjetaBox, ticket: ticket, ficha: ficha, plato: plato, url: url, hero: hero, ETIQUETAS: ETIQUETAS };
  if (esNode) module.exports = API;
  else raiz.Vistas = API;
})(typeof window !== "undefined" ? window : globalThis);
