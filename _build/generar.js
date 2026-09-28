/* ============================================================
   generar.js · arma las páginas estáticas de la tienda
     node _build/generar.js
   - index.html, producto/<id>/index.html (una por producto, con su
     título, descripción y datos estructurados Product), producto/index.html
     (productos creados desde el panel), admin/index.html, 404.html, sitemap.xml
   - assets/img/productos/<id>.svg (ilustración de cada producto)
   BRAND_NAME sale de assets/js/config.js: se cambia ahí y se corre esto.
   ============================================================ */
const fs = require("fs");
const path = require("path");

const RAIZ = path.resolve(__dirname, "..");
const CFG = require(path.join(RAIZ, "assets/js/config.js"));
const N = require(path.join(RAIZ, "assets/js/nucleo.js"));
const I = require(path.join(RAIZ, "assets/js/ilustraciones.js"));
const V = require(path.join(RAIZ, "assets/js/vistas.js"));
const CAT = JSON.parse(fs.readFileSync(path.join(RAIZ, "data/productos.json"), "utf8"));
const BRAND_NAME = CFG.BRAND_NAME;
const BASE = CFG.urlBase.replace(/\/$/, "");
const e = N.escapar;
const ctx = { catalogo: CAT, config: CFG };
const VERSION = Date.now().toString(36);   // rompe la caché de CSS/JS en cada build

function escribir(rel, contenido) {
  const f = path.join(RAIZ, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, contenido, "utf8");
}

/* ---------- partes comunes ---------- */
const ICONO = {
  buscar: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>',
  bolsa: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>'
};

function head(o) {
  const ld = (o.ld || []).map(function (x) {
    return '<script type="application/ld+json">' + JSON.stringify(x).replace(/</g, "\\u003c") + "</script>";
  }).join("\n");
  return `<!doctype html>
<html lang="es-AR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${e(o.titulo)}</title>
<meta name="description" content="${e(o.descripcion)}">
<!-- DEMO: no indexar hasta que el cliente contrate (ver README) -->
<meta name="robots" content="noindex, nofollow">
<link rel="canonical" href="${BASE}${o.ruta}">
<meta property="og:type" content="${o.ogTipo || "website"}">
<meta property="og:locale" content="es_AR">
<meta property="og:site_name" content="${e(BRAND_NAME)}">
<meta property="og:title" content="${e(o.titulo)}">
<meta property="og:description" content="${e(o.descripcion)}">
<meta property="og:url" content="${BASE}${o.ruta}">
<meta property="og:image" content="${BASE}${o.imagen || "/assets/img/og.png"}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#F7F4EE">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="/assets/fonts/young-serif.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/schibsted-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/plex-mono-500.woff2" as="font" type="font/woff2" crossorigin>
<script>try{var q=new URLSearchParams(location.search).get("v"),v=sessionStorage.getItem("tienda_variante");if(q!==null)v=q==="a"?"":q;if(v)document.documentElement.dataset.variante=v}catch(x){}</script>
<link rel="stylesheet" href="/assets/css/${o.css || "tienda"}.css?v=${VERSION}">
${ld}
</head>`;
}

function cabecera() {
  return `<a class="saltar" href="#contenido">Saltar al contenido</a>
<p class="aviso-demo">${e(CFG.avisoDemo).replace(/^Demo/, "<b>Demo</b>")}</p>
<header class="cab">
  <div class="cab__in">
    <a class="logo" href="/" aria-label="${e(BRAND_NAME)}, inicio">
      <span class="logo__marca">${e(BRAND_NAME)}</span>${CFG.marcaProvisoria ? '<span class="logo__prov" aria-hidden="true">nombre provisorio</span>' : ""}
    </a>
    <nav class="cab__nav" aria-label="Principal">
      <a href="/#catalogo">Catálogo</a><a href="/#boxes">Para regalar</a><a href="/#envios">Envíos</a>
    </nav>
    <a class="cab__btn" href="/#buscar" aria-label="Buscar productos">${ICONO.buscar}</a>
    <button type="button" class="cab__btn cab__carrito" data-abrir-carrito aria-label="Ver pedido">${ICONO.bolsa}<span class="cab__n" data-contador hidden>0</span></button>
  </div>
</header>`;
}

