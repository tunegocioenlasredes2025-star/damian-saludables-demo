/* ============================================================
   tienda.js · home (catálogo, filtros, boxes) y ficha de producto
   ============================================================ */
(function () {
  "use strict";
  const S = window.Store, N = window.Nucleo, V = window.Vistas, CFG = S.CFG;
  const e = N.escapar;
  const POR_PAGINA = 24;
  let cat = null, ctx = null;
  const estado = { q: "", cat: "todo", tacc: false, azucar: false, orden: "destacados", limite: POR_PAGINA };

  /* ---------- helpers de tarjeta (sirven en home y ficha) ---------- */
  function repintarTarjeta(el, presId) {
    const p = N.porId(cat, el.dataset.id);
    if (!p) return;
    const tmp = document.createElement("div");
    tmp.innerHTML = el.classList.contains("hero__prod") ? heroProd(p, presId) : V.tarjeta(p, ctx, presId);
    const nuevo = tmp.firstElementChild;
    el.replaceWith(nuevo);
    return nuevo;
  }

  function elegirPeso(boton) {
    const card = boton.closest("[data-id]");
    const presId = boton.dataset.pres;
    if (card.classList.contains("ficha")) { pintarFicha(presId, true); return; }
    const nuevo = repintarTarjeta(card, presId);
    const b = nuevo && nuevo.querySelector('[data-pres="' + presId + '"].peso');
    if (b) b.focus();
  }

  /* Flechas dentro del selector de peso (patrón radiogroup) */
  function teclaPeso(ev) {
    const b = ev.target.closest(".peso[role=radio]");
    if (!b) return;
    const grupo = Array.from(b.parentElement.querySelectorAll(".peso[role=radio]"));
    const i = grupo.indexOf(b);
    let j = null;
    if (ev.key === "ArrowRight" || ev.key === "ArrowDown") j = (i + 1) % grupo.length;
    if (ev.key === "ArrowLeft" || ev.key === "ArrowUp") j = (i - 1 + grupo.length) % grupo.length;
    if (j === null) return;
    ev.preventDefault();
    elegirPeso(grupo[j]);
  }

  function agregarDesde(boton) {
    const card = boton.closest("[data-id]");
    const p = N.porId(cat, card.dataset.id);
    const pres = N.presentacion(p, card.dataset.pres);
    let cant = 1, dedic = "";
    const input = card.querySelector(".cantidad__num");
    if (input && input.value) cant = Math.max(1, Math.min(pres.stock, parseInt(input.value, 10) || 1));
    const t = card.querySelector("#dedicatoria");
    if (t) dedic = t.value.trim();
    S.agregar(p.id, pres.id, cant, dedic);
    boton.classList.add("btn--ok");
    setTimeout(function () { boton.classList.remove("btn--ok"); }, 900);
    window.Carrito.avisar("Agregaste " + (cant > 1 ? cant + " × " : "") + p.nombre + (p.tipo === "pack" ? "" : " " + pres.etiqueta));
  }

  /* ---------- HOME ---------- */
  function heroProd(p, presId) { return V.hero(p, ctx, presId); }

  function pintarHero() {
    const lugar = document.getElementById("hero-prod");
    if (!lugar) return;
    const p = cat.productos.find(function (x) { return x.destacado && x.tipo !== "pack" && x.presentaciones.length >= 3 && N.disponible(x); }) ||
      cat.productos.find(function (x) { return x.tipo !== "pack" && N.disponible(x); });
    if (!p) return;
    lugar.innerHTML = heroProd(p);
  }

  function pintarBoxes() {
    const lugar = document.getElementById("boxes-lista");
    if (!lugar) return;
    const boxes = cat.productos.filter(function (p) { return p.tipo === "pack" && p.activo !== false; });
    boxes.sort(function (a, b) { return (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0); });
    lugar.innerHTML = boxes.map(function (p) { return V.tarjetaBox(p, ctx); }).join("");
    document.getElementById("boxes").hidden = !boxes.length;
  }

  function pintarFiltros() {
    const lugar = document.getElementById("chips");
    if (!lugar) return;
    const cuenta = function (id) {
      return cat.productos.filter(function (p) { return p.activo !== false && (id === "todo" ? p.tipo !== "pack" : p.categoria === id); }).length;
    };
    let h = chip("todo", "Todo", cuenta("todo"));
    cat.categorias.forEach(function (c) { const n = cuenta(c.id); if (n) h += chip(c.id, c.nombre, n); });
    lugar.innerHTML = h;
  }
  function chip(id, nombre, n) {
    return '<button type="button" class="chip" data-cat="' + e(id) + '" aria-pressed="' + (estado.cat === id) + '">' + e(nombre) + ' <span class="chip__n">' + n + "</span></button>";
  }

  function filtrados() {
    const q = N.normalizar(estado.q).trim();
    let lista = cat.productos.filter(function (p) {
      if (p.activo === false) return false;
      if (estado.cat !== "todo" && p.categoria !== estado.cat) return false;
      if (estado.cat === "todo" && !q && p.tipo === "pack") return false;   // los boxes ya están en su banda
      if (estado.tacc && (p.etiquetas || []).indexOf("sin-tacc") < 0) return false;
      if (estado.azucar && (p.etiquetas || []).indexOf("sin-azucar") < 0) return false;
      if (q) {
        const texto = N.normalizar([p.nombre, p.origen, p.descripcion, N.nombreCategoria(cat, p.categoria),
          (p.presentaciones || []).map(function (x) { return x.etiqueta; }).join(" ")].join(" "));
        return q.split(/\s+/).every(function (w) { return texto.indexOf(w) >= 0; });
      }
      return true;
    });
    const orden = cat.productos.map(function (p) { return p.id; });
    const pd = function (p) { return N.precio(p, N.presPorDefecto(p), cat); };
    lista.sort(function (a, b) {
      const disp = (N.disponible(b) ? 1 : 0) - (N.disponible(a) ? 1 : 0);   // sin stock al final
      if (disp) return disp;
      if (estado.orden === "precio") return pd(a).precio - pd(b).precio;
      if (estado.orden === "kilo") {
        const ka = pd(a).precioKg, kb = pd(b).precioKg;
        return (ka == null ? 1e12 : ka) - (kb == null ? 1e12 : kb);
      }
      return ((b.destacado ? 1 : 0) - (a.destacado ? 1 : 0)) || (orden.indexOf(a.id) - orden.indexOf(b.id));
    });
    return lista;
  }

  function pintarGrilla() {
    const grilla = document.getElementById("grilla");
    if (!grilla) return;
    const lista = filtrados();
    const visibles = lista.slice(0, estado.limite);
    grilla.innerHTML = visibles.map(function (p) { return V.tarjeta(p, ctx); }).join("");
    const resumen = document.getElementById("resumen");
    const vacio = document.getElementById("vacio");
    resumen.textContent = lista.length === 1 ? "1 producto" : lista.length + " productos";
    vacio.hidden = lista.length > 0;
    if (!lista.length) {
      vacio.querySelector("[data-vacio-q]").textContent = estado.q ? "No encontramos “" + estado.q + "”." : "No hay productos con esos filtros.";
    }
    const mas = document.getElementById("ver-mas");
    const quedan = lista.length - visibles.length;
    mas.hidden = quedan <= 0;
    mas.textContent = "Ver " + Math.min(quedan, POR_PAGINA) + " productos más";
    document.querySelectorAll("#chips .chip").forEach(function (c) { c.setAttribute("aria-pressed", String(c.dataset.cat === estado.cat)); });
  }

  function pintarEnvios() {
    const lugar = document.getElementById("envios-tabla");
    if (!lugar) return;
    const env = S.envios();
    let h = "";
    if (env.retiro && env.retiro.activo) h += '<div class="envios__fila"><span>' + e(env.retiro.nombre) + '<small>' + e(env.retiro.detalle) + "</small></span><span>Sin cargo</span></div>";
    env.zonas.forEach(function (z) { h += '<div class="envios__fila"><span>' + e(z.nombre) + "</span><span>" + N.fmt(z.costo) + "</span></div>"; });
    if (env.gratisDesde) h += '<div class="envios__fila envios__gratis"><span>Envío gratis en compras desde</span><span>' + N.fmt(env.gratisDesde) + "</span></div>";
    lugar.innerHTML = h;
  }

  function iniciarHome() {
    const params = new URLSearchParams(location.search);
    if (params.get("cat") && cat.categorias.some(function (c) { return c.id === params.get("cat"); })) estado.cat = params.get("cat");
    if (params.get("q")) estado.q = params.get("q");
    pintarHero(); pintarBoxes(); pintarFiltros(); pintarGrilla(); pintarEnvios();

    const buscar = document.getElementById("buscar");
    if (estado.q) buscar.value = estado.q;
    let t;
    buscar.addEventListener("input", function () {
      clearTimeout(t);
      t = setTimeout(function () { estado.q = buscar.value; estado.limite = POR_PAGINA; pintarGrilla(); }, 120);
    });
    document.getElementById("form-buscar").addEventListener("submit", function (ev) {
      ev.preventDefault(); estado.q = buscar.value; pintarGrilla();
      document.getElementById("grilla").scrollIntoView({ block: "start" });
    });
    document.getElementById("chips").addEventListener("click", function (ev) {
      const c = ev.target.closest(".chip");
      if (!c) return;
      estado.cat = c.dataset.cat; estado.limite = POR_PAGINA;
      pintarGrilla();
      const sec = document.getElementById("catalogo");
      if (sec.getBoundingClientRect().top < 0) sec.scrollIntoView({ block: "start" });
    });
    document.getElementById("f-tacc").addEventListener("change", function (ev) { estado.tacc = ev.target.checked; pintarGrilla(); });
    document.getElementById("f-azucar").addEventListener("change", function (ev) { estado.azucar = ev.target.checked; pintarGrilla(); });
    document.getElementById("orden").addEventListener("change", function (ev) { estado.orden = ev.target.value; pintarGrilla(); });
    document.getElementById("ver-mas").addEventListener("click", function () { estado.limite += POR_PAGINA; pintarGrilla(); });
    document.getElementById("limpiar").addEventListener("click", function () {
      estado.q = ""; estado.cat = "todo"; estado.tacc = estado.azucar = false;
      buscar.value = ""; document.getElementById("f-tacc").checked = false; document.getElementById("f-azucar").checked = false;
      pintarGrilla(); buscar.focus();
    });
    /* los links de categoría del footer y del menú */
    document.addEventListener("click", function (ev) {
      const a = ev.target.closest("a[data-ir-cat]");
      if (!a) return;
      ev.preventDefault();
      estado.cat = a.dataset.irCat; estado.limite = POR_PAGINA; pintarGrilla();
      document.getElementById("catalogo").scrollIntoView({ block: "start" });
    });
  }

  /* ---------- FICHA ---------- */
  let fichaId = null;
  function pintarFicha(presId, enfocar) {
    const lugar = document.getElementById("ficha");
    const p = N.porId(cat, fichaId);
    if (!p || p.activo === false) {
      lugar.innerHTML = '<div class="ficha-no"><h1>Este producto ya no está en la tienda</h1><p>Puede que lo hayan dado de baja o cambiado de nombre.</p><a class="btn btn--linea" href="/#catalogo">Ver el catálogo</a></div>';
      return;
    }
    const dedic = lugar.querySelector("#dedicatoria");
    const textoDedic = dedic ? dedic.value : "";
    lugar.innerHTML = V.ficha(p, ctx, presId);
    if (textoDedic) lugar.querySelector("#dedicatoria").value = textoDedic;
    if (enfocar) { const b = lugar.querySelector('.peso[data-pres="' + presId + '"]'); if (b) b.focus(); }
    const rel = document.getElementById("relacionados");
    if (rel && !rel.dataset.listo) {
      const lista = relacionados(p);
      rel.querySelector(".grilla").innerHTML = lista.map(function (x) { return V.tarjeta(x, ctx); }).join("");
      rel.hidden = !lista.length;
      rel.dataset.listo = "1";
    }
  }
  function relacionados(p) {
    const boxes = cat.productos.filter(function (b) {
      return b.tipo === "pack" && b.id !== p.id && b.activo !== false && (b.contenido || []).some(function (c) { return c.producto === p.id; });
    });
    const misma = cat.productos.filter(function (x) { return x.id !== p.id && x.tipo !== "pack" && x.categoria === p.categoria && N.disponible(x); });
    return boxes.slice(0, 1).concat(misma).slice(0, 4);
  }

  function iniciarFicha() {
    const main = document.querySelector("main");
    fichaId = main.dataset.id || new URLSearchParams(location.search).get("p");
    const p = N.porId(cat, fichaId);
    if (p && !main.dataset.id) {
      document.title = p.nombre + " · " + CFG.BRAND_NAME;
    }
    pintarFicha();
    document.getElementById("ficha").addEventListener("click", function (ev) {
      const b = ev.target.closest("[data-accion]");
      if (!b) return;
      const input = document.querySelector(".ficha .cantidad__num");
      if (!input) return;
      const max = +input.max || 99;
      if (b.dataset.accion === "mas") input.value = Math.min(max, (+input.value || 1) + 1);
      if (b.dataset.accion === "menos") input.value = Math.max(1, (+input.value || 1) - 1);
    });
  }

  /* ---------- arranque ---------- */
  async function iniciar() {
    try { cat = await S.catalogo(); }
    catch (err) { console.error(err); return; }
    ctx = { catalogo: cat, config: Object.assign({}, CFG, { envios: S.envios() }) };
    window.Carrito.iniciar(cat);

    document.addEventListener("click", function (ev) {
      const peso = ev.target.closest(".peso[role=radio]");
      if (peso) { elegirPeso(peso); return; }
      const ag = ev.target.closest('[data-accion="agregar"]');
      if (ag && !ag.disabled) agregarDesde(ag);
    });
    document.addEventListener("keydown", teclaPeso);

    const pagina = document.querySelector("main").dataset.pagina;
    if (pagina === "home") iniciarHome();
    if (pagina === "producto") iniciarFicha();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
