/* ============================================================
   admin.js · panel de la tienda (/admin, PIN en config.js)
   Productos (con foto), sin stock, aumentos por %, promos y boxes,
   pedidos y envíos.
   DEMO: guarda en localStorage (este navegador). La versión final
   guarda en base de datos; ver README.
   ============================================================ */
(function () {
  "use strict";
  const S = window.Store, N = window.Nucleo, V = window.Vistas, I = window.Ilustraciones, CFG = S.CFG;
  const e = N.escapar;
  const app = document.getElementById("app");
  let cat = null, envios = null;
  const RELLENOS = {
    almendra: "Almendras", nuez: "Nueces", caju: "Cajú", pistacho: "Pistachos", mani: "Maní", mix: "Mix con pasas",
    tropical: "Mix tropical", mixnatural: "Mix natural", granola: "Granola", chia: "Chía", lino: "Lino", girasol: "Girasol",
    zapallo: "Zapallo", mixsemillas: "Mix de semillas", mascabo: "Azúcar / granulado", yerba: "Yerba", yerbaoscura: "Yerba oscura",
    miel: "Miel", mielnuez: "Miel con nueces", mielcremosa: "Miel cremosa", mate: "Mate", bombilla: "Bombilla",
    "box-regalo": "Box con bolsas", "box-matero": "Box matero", "box-desayuno": "Box desayuno"
  };
  const ENVASES = { bolsa: "Bolsa", frasco: "Frasco", paquete: "Paquete (yerba)", mate: "Mate", bombilla: "Bombilla", caja: "Caja de regalo" };

  /* ---------- PIN ---------- */
  function autenticado() { try { return sessionStorage.getItem("tienda_admin") === "1"; } catch (x) { return false; } }
  function pantallaPin(error) {
    app.innerHTML = '<main id="adm-main" class="pin">' +
      '<form class="pin__caja" autocomplete="off">' +
      '<p class="pin__marca">' + e(CFG.BRAND_NAME) + "</p><h1>Panel de la tienda</h1>" +
      '<label for="pin">PIN</label><input id="pin" name="pin" type="password" inputmode="numeric" maxlength="8" autocomplete="off" required' + (error ? ' aria-invalid="true" aria-describedby="pin-err"' : "") + ">" +
      (error ? '<p id="pin-err" class="pin__err" role="alert">PIN incorrecto.</p>' : "") +
      '<button class="btn btn--grande" type="submit">Entrar</button>' +
      (CFG.esDemo ? '<p class="pin__demo">Demo: el PIN es <b>' + e(CFG.adminPin) + "</b></p>" : "") +
      '<a class="pin__volver" href="/">← Volver a la tienda</a></form></main>';
    const f = app.querySelector("form");
    f.pin.focus();
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (f.pin.value === CFG.adminPin) { try { sessionStorage.setItem("tienda_admin", "1"); } catch (x) { /* nada */ } arrancar(); }
      else pantallaPin(true);
    });
  }

  /* ---------- guardar + aviso ---------- */
  function guardar(texto) {
    const ok = S.guardarCatalogo(cat);
    aviso(ok ? (texto || "Guardado") : "No se pudo guardar: la memoria del navegador está llena (probá con una foto más chica)", !ok);
    return ok;
  }
  let tAviso;
  function aviso(texto, error) {
    let t = document.querySelector(".adm-aviso");
    if (!t) { t = document.createElement("div"); t.className = "adm-aviso"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = texto;
    t.classList.toggle("adm-aviso--error", !!error);
    t.classList.add("adm-aviso--on");
    clearTimeout(tAviso);
    tAviso = setTimeout(function () { t.classList.remove("adm-aviso--on"); }, 2800);
  }

  /* ---------- armazón ---------- */
  const SECCIONES = [["productos", "Productos"], ["aumentos", "Aumentos"], ["promos", "Promos y boxes"], ["pedidos", "Pedidos"], ["envios", "Envíos"]];
  function armazon(activa, contenido) {
    const nuevos = S.pedidos().filter(function (p) { return p.estado === "nuevo"; }).length;
    app.innerHTML = '<header class="adm-cab"><div class="adm-cab__in">' +
      '<p class="adm-cab__marca">' + e(CFG.BRAND_NAME) + ' <span>Panel</span></p>' +
      '<a class="adm-cab__link" href="/" target="_blank" rel="noopener">Ver tienda ↗</a>' +
      '<button type="button" class="adm-cab__link" data-salir>Salir</button></div>' +
      '<nav class="adm-tabs" aria-label="Secciones del panel">' +
      SECCIONES.map(function (s) {
        return '<a href="#' + s[0] + '"' + (s[0] === activa ? ' aria-current="page"' : "") + ">" + s[1] +
          (s[0] === "pedidos" && nuevos ? ' <span class="adm-tabs__n">' + nuevos + "</span>" : "") + "</a>";
      }).join("") + "</nav></header>" +
      (CFG.esDemo ? '<p class="adm-demo">Demo: los cambios se guardan en este navegador y los ves en la tienda desde este mismo navegador. En la versión final se guardan en la base de datos y los ve todo el mundo al instante.</p>' : "") +
      '<main id="adm-main" class="adm-main">' + contenido + "</main>" +
      '<footer class="adm-pie"><button type="button" class="btn btn--linea" data-reiniciar>Volver a la demo original</button></footer>';
  }

  /* ---------- PRODUCTOS ---------- */
  const filtro = { q: "", cat: "" };
  function resumenPres(p) {
    return p.presentaciones.map(function (x) { return e(x.etiqueta) + " " + N.fmt(x.precio); }).join(" · ");
  }
  function vistaProductos() {
    const q = N.normalizar(filtro.q);
    const lista = cat.productos.filter(function (p) {
      return (!filtro.cat || p.categoria === filtro.cat) && (!q || N.normalizar(p.nombre).indexOf(q) >= 0);
    });
    let h = '<div class="adm-barra"><h1>Productos <span class="adm-cuenta">' + cat.productos.length + "</span></h1>" +
      '<div class="adm-barra__acc"><a class="btn" href="#nuevo">+ Producto</a><a class="btn btn--miel" href="#nuevo-box">+ Box</a></div></div>' +
      '<div class="adm-filtros"><label class="sr" for="f-q">Buscar</label><input id="f-q" type="search" placeholder="Buscar producto" value="' + e(filtro.q) + '">' +
      '<label class="sr" for="f-cat">Categoría</label><select id="f-cat"><option value="">Todas las categorías</option>' +
      cat.categorias.map(function (c) { return '<option value="' + c.id + '"' + (filtro.cat === c.id ? " selected" : "") + ">" + e(c.nombre) + "</option>"; }).join("") +
      "</select></div><ul class=\"adm-lista\">";
    lista.forEach(function (p) {
      const hay = N.stockTotal(p) > 0;
      h += '<li class="adm-prod' + (p.activo === false ? " adm-prod--oculto" : "") + '" data-id="' + e(p.id) + '">' +
        '<a class="adm-prod__foto" href="#editar/' + e(p.id) + '" tabindex="-1" aria-hidden="true">' + V.plato(p) + "</a>" +
        '<div class="adm-prod__info"><a class="adm-prod__nombre" href="#editar/' + e(p.id) + '">' + e(p.nombre) + "</a>" +
        '<p class="adm-prod__meta">' + e(N.nombreCategoria(cat, p.categoria)) + (p.tipo === "pack" ? " · Box" : "") + (p.activo === false ? " · Oculto" : "") + (p.foto ? " · Con foto" : "") + "</p>" +
        '<p class="adm-prod__precios">' + resumenPres(p) + "</p></div>" +
        '<label class="interruptor"><input type="checkbox" data-stock' + (hay ? " checked" : "") + '><span class="interruptor__t">' + (hay ? "Con stock" : "Sin stock") + "</span></label>" +
        "</li>";
    });
    h += "</ul>" + (lista.length ? "" : '<p class="adm-vacio">No hay productos con ese filtro.</p>');
    armazon("productos", h);
    const fq = document.getElementById("f-q");
    fq.addEventListener("input", function () { filtro.q = fq.value; const pos = fq.selectionStart; vistaProductos(); const n = document.getElementById("f-q"); n.focus(); n.setSelectionRange(pos, pos); });
    document.getElementById("f-cat").addEventListener("change", function (ev) { filtro.cat = ev.target.value; vistaProductos(); });
    app.querySelector(".adm-lista").addEventListener("change", function (ev) {
      if (!ev.target.matches("[data-stock]")) return;
      const p = N.porId(cat, ev.target.closest("[data-id]").dataset.id);
      if (ev.target.checked) {
        p.presentaciones.forEach(function (x) { x.stock = (p._stockPrevio && p._stockPrevio[x.id]) || 10; });
        delete p._stockPrevio;
      } else {
        p._stockPrevio = {};
        p.presentaciones.forEach(function (x) { p._stockPrevio[x.id] = x.stock; x.stock = 0; });
      }
      guardar(p.nombre + (ev.target.checked ? ": con stock" : ": marcado sin stock"));
      ev.target.nextElementSibling.textContent = ev.target.checked ? "Con stock" : "Sin stock";
    });
  }

  /* ---------- EDITOR ---------- */
  function vacio(esBox) {
    return {
      id: "", nombre: "", categoria: esBox ? "boxes" : "frutos-secos", tipo: esBox ? "pack" : "suelto",
      envase: esBox ? "caja" : "bolsa", relleno: esBox ? "box-regalo" : "almendra", origen: esBox ? "Armado a mano en Castelar" : "",
      descripcion: "", uso: "", etiquetas: [], destacado: false, foto: null, activo: true,
      contenido: esBox ? [] : undefined, dedicatoria: esBox,
      presentaciones: esBox ? [{ id: "box", etiqueta: "Box", gramos: null, precio: 0, stock: 5 }]
        : [{ id: "250g", etiqueta: "250 g", gramos: 250, precio: 0, stock: 10 }, { id: "500g", etiqueta: "500 g", gramos: 500, precio: 0, stock: 10 }]
    };
  }

  function vistaEditor(id, esBox) {
    const original = id ? N.porId(cat, id) : null;
    if (id && !original) { location.hash = "#productos"; return; }
    const p = original ? JSON.parse(JSON.stringify(original)) : vacio(esBox);
    const box = p.tipo === "pack";

    function presFilas() {
      return p.presentaciones.map(function (x, i) {
        const kg = x.gramos && x.precio ? N.fmt(x.precio * 1000 / x.gramos) : "—";
        return '<tr data-i="' + i + '">' +
          '<td><label class="sr" for="pe' + i + '">Presentación</label><input id="pe' + i + '" data-campo="etiqueta" value="' + e(x.etiqueta) + '" placeholder="500 g"></td>' +
          '<td><label class="sr" for="pg' + i + '">Gramos</label><input id="pg' + i + '" data-campo="gramos" type="number" inputmode="numeric" min="0" value="' + (x.gramos || "") + '" placeholder="—"></td>' +
          '<td><label class="sr" for="pp' + i + '">Precio</label><input id="pp' + i + '" data-campo="precio" type="number" inputmode="numeric" min="0" step="10" value="' + (x.precio || "") + '"></td>' +
          '<td><label class="sr" for="ps' + i + '">Stock</label><input id="ps' + i + '" data-campo="stock" type="number" inputmode="numeric" min="0" value="' + (x.stock || 0) + '"></td>' +
          '<td class="adm-kg" data-kg>' + kg + "</td>" +
          '<td>' + (p.presentaciones.length > 1 ? '<button type="button" class="adm-x" data-quitar-pres aria-label="Quitar presentación ' + e(x.etiqueta) + '">×</button>' : "") + "</td></tr>";
      }).join("");
    }
    function contenidoFilas() {
      const opciones = cat.productos.filter(function (q) { return q.tipo !== "pack"; });
      return (p.contenido || []).map(function (c, i) {
        const q = N.porId(cat, c.producto) || opciones[0];
        return '<div class="adm-cont" data-i="' + i + '">' +
          '<label class="sr" for="cp' + i + '">Producto</label><select id="cp' + i + '" data-cont="producto">' +
          opciones.map(function (o) { return '<option value="' + o.id + '"' + (o.id === q.id ? " selected" : "") + ">" + e(o.nombre) + "</option>"; }).join("") + "</select>" +
          '<label class="sr" for="cr' + i + '">Presentación</label><select id="cr' + i + '" data-cont="presentacion">' +
          q.presentaciones.map(function (x) { return '<option value="' + x.id + '"' + (x.id === c.presentacion ? " selected" : "") + ">" + e(x.etiqueta) + "</option>"; }).join("") + "</select>" +
          '<label class="sr" for="cc' + i + '">Cantidad</label><input id="cc' + i + '" data-cont="cantidad" type="number" min="1" value="' + (c.cantidad || 1) + '">' +
          '<button type="button" class="adm-x" data-quitar-cont aria-label="Quitar del box">×</button></div>';
      }).join("");
    }
    function resumenBox() {
      if (!box) return "";
      const tmp = { promociones: [], productos: cat.productos, categorias: cat.categorias };
      const cb = N.contenidoBox(p, tmp);
      const precio = p.presentaciones[0].precio || 0;
      const ahorro = cb.suelto - precio;
      return "Suelto sale <b>" + N.fmt(cb.suelto) + "</b>" + (precio ? " · El box a " + N.fmt(precio) + (ahorro > 0 ? ' · <b class="adm-ok">ahorro de ' + N.fmt(ahorro) + " (" + Math.round(ahorro / cb.suelto * 100) + " %)</b>" : ' · <b class="adm-mal">el box sale más caro que suelto</b>') : "");
    }

    const html = '<div class="adm-barra"><h1>' + (original ? "Editar" : box ? "Nuevo box" : "Nuevo producto") + "</h1>" +
      '<a class="btn btn--linea" href="#productos">Cancelar</a></div>' +
      '<form class="adm-form" novalidate>' +
      '<div class="adm-form__media"><div class="adm-preview" data-preview>' + V.plato(p, box ? "plato--box" : "") + "</div>" +
      '<label class="btn btn--linea adm-subir"><input type="file" accept="image/*" data-foto class="sr">Subir foto</label>' +
      (p.foto ? '<button type="button" class="btn btn--linea" data-sin-foto>Quitar foto</button>' : "") +
      '<p class="ayuda">Sirve cualquier foto, incluso la del proveedor con fondo blanco: la tienda la recorta y la pone sobre el mismo fondo que el resto.</p>' +
      '<fieldset class="adm-dibujo"' + (p.foto ? " hidden" : "") + '><legend>Dibujo (si no hay foto)</legend>' +
      '<label>Envase<select data-campo-p="envase">' + Object.keys(ENVASES).map(function (k) { return '<option value="' + k + '"' + (p.envase === k ? " selected" : "") + ">" + ENVASES[k] + "</option>"; }).join("") + "</select></label>" +
      '<label>Contenido<select data-campo-p="relleno">' + Object.keys(RELLENOS).map(function (k) { return '<option value="' + k + '"' + (p.relleno === k ? " selected" : "") + ">" + RELLENOS[k] + "</option>"; }).join("") + "</select></label>" +
      "</fieldset></div>" +
      '<div class="adm-form__datos">' +
      campo("Nombre", '<input id="e-nombre" data-campo-p="nombre" required value="' + e(p.nombre) + '" placeholder="Ej.: Almendras non pareil">', "e-nombre") +
      '<div class="adm-2">' +
      campo("Categoría", '<select id="e-cat" data-campo-p="categoria">' + cat.categorias.map(function (c) { return '<option value="' + c.id + '"' + (p.categoria === c.id ? " selected" : "") + ">" + e(c.nombre) + "</option>"; }).join("") + "</select>", "e-cat") +
      campo("Origen", '<input id="e-origen" data-campo-p="origen" value="' + e(p.origen) + '" placeholder="Ej.: Mendoza">', "e-origen") + "</div>" +
      campo("Descripción", '<textarea id="e-desc" data-campo-p="descripcion" rows="3" placeholder="Sabor, textura, presentación. Sin propiedades de salud.">' + e(p.descripcion) + "</textarea>", "e-desc") +
      campo("Cómo se usa", '<textarea id="e-uso" data-campo-p="uso" rows="2" placeholder="Para picar, en ensaladas…">' + e(p.uso) + "</textarea>", "e-uso") +
      (box
        ? '<fieldset class="adm-bloque"><legend>Qué trae el box</legend><div data-contenido>' + contenidoFilas() + "</div>" +
          '<button type="button" class="btn btn--linea" data-agregar-cont>+ Agregar producto al box</button><p class="adm-resumen-box" data-resumen-box>' + resumenBox() + "</p>" +
          '<label class="check"><input type="checkbox" data-campo-p="dedicatoria"' + (p.dedicatoria ? " checked" : "") + "> Ofrecer tarjeta con dedicatoria</label></fieldset>"
        : "") +
      '<fieldset class="adm-bloque"><legend>' + (box ? "Precio y stock" : "Presentaciones, precio y stock") + "</legend>" +
      '<div class="adm-tabla-wrap"><table class="adm-tabla"><thead><tr><th>Presentación</th><th>Gramos</th><th>Precio $</th><th>Stock</th><th>$/kg</th><th></th></tr></thead><tbody data-pres>' + presFilas() + "</tbody></table></div>" +
      (box ? "" : '<button type="button" class="btn btn--linea" data-agregar-pres>+ Agregar presentación</button>') +
      '<p class="ayuda">El precio por kilo lo calcula la tienda. Stock en 0 = sin stock.</p></fieldset>' +
      '<fieldset class="adm-bloque adm-checks"><legend>Opciones</legend>' +
      '<label class="check"><input type="checkbox" data-etiqueta="sin-tacc"' + (p.etiquetas.indexOf("sin-tacc") >= 0 ? " checked" : "") + "> Sin TACC <span class=\"opcional\">(solo con certificado)</span></label>" +
      '<label class="check"><input type="checkbox" data-etiqueta="sin-azucar"' + (p.etiquetas.indexOf("sin-azucar") >= 0 ? " checked" : "") + "> Sin azúcar agregada</label>" +
      '<label class="check"><input type="checkbox" data-campo-p="destacado"' + (p.destacado ? " checked" : "") + "> Destacado (aparece primero)</label>" +
      '<label class="check"><input type="checkbox" data-campo-p="activo"' + (p.activo !== false ? " checked" : "") + "> Visible en la tienda</label></fieldset>" +
      '<p class="adm-error" role="alert" hidden></p>' +
      '<div class="adm-acciones"><button type="submit" class="btn btn--grande">Guardar</button>' +
      (original ? '<button type="button" class="btn btn--linea adm-borrar" data-borrar>Eliminar</button>' : "") + "</div>" +
      "</div></form>";
    armazon("productos", html);

    const form = app.querySelector(".adm-form");
    const preview = form.querySelector("[data-preview]");
    function refrescarPreview() { preview.innerHTML = V.plato(p, box ? "plato--box" : ""); }
    function refrescarBox() { const r = form.querySelector("[data-resumen-box]"); if (r) r.innerHTML = resumenBox(); }

    form.addEventListener("input", function (ev) {
      const t = ev.target;
      if (t.dataset.campoP && t.type !== "checkbox") { p[t.dataset.campoP] = t.value; if (t.tagName === "SELECT") refrescarPreview(); }
      if (t.dataset.campo) {
        const fila = t.closest("tr"), x = p.presentaciones[+fila.dataset.i];
        const c = t.dataset.campo;
        x[c] = c === "etiqueta" ? t.value : (t.value === "" ? (c === "gramos" ? null : 0) : +t.value);
        fila.querySelector("[data-kg]").textContent = x.gramos && x.precio ? N.fmt(x.precio * 1000 / x.gramos) : "—";
        refrescarBox();
      }
      if (t.dataset.cont) {
        const fila = t.closest(".adm-cont"), c = p.contenido[+fila.dataset.i];
        if (t.dataset.cont === "cantidad") c.cantidad = Math.max(1, +t.value || 1);
        else c[t.dataset.cont] = t.value;
        if (t.dataset.cont === "producto") {
          c.presentacion = N.porId(cat, t.value).presentaciones[0].id;
          form.querySelector("[data-contenido]").innerHTML = contenidoFilas();
        }
        refrescarBox();
      }
    });
    form.addEventListener("change", function (ev) {
      const t = ev.target;
      if (t.type === "checkbox" && t.dataset.campoP) p[t.dataset.campoP] = t.checked;
      if (t.dataset.etiqueta) {
        p.etiquetas = p.etiquetas.filter(function (x) { return x !== t.dataset.etiqueta; });
        if (t.checked) p.etiquetas.push(t.dataset.etiqueta);
      }
      if (t.dataset.campoP === "envase" || t.dataset.campoP === "relleno") refrescarPreview();
      if (t.matches("[data-foto]") && t.files[0]) {
        leerFoto(t.files[0]).then(function (url) {
          p.foto = url; refrescarPreview();
          form.querySelector(".adm-dibujo").hidden = true;
          if (!form.querySelector("[data-sin-foto]")) {
            const b = document.createElement("button");
            b.type = "button"; b.className = "btn btn--linea"; b.dataset.sinFoto = ""; b.textContent = "Quitar foto";
            form.querySelector(".adm-subir").after(b);
          }
        }).catch(function () { aviso("No se pudo leer esa imagen", true); });
      }
    });
    form.addEventListener("click", function (ev) {
      const t = ev.target;
      if (t.matches("[data-sin-foto]")) { p.foto = null; refrescarPreview(); t.remove(); form.querySelector(".adm-dibujo").hidden = false; }
      if (t.matches("[data-agregar-pres]")) {
        const ult = p.presentaciones[p.presentaciones.length - 1];
        const g = ult && ult.gramos ? Math.min(ult.gramos * 2, 1000) : null;
        p.presentaciones.push({ id: "", etiqueta: g ? (g >= 1000 ? "1 kg" : g + " g") : "", gramos: g, precio: 0, stock: 10 });
        form.querySelector("[data-pres]").innerHTML = presFilas();
        form.querySelector('[data-pres] tr:last-child input[data-campo="precio"]').focus();
      }
      if (t.matches("[data-quitar-pres]")) { p.presentaciones.splice(+t.closest("tr").dataset.i, 1); form.querySelector("[data-pres]").innerHTML = presFilas(); }
      if (t.matches("[data-agregar-cont]")) {
        const q = cat.productos.find(function (x) { return x.tipo !== "pack"; });
        p.contenido.push({ producto: q.id, presentacion: q.presentaciones[0].id });
        form.querySelector("[data-contenido]").innerHTML = contenidoFilas(); refrescarBox();
      }
      if (t.matches("[data-quitar-cont]")) { p.contenido.splice(+t.closest(".adm-cont").dataset.i, 1); form.querySelector("[data-contenido]").innerHTML = contenidoFilas(); refrescarBox(); }
      if (t.matches("[data-borrar]") && confirm("¿Eliminar " + p.nombre + " de la tienda?")) {
        cat.productos = cat.productos.filter(function (x) { return x.id !== original.id; });
        guardar("Eliminado: " + p.nombre); location.hash = "#productos";
      }
    });
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      const err = form.querySelector(".adm-error");
      const problemas = [];
      if (!p.nombre.trim()) problemas.push("el nombre");
      if (p.presentaciones.some(function (x) { return !(x.precio > 0); })) problemas.push("el precio de cada presentación");
      if (box && !p.contenido.length) problemas.push("qué trae el box");
      if (problemas.length) { err.hidden = false; err.textContent = "Falta " + problemas.join(", ") + "."; return; }
      p.nombre = p.nombre.trim();
      p.presentaciones.forEach(function (x) {
        if (!x.etiqueta) x.etiqueta = x.gramos ? (x.gramos >= 1000 ? x.gramos / 1000 + " kg" : x.gramos + " g") : "Unidad";
        x.id = x.id || N.slug(x.etiqueta);
        x.precioKg = x.gramos ? Math.round(x.precio * 1000 / x.gramos / 100) * 100 : null;
      });
      if (original) Object.assign(original, p);
      else {
        let id = N.slug(p.nombre), n = 2;
        while (N.porId(cat, id)) id = N.slug(p.nombre) + "-" + n++;
        p.id = id;
        cat.productos.push(p);
      }
      if (guardar("Guardado: " + p.nombre)) location.hash = "#productos";
    });
  }
  function campo(etiqueta, control, id) {
    return '<div class="campo"><label for="' + id + '">' + etiqueta + "</label>" + control + "</div>";
  }

  /* Achica la foto (máx. 640 px, JPEG) para que entre en el navegador */
  function leerFoto(archivo) {
    return new Promise(function (ok, mal) {
      const lector = new FileReader();
      lector.onerror = mal;
      lector.onload = function () {
        const img = new Image();
        img.onerror = mal;
        img.onload = function () {
          const lado = 640, k = Math.min(1, lado / Math.max(img.width, img.height));
          const c = document.createElement("canvas");
          c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
          const g = c.getContext("2d");
          g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
          g.drawImage(img, 0, 0, c.width, c.height);
          ok(c.toDataURL("image/jpeg", 0.82));
        };
        img.src = lector.result;
      };
      lector.readAsDataURL(archivo);
    });
  }

  /* ---------- AUMENTOS ---------- */
  const aum = { pct: 10, alcance: "todo", paso: 10 };
  function afectados() {
    const filas = [];
    cat.productos.forEach(function (p) {
      if (aum.alcance !== "todo" && p.categoria !== aum.alcance) return;
      p.presentaciones.forEach(function (x) {
        filas.push({ p: p, x: x, antes: x.precio, despues: N.redondear(x.precio * (1 + aum.pct / 100), aum.paso) });
      });
    });
    return filas;
  }
  function vistaAumentos() {
    const filas = afectados();
    const nombreAlc = aum.alcance === "todo" ? "toda la lista" : N.nombreCategoria(cat, aum.alcance);
    let h = '<div class="adm-barra"><h1>Aumentos</h1></div>' +
      '<p class="adm-intro">Subí (o bajá) los precios de una categoría o de toda la lista de una vez. Se ve el antes y el después antes de aplicar.</p>' +
      '<form class="adm-aum" novalidate>' +
      '<fieldset class="adm-bloque"><legend>Porcentaje</legend><div class="adm-pct">' +
      [5, 10, 15, 20, 30].map(function (n) { return '<button type="button" class="chip" data-pct="' + n + '" aria-pressed="' + (aum.pct === n) + '">' + n + " %</button>"; }).join("") +
      '<label class="adm-pct__otro"><span class="sr">Otro porcentaje</span><input type="number" step="0.5" min="-50" max="200" data-pct-input value="' + aum.pct + '"><span>%</span></label></div></fieldset>' +
      '<div class="adm-2">' +
      campo("Aplicar a", '<select id="a-alc" data-alcance><option value="todo">Toda la lista</option>' +
        cat.categorias.map(function (c) { return '<option value="' + c.id + '"' + (aum.alcance === c.id ? " selected" : "") + ">" + e(c.nombre) + "</option>"; }).join("") + "</select>", "a-alc") +
      campo("Redondear a", '<select id="a-paso" data-paso>' + [10, 50, 100].map(function (n) { return '<option value="' + n + '"' + (aum.paso === n ? " selected" : "") + ">$ " + n + "</option>"; }).join("") + "</select>", "a-paso") +
      "</div>" +
      '<div class="adm-prev"><p class="adm-prev__t">' + filas.length + " precios de " + e(nombreAlc) + "</p>" +
      '<div class="adm-tabla-wrap"><table class="adm-tabla adm-tabla--prev"><thead><tr><th>Producto</th><th>Antes</th><th>Después</th></tr></thead><tbody>' +
      filas.slice(0, 8).map(function (f) {
        return "<tr><td>" + e(f.p.nombre) + ' <span class="opcional">' + e(f.x.etiqueta) + "</span></td><td>" + N.fmt(f.antes) + "</td><td><b>" + N.fmt(f.despues) + "</b></td></tr>";
      }).join("") + "</tbody></table></div>" +
      (filas.length > 8 ? '<p class="ayuda">…y ' + (filas.length - 8) + " precios más.</p>" : "") + "</div>" +
      '<button type="submit" class="btn btn--grande btn--acento"' + (filas.length && aum.pct ? "" : " disabled") + ">Aplicar " + (aum.pct >= 0 ? "aumento" : "baja") + " del " + Math.abs(aum.pct) + " % a " + e(nombreAlc) + "</button>" +
      "</form>";
    const hist = S.historial();
    if (hist.length) {
      h += '<section class="adm-hist"><h2>Últimos cambios</h2><ul>' + hist.slice(0, 8).map(function (x) {
        return "<li><span>" + new Date(x.fecha).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) + "</span> " + e(x.texto) + "</li>";
      }).join("") + "</ul></section>";
    }
    armazon("aumentos", h);
    const f = app.querySelector(".adm-aum");
    f.addEventListener("click", function (ev) {
      const b = ev.target.closest("[data-pct]");
      if (b) { aum.pct = +b.dataset.pct; vistaAumentos(); app.querySelector('[data-pct="' + aum.pct + '"]').focus(); }
    });
    f.addEventListener("change", function (ev) {
      const t = ev.target;
      if (t.matches("[data-pct-input]")) aum.pct = +t.value || 0;
      if (t.matches("[data-alcance]")) aum.alcance = t.value;
      if (t.matches("[data-paso]")) aum.paso = +t.value;
      const id = t.id;
      vistaAumentos();
      const vuelta = id ? document.getElementById(id) : app.querySelector("[data-pct-input]");
      if (vuelta) vuelta.focus();
    });
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      const filas = afectados();
      const txt = (aum.pct >= 0 ? "+" : "") + aum.pct + " % a " + nombreAlc + " · " + filas.length + " precios";
      if (!confirm("¿Aplicar " + txt + "?")) return;
      filas.forEach(function (f) {
        f.x.precio = f.despues;
        f.x.precioKg = f.x.gramos ? Math.round(f.despues * 1000 / f.x.gramos / 100) * 100 : null;
      });
      S.anotar(txt);
      guardar("Listo: " + txt);
      vistaAumentos();
    });
  }

  /* ---------- PROMOS Y BOXES ---------- */
  function vistaPromos() {
    const promos = cat.promociones || (cat.promociones = []);
    const objetivo = function (pr) {
      if (pr.alcance === "todo") return "Toda la tienda";
      if (pr.alcance === "categoria") return N.nombreCategoria(cat, pr.objetivo);
      const p = N.porId(cat, pr.objetivo); return p ? p.nombre : pr.objetivo;
    };
    let h = '<div class="adm-barra"><h1>Promos y boxes</h1></div>' +
      '<section class="adm-sec"><h2>Promociones</h2><p class="adm-intro">El descuento se ve en la tienda con el precio anterior tachado.</p><ul class="adm-promos">' +
      (promos.length ? promos.map(function (pr, i) {
        return '<li data-i="' + i + '"><div><b>' + e(pr.nombre) + "</b><span>−" + pr.valor + " % · " + e(objetivo(pr)) + "</span></div>" +
          '<label class="interruptor"><input type="checkbox" data-activa' + (pr.activa ? " checked" : "") + '><span class="interruptor__t">' + (pr.activa ? "Activa" : "Pausada") + "</span></label>" +
          '<button type="button" class="adm-x" data-quitar-promo aria-label="Borrar promo ' + e(pr.nombre) + '">×</button></li>';
      }).join("") : '<li class="adm-vacio">Todavía no hay promociones.</li>') + "</ul>" +
      '<form class="adm-nueva-promo adm-bloque" novalidate><h3>Nueva promo</h3>' +
      campo("Nombre", '<input id="pr-nombre" name="nombre" placeholder="Ej.: Semana de la miel" required>', "pr-nombre") +
      '<div class="adm-3">' +
      campo("Descuento %", '<input id="pr-valor" name="valor" type="number" min="1" max="90" value="10">', "pr-valor") +
      campo("Aplica a", '<select id="pr-alc" name="alcance"><option value="categoria">Una categoría</option><option value="producto">Un producto</option><option value="todo">Toda la tienda</option></select>', "pr-alc") +
      campo("Cuál", '<select id="pr-obj" name="objetivo">' + opcionesObjetivo("categoria") + "</select>", "pr-obj") +
      '</div><button type="submit" class="btn">Crear promo</button></form></section>' +
      '<section class="adm-sec"><h2>Boxes de regalo</h2><p class="adm-intro">Armalos con productos del catálogo: la tienda calcula sola cuánto ahorra el cliente contra comprar suelto.</p><ul class="adm-lista">' +
      cat.productos.filter(function (p) { return p.tipo === "pack"; }).map(function (p) {
        const cb = N.contenidoBox(p, cat);
        return '<li class="adm-prod"><a class="adm-prod__foto" href="#editar/' + e(p.id) + '" tabindex="-1" aria-hidden="true">' + V.plato(p) + "</a>" +
          '<div class="adm-prod__info"><a class="adm-prod__nombre" href="#editar/' + e(p.id) + '">' + e(p.nombre) + "</a>" +
          '<p class="adm-prod__meta">' + cb.items.length + " productos · ahorro " + N.fmt(cb.ahorro) + '</p><p class="adm-prod__precios">' + N.fmt(p.presentaciones[0].precio) + "</p></div>" +
          '<a class="btn btn--linea" href="#editar/' + e(p.id) + '">Editar</a></li>';
      }).join("") + '</ul><a class="btn btn--miel" href="#nuevo-box">+ Armar un box nuevo</a></section>';
    armazon("promos", h);

    const lista = app.querySelector(".adm-promos");
    lista.addEventListener("change", function (ev) {
      if (!ev.target.matches("[data-activa]")) return;
      const pr = promos[+ev.target.closest("[data-i]").dataset.i];
      pr.activa = ev.target.checked; guardar(pr.nombre + (pr.activa ? ": activa" : ": pausada"));
      ev.target.nextElementSibling.textContent = pr.activa ? "Activa" : "Pausada";
    });
    lista.addEventListener("click", function (ev) {
      if (!ev.target.matches("[data-quitar-promo]")) return;
      const i = +ev.target.closest("[data-i]").dataset.i;
      if (!confirm("¿Borrar la promo " + promos[i].nombre + "?")) return;
      promos.splice(i, 1); guardar("Promo borrada"); vistaPromos();
    });
    const f = app.querySelector(".adm-nueva-promo");
    f.alcance.addEventListener("change", function () { f.objetivo.innerHTML = opcionesObjetivo(f.alcance.value); f.objetivo.disabled = f.alcance.value === "todo"; });
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      const valor = +f.valor.value;
      if (!(valor > 0 && valor < 91)) { f.valor.setAttribute("aria-invalid", "true"); f.valor.focus(); return; }
      const nombre = f.nombre.value.trim() || ("−" + valor + " %");
      promos.push({ id: "promo-" + Date.now().toString(36), nombre: nombre, tipo: "porcentaje", valor: valor, alcance: f.alcance.value, objetivo: f.alcance.value === "todo" ? null : f.objetivo.value, activa: true });
      guardar("Promo creada: " + nombre); vistaPromos();
    });
  }
  function opcionesObjetivo(alcance) {
    if (alcance === "producto") return cat.productos.map(function (p) { return '<option value="' + p.id + '">' + e(p.nombre) + "</option>"; }).join("");
    if (alcance === "todo") return '<option value="">—</option>';
    return cat.categorias.map(function (c) { return '<option value="' + c.id + '">' + e(c.nombre) + "</option>"; }).join("");
  }

  /* ---------- PEDIDOS ---------- */
  const ESTADOS = { nuevo: "Nuevo", preparando: "Preparando", entregado: "Entregado", cancelado: "Cancelado" };
  function vistaPedidos() {
    const lista = S.pedidos();
    const nuevos = lista.filter(function (p) { return p.estado === "nuevo"; }).length;
    const vendido = lista.filter(function (p) { return p.estado !== "cancelado"; }).reduce(function (a, p) { return a + p.total; }, 0);
    let h = '<div class="adm-barra"><h1>Pedidos</h1></div>' +
      '<div class="adm-kpis"><div><span>' + nuevos + '</span><p>sin preparar</p></div><div><span>' + lista.length + '</span><p>pedidos</p></div><div><span>' + N.fmt(vendido) + "</span><p>vendido</p></div></div>" +
      '<p class="adm-intro">Cada pedido que se manda por WhatsApp desde la tienda queda anotado acá' + (CFG.esDemo ? " (en la demo, los que se hacen desde este navegador; los marcados como ejemplo son de muestra)" : "") + ".</p>" +
      '<ul class="adm-pedidos">';
    lista.forEach(function (p, i) {
      const f = new Date(p.fecha);
      h += '<li class="adm-ped adm-ped--' + e(p.estado) + '" data-i="' + i + '">' +
        '<div class="adm-ped__cab"><p class="adm-ped__num">#' + e(CFG.prefijoPedido + "-" + p.numero) + (p.ejemplo ? ' <span class="adm-tag">ejemplo</span>' : "") + "</p>" +
        '<p class="adm-ped__fecha">' + f.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }) + " " + f.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }) + "</p>" +
        '<label class="sr" for="est' + i + '">Estado</label><select id="est' + i + '" data-estado>' +
        Object.keys(ESTADOS).map(function (k) { return '<option value="' + k + '"' + (p.estado === k ? " selected" : "") + ">" + ESTADOS[k] + "</option>"; }).join("") + "</select></div>" +
        '<p class="adm-ped__cli"><b>' + e(p.cliente.nombre) + "</b> · " + (p.entrega.tipo === "retiro" ? "Retira en Castelar" : "Envío a " + e(p.entrega.direccion || "") + " (" + e(p.entrega.zona) + ")") + " · " + e(p.pago) + "</p>" +
        '<ul class="adm-ped__items">' + p.items.map(function (it) {
          return "<li><span>" + it.cant + " × " + e(it.nombre) + (it.pres && !/^(box|unidad)$/i.test(it.pres) ? " " + e(it.pres) : "") + (it.dedicatoria ? '<em>Dedicatoria: “' + e(it.dedicatoria) + "”</em>" : "") + "</span><span>" + N.fmt(it.precio * it.cant) + "</span></li>";
        }).join("") + "</ul>" +
        (p.notas ? '<p class="adm-ped__notas">Notas: ' + e(p.notas) + "</p>" : "") +
        '<p class="adm-ped__total"><span>' + (p.envio ? "Envío " + N.fmt(p.envio) + " · " : "") + "Total</span><b>" + N.fmt(p.total) + "</b></p></li>";
    });
    h += "</ul>";
    armazon("pedidos", h);
    app.querySelector(".adm-pedidos").addEventListener("change", function (ev) {
      if (!ev.target.matches("[data-estado]")) return;
      const li = ev.target.closest("[data-i]");
      const todos = S.pedidos();
      todos[+li.dataset.i].estado = ev.target.value;
      S.guardarPedidos(todos);
      li.className = "adm-ped adm-ped--" + ev.target.value;
      aviso("Pedido #" + CFG.prefijoPedido + "-" + todos[+li.dataset.i].numero + ": " + ESTADOS[ev.target.value]);
    });
  }

  /* ---------- ENVÍOS ---------- */
  function vistaEnvios() {
    const env = envios;
    const h = '<div class="adm-barra"><h1>Envíos</h1></div>' +
      '<form class="adm-env" novalidate>' +
      '<fieldset class="adm-bloque"><legend>Retiro</legend>' +
      '<label class="check"><input type="checkbox" name="retiroActivo"' + (env.retiro.activo ? " checked" : "") + "> Ofrecer retiro sin cargo</label>" +
      '<div class="adm-2">' + campo("Nombre", '<input id="r-n" name="retiroNombre" value="' + e(env.retiro.nombre) + '">', "r-n") +
      campo("Detalle", '<input id="r-d" name="retiroDetalle" value="' + e(env.retiro.detalle) + '">', "r-d") + "</div></fieldset>" +
      '<fieldset class="adm-bloque"><legend>Zonas y costo</legend><div data-zonas>' + zonasFilas(env) + "</div>" +
      '<button type="button" class="btn btn--linea" data-agregar-zona>+ Agregar zona</button></fieldset>' +
      '<fieldset class="adm-bloque"><legend>Envío gratis</legend>' +
      campo("Envío gratis desde ($, 0 = nunca)", '<input id="r-g" name="gratisDesde" type="number" min="0" step="1000" value="' + (env.gratisDesde || 0) + '">', "r-g") + "</fieldset>" +
      '<button type="submit" class="btn btn--grande">Guardar envíos</button></form>';
    armazon("envios", h);
    const f = app.querySelector(".adm-env");
    function leerZonas() {
      return Array.from(f.querySelectorAll(".adm-zona")).map(function (z, i) {
        const nombre = z.querySelector('[data-z="nombre"]').value.trim();
        return { id: (env.zonas[i] && env.zonas[i].id) || N.slug(nombre) || "zona-" + i, nombre: nombre, costo: +z.querySelector('[data-z="costo"]').value || 0 };
      });
    }
    f.addEventListener("click", function (ev) {
      if (ev.target.matches("[data-agregar-zona]")) { env.zonas = leerZonas(); env.zonas.push({ id: "", nombre: "", costo: 0 }); f.querySelector("[data-zonas]").innerHTML = zonasFilas(env); f.querySelector(".adm-zona:last-child input").focus(); }
      if (ev.target.matches("[data-quitar-zona]")) { env.zonas = leerZonas(); env.zonas.splice(+ev.target.closest(".adm-zona").dataset.i, 1); f.querySelector("[data-zonas]").innerHTML = zonasFilas(env); }
    });
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      env.retiro = { activo: f.retiroActivo.checked, nombre: f.retiroNombre.value.trim() || "Retiro", detalle: f.retiroDetalle.value.trim() };
      env.zonas = leerZonas().filter(function (z) { return z.nombre; });
      env.gratisDesde = +f.gratisDesde.value || 0;
      S.guardarEnvios(env);
      aviso("Envíos guardados");
      vistaEnvios();
    });
  }
  function zonasFilas(env) {
    return env.zonas.map(function (z, i) {
      return '<div class="adm-zona" data-i="' + i + '"><label class="sr" for="zn' + i + '">Zona</label><input id="zn' + i + '" data-z="nombre" value="' + e(z.nombre) + '" placeholder="Ej.: Morón">' +
        '<label class="sr" for="zc' + i + '">Costo</label><span class="adm-zona__pesos">$</span><input id="zc' + i + '" data-z="costo" type="number" min="0" step="100" value="' + z.costo + '">' +
        '<button type="button" class="adm-x" data-quitar-zona aria-label="Quitar zona">×</button></div>';
    }).join("");
  }

  /* ---------- ruteo ---------- */
  function ruta() {
    const h = location.hash.replace(/^#/, "") || "productos";
    if (h.indexOf("editar/") === 0) return vistaEditor(decodeURIComponent(h.slice(7)));
    if (h === "nuevo") return vistaEditor(null, false);
    if (h === "nuevo-box") return vistaEditor(null, true);
    ({ productos: vistaProductos, aumentos: vistaAumentos, promos: vistaPromos, pedidos: vistaPedidos, envios: vistaEnvios }[h] || vistaProductos)();
    window.scrollTo(0, 0);
  }

  async function arrancar() {
    cat = await S.catalogo();
    envios = JSON.parse(JSON.stringify(S.envios()));
    window.addEventListener("hashchange", ruta);
    document.addEventListener("click", async function (ev) {
      if (ev.target.closest("[data-salir]")) { try { sessionStorage.removeItem("tienda_admin"); } catch (x) { /* nada */ } location.href = "/"; }
      if (ev.target.closest("[data-reiniciar]") && confirm("Esto borra los cambios hechos en este navegador y vuelve al catálogo de ejemplo. ¿Seguir?")) {
        S.reiniciar(); cat = await S.catalogo(); envios = JSON.parse(JSON.stringify(S.envios())); aviso("Volviste a la demo original"); ruta();
      }
    });
    ruta();
  }

  if (autenticado()) arrancar(); else pantallaPin(false);
})();