function pie() {
  const cats = CAT.categorias.map(function (c) {
    return '<li><a href="/?cat=' + e(c.id) + '#catalogo" data-ir-cat="' + e(c.id) + '">' + e(c.nombre) + "</a></li>";
  }).join("");
  const prods = CAT.productos.filter(function (p) { return p.activo !== false; }).map(function (p) {
    return '<li><a href="' + V.url(p) + '">' + e(p.nombre) + "</a></li>";
  }).join("");
  return `<footer class="pie">
  <div class="pie__in">
    <div>
      <p class="pie__marca">${e(BRAND_NAME)}</p>
      <p>${e(CFG.rubro)}. Venta online desde ${e(CFG.localidad)}. Retiro en Castelar o envío en Zona Oeste.</p>
    </div>
    <nav aria-label="Categorías"><h2>Categorías</h2><ul>${cats}</ul></nav>
    <nav class="pie__indice" aria-label="Todos los productos"><h2>Todos los productos</h2><ul>${prods}</ul></nav>
    <div class="pie__cred">
      <span>© ${new Date().getFullYear()} ${e(BRAND_NAME)} · Precios en pesos argentinos</span>
      <span>Diseño y desarrollo por <a href="https://tunegocioenlasredes.com.ar" target="_blank" rel="noopener">Tu Negocio En Las Redes</a></span>
    </div>
  </div>
</footer>
<a class="barra-pedido" href="#pedido" data-abrir-carrito hidden>
  <span class="barra-pedido__n" data-barra-n></span><span class="barra-pedido__total" data-barra-total></span><span class="barra-pedido__ver">Ver pedido</span>
</a>
<dialog id="panel-pedido" class="panel" aria-labelledby="panel-t">
  <div class="panel__cab"><h2 id="panel-t">Tu pedido</h2><button type="button" class="panel__x" data-cerrar aria-label="Cerrar el pedido">×</button></div>
  <div class="panel__cuerpo"></div>
</dialog>
<script src="/assets/js/config.js?v=${VERSION}"></script>
<script src="/assets/js/nucleo.js?v=${VERSION}"></script>
<script src="/assets/js/ilustraciones.js?v=${VERSION}"></script>
<script src="/assets/js/vistas.js?v=${VERSION}"></script>
<script src="/assets/js/store.js?v=${VERSION}"></script>
<script src="/assets/js/carrito.js?v=${VERSION}"></script>
<script src="/assets/js/tienda.js?v=${VERSION}"></script>
</body>
</html>
`;
}

/* ---------- HOME ---------- */
function home() {
  const sueltos = CAT.productos.filter(function (p) { return p.activo !== false && p.tipo !== "pack"; });
  const boxes = CAT.productos.filter(function (p) { return p.activo !== false && p.tipo === "pack"; });
  const heroP = sueltos.find(function (p) { return p.destacado && p.presentaciones.length >= 3; }) || sueltos[0];
  const min = Math.min.apply(null, CFG.envios.zonas.map(function (z) { return z.costo; }));
  const ld = [{
    "@context": "https://schema.org", "@type": "Store", name: BRAND_NAME, url: BASE + "/",
    description: CFG.rubro + ". Venta online con retiro en Castelar y envío en Zona Oeste.",
    address: { "@type": "PostalAddress", addressLocality: "Castelar", addressRegion: "Buenos Aires", addressCountry: "AR" },
    currenciesAccepted: "ARS", paymentAccepted: "Transferencia, efectivo, Mercado Pago"
  }];
  return head({
    titulo: BRAND_NAME + " · Frutos secos, semillas, miel y yerba en Castelar",
    descripcion: "Frutos secos, mixes, semillas, miel, yerba y boxes de regalo con el precio por kilo a la vista. Retiro en Castelar o envío en Zona Oeste. Pedí por WhatsApp.",
    ruta: "/", ld: ld
  }) + `
<body>
${cabecera()}
<main id="contenido" data-pagina="home">
  <section class="hero" aria-labelledby="hero-t">
    <div class="hero__txt">
      <p class="hero__sup">Almacén online · Castelar</p>
      <h1 id="hero-t">Frutos secos, semillas, miel y yerba.</h1>
      <p class="hero__bajada">Con el <strong>precio por kilo a la vista</strong>, para que compares antes de elegir. Retiro en Castelar o envío en Zona Oeste.</p>
    </div>
    <div id="hero-prod" class="hero__demo">${V.hero(heroP, ctx)}</div>
  </section>

  <section id="boxes" class="boxes" aria-labelledby="boxes-t">
    <div class="boxes__cab">
      <p class="boxes__sup">Para regalar</p>
      <h2 id="boxes-t">Boxes armados a mano</h2>
      <p>Con tarjeta y tu dedicatoria. Cada box te dice qué trae y cuánto ahorrás contra comprarlo suelto.</p>
    </div>
    <div id="boxes-lista" class="boxes__lista">${boxes.map(function (p) { return V.tarjetaBox(p, ctx); }).join("")}</div>
  </section>

  <section id="catalogo" class="catalogo" aria-labelledby="catalogo-t">
    <div class="catalogo__cab"><h2 id="catalogo-t">Catálogo</h2><p id="resumen" aria-live="polite">${sueltos.length} productos</p></div>
    <form id="form-buscar" class="buscar" role="search">
      <label class="sr" for="buscar">Buscar productos</label>
      ${ICONO.buscar}
      <input id="buscar" type="search" autocomplete="off" enterkeyhint="search" placeholder="Buscar almendras, miel, yerba…">
    </form>
    <div class="chips-wrap"><div id="chips" class="chips" aria-label="Categorías"></div></div>
    <div class="filtros">
      <label class="toggle"><input id="f-tacc" type="checkbox"><span>Sin TACC</span></label>
      <label class="toggle"><input id="f-azucar" type="checkbox"><span>Sin azúcar agregada</span></label>
      <label class="orden"><span class="sr">Ordenar por</span>
        <select id="orden"><option value="destacados">Destacados</option><option value="precio">Menor precio</option><option value="kilo">Menor precio por kilo</option></select>
      </label>
    </div>
    <div id="grilla" class="grilla">${sueltos.map(function (p) { return V.tarjeta(p, ctx); }).join("")}</div>
    <div id="vacio" class="vacio" hidden><p data-vacio-q></p><button type="button" id="limpiar" class="btn btn--linea">Ver todo el catálogo</button></div>
    <button type="button" id="ver-mas" class="btn btn--linea ver-mas" hidden></button>
  </section>

  <section id="como" class="como" aria-labelledby="como-t">
    <div class="como__in">
      <h2 id="como-t">Cómo comprás</h2>
      <ol class="pasos">
        <li><strong>Elegís el peso</strong><p>Cada producto te muestra el importe y el precio por kilo. Sin sorpresas.</p></li>
        <li><strong>Mandás el pedido por WhatsApp</strong><p>Se arma solo, con productos, cantidades y total. No hace falta registrarse.</p></li>
        <li><strong>Retirás o te lo llevamos</strong><p>Retiro sin cargo en Castelar o envío en Zona Oeste desde ${N.fmt(min)}.</p></li>
      </ol>
    </div>
  </section>

  <section id="envios" class="envios" aria-labelledby="envios-t">
    <div class="envios__in">
      <div>
        <h2 id="envios-t">Envíos y retiro</h2>
        <p class="envios__nota">Pagás por transferencia, en efectivo o con Mercado Pago. Coordinamos día y horario por WhatsApp cuando confirmamos tu pedido.</p>
      </div>
      <div id="envios-tabla" class="envios__tabla"></div>
    </div>
  </section>
</main>
${pie()}`;
}

/* ---------- FICHA ---------- */
function disponibilidad(pres) { return pres.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"; }

function ldProducto(p) {
  const url = BASE + V.url(p);
  const ofertas = p.presentaciones.map(function (pres) {
    const pr = N.precio(p, pres, CAT);
    const o = {
      "@type": "Offer", name: pres.etiqueta, sku: p.id + "-" + pres.id, url: url,
      price: String(pr.precio), priceCurrency: "ARS", availability: disponibilidad(pres),
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: BRAND_NAME }
    };
    if (pr.precioKg) {
      o.priceSpecification = {
        "@type": "UnitPriceSpecification", price: String(pr.precioKg), priceCurrency: "ARS",
        referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "KGM" }
      };
    }
    return o;
  });
  const producto = {
    "@context": "https://schema.org", "@type": "Product",
    name: p.nombre, description: p.descripcion + (p.uso ? " " + p.uso : ""),
    image: [BASE + "/assets/img/productos/" + p.id + ".png"],
    sku: p.id, category: N.nombreCategoria(CAT, p.categoria),
    brand: { "@type": "Brand", name: BRAND_NAME },
    offers: ofertas.length === 1 ? ofertas[0] : {
      "@type": "AggregateOffer", priceCurrency: "ARS", offerCount: ofertas.length,
      lowPrice: String(Math.min.apply(null, ofertas.map(function (o) { return +o.price; }))),
      highPrice: String(Math.max.apply(null, ofertas.map(function (o) { return +o.price; }))),
      availability: ofertas.some(function (o) { return o.availability.endsWith("InStock"); }) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      offers: ofertas
    }
  };
  if (p.origen && !/nosotros|importad/i.test(p.origen)) producto.countryOfOrigin = { "@type": "Country", name: "Argentina" };
  const migas = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: BASE + "/" },
      { "@type": "ListItem", position: 2, name: N.nombreCategoria(CAT, p.categoria), item: BASE + "/?cat=" + p.categoria },
      { "@type": "ListItem", position: 3, name: p.nombre, item: url }
    ]
  };
  return [producto, migas];
}

function tituloProducto(p) {
  const pesos = p.presentaciones.filter(function (x) { return x.gramos; }).map(function (x) { return x.etiqueta; });
  const detalle = pesos.length > 1 ? pesos.slice(0, -1).join(", ") + " y " + pesos[pesos.length - 1] : pesos[0] || "";
  return p.nombre + (detalle ? " · " + detalle : "") + " · " + BRAND_NAME;
}
function descripcionProducto(p) {
  const desde = Math.min.apply(null, p.presentaciones.map(function (x) { return N.precio(p, x, CAT).precio; }));
  return (p.tipo === "pack" ? "Box de regalo. " : "") + p.descripcion + " Desde " + N.fmt(desde).replace(" ", " ") +
    ". Retiro en Castelar o envío en Zona Oeste.";
}

function paginaProducto(p) {
  return head({
    titulo: tituloProducto(p), descripcion: descripcionProducto(p), ruta: V.url(p), ogTipo: "product",
    imagen: "/assets/img/productos/" + p.id + ".png", ld: ldProducto(p)
  }) + `
<body>
${cabecera()}
<main id="contenido" data-pagina="producto" data-id="${e(p.id)}">
  <div id="ficha" class="ficha-pag">${V.ficha(p, ctx)}</div>
  <section id="relacionados" class="relacionados" aria-labelledby="rel-t" hidden>
    <h2 id="rel-t">También te puede interesar</h2>
    <div class="grilla"></div>
  </section>
</main>
${pie()}`;
}

function paginaProductoDinamica() {
  return head({ titulo: "Producto · " + BRAND_NAME, descripcion: "Producto de " + BRAND_NAME + ".", ruta: "/producto/" }) + `
<body>
${cabecera()}
<main id="contenido" data-pagina="producto">
  <div id="ficha" class="ficha-pag"></div>
  <section id="relacionados" class="relacionados" aria-labelledby="rel-t" hidden>
    <h2 id="rel-t">También te puede interesar</h2>
    <div class="grilla"></div>
  </section>
</main>
${pie()}`;
}

function pagina404() {
  return head({ titulo: "No encontramos esa página · " + BRAND_NAME, descripcion: "Página no encontrada.", ruta: "/404" }) + `
<body>
${cabecera()}
<main id="contenido" data-pagina="404">
  <div id="ficha" class="ficha-pag"><div class="ficha-no"><h1>No encontramos esa página</h1><p>Puede que el producto haya cambiado de nombre.</p><a class="btn btn--linea" href="/#catalogo">Ver el catálogo</a></div></div>
  <section id="relacionados" class="relacionados" aria-labelledby="rel-t" hidden>
    <h2 id="rel-t">También te puede interesar</h2>
    <div class="grilla"></div>
  </section>
</main>
${pie()}`;
}

function admin() {
  return `<!doctype html>
<html lang="es-AR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Panel · ${e(BRAND_NAME)}</title>
<meta name="robots" content="noindex, nofollow">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/css/tienda.css?v=${VERSION}">
<link rel="stylesheet" href="/assets/css/admin.css?v=${VERSION}">
</head>
<body class="adm">
<a class="saltar" href="#adm-main">Saltar al contenido</a>
<div id="app"></div>
<script src="/assets/js/config.js?v=${VERSION}"></script>
<script src="/assets/js/nucleo.js?v=${VERSION}"></script>
<script src="/assets/js/ilustraciones.js?v=${VERSION}"></script>
<script src="/assets/js/vistas.js?v=${VERSION}"></script>
<script src="/assets/js/store.js?v=${VERSION}"></script>
<script src="/assets/js/admin.js?v=${VERSION}"></script>
</body>
</html>
`;
}

/* ---------- salida ---------- */
escribir("index.html", home());
CAT.productos.forEach(function (p) {
  escribir("producto/" + p.id + "/index.html", paginaProducto(p));
  escribir("assets/img/productos/" + p.id + ".svg", I.svg(p, { uid: "x" }));
});
escribir("producto/index.html", paginaProductoDinamica());
escribir("admin/index.html", admin());
escribir("404.html", pagina404());
const hoy = new Date().toISOString().slice(0, 10);
escribir("sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  ["/"].concat(CAT.productos.map(V.url)).map(function (u) { return "  <url><loc>" + BASE + u + "</loc><lastmod>" + hoy + "</lastmod></url>"; }).join("\n") +
  "\n</urlset>\n");
console.log("OK ·", CAT.productos.length, "productos ·", BRAND_NAME);
