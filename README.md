# Tienda online de productos saludables y regionales · demo para Damián (Castelar)

Demo gratis armada por [Tu Negocio En Las Redes](https://tunegocioenlasredes.com.ar) para Damián, que está por
lanzar su venta online de frutos secos, mixes, semillas, miel, yerba y accesorios de mate, y boxes de regalo.
**La marca todavía no tiene nombre**: en todo el código es `BRAND_NAME` (hoy "Tu Marca").

- **Tienda:** https://damian-saludables-demo.vercel.app
- **Panel:** https://damian-saludables-demo.vercel.app/admin · PIN `1234`
- **Variantes de diseño:** agregar `?v=b` (Botica) o `?v=c` (Sobre de semillas) a cualquier URL. `?v=a` vuelve al principal.

## Cómo se administra (panel `/admin`)

| Sección | Qué hace |
|---|---|
| **Productos** | Lista con buscador. El interruptor de cada fila lo marca **sin stock** (y lo vuelve a poner con el stock que tenía). Tocar el nombre abre el editor: nombre, categoría, origen, descripción, uso, **foto**, presentaciones (peso, precio, stock; el $/kg lo calcula solo), Sin TACC, Sin azúcar agregada, destacado, visible. |
| **+ Producto / + Box** | Carga un producto nuevo. El box se arma eligiendo productos del catálogo; el panel muestra cuánto sale suelto y cuánto ahorra el cliente. |
| **Aumentos** | Porcentaje (5, 10, 15, 20, 30 o el que quieras, también negativo), a **toda la lista o a una categoría**, redondeo a $10, $50 o $100. Muestra antes y después, pide confirmación y queda anotado en "Últimos cambios". |
| **Promos y boxes** | Promos de % a una categoría, un producto o toda la tienda; se pausan o se borran. En la tienda se ven con el precio anterior tachado. |
| **Pedidos** | Cada pedido que se manda por WhatsApp queda anotado con cliente, entrega, pago, productos, dedicatoria y total. Estados: nuevo, preparando, entregado, cancelado. |
| **Envíos** | Retiro en Castelar (sí o no, texto), zonas con su costo, envío gratis desde un monto. |

**Fotos:** sirve cualquier foto, incluso la del proveedor con fondo blanco. La tienda la achica, la recorta y la
pone sobre el mismo fondo gris que el resto (el blanco se funde con `mix-blend-mode: multiply`). Los productos sin
foto muestran un dibujo del envase con el contenido (`assets/js/ilustraciones.js`), que se elige en el editor.

> **Ojo, es una demo:** el panel guarda en `localStorage`, o sea **en el navegador de quien lo usa**. Si Damián
> cambia un precio en su celular, lo ve él en su celular; otra persona sigue viendo `data/productos.json`.
> La versión final guarda en una base de datos (Supabase, como el resto de los proyectos de la agencia) y el cambio
> lo ve todo el mundo al instante. "Volver a la demo original", al pie del panel, borra lo guardado.

## Cómo compra el cliente

Elige el peso en la tarjeta o en la ficha → Agregar → barra "Ver pedido" (en el celular) → en una sola pantalla:
retiro o envío (zona + dirección), nombre, pago (transferencia, efectivo o Mercado Pago) → **Enviar pedido por
WhatsApp** con el mensaje ya armado. No hace falta registrarse. Los datos quedan guardados para el próximo pedido.

## Stack

HTML, CSS y JavaScript vanilla, sin frameworks ni dependencias en el navegador. Fuentes propias en woff2 (Young
Serif, Schibsted Grotesk, IBM Plex Mono y las de las variantes). Deploy en Vercel conectado al repo de GitHub:
cada push a `main` se publica solo.

```
index.html                 home (hero con ticket, boxes, catálogo, cómo comprás, envíos)   ← generado
producto/<id>/index.html   una página por producto: título, descripción, Product + BreadcrumbList  ← generado
producto/index.html        ficha de productos creados desde el panel (/producto/?p=id)      ← generado
admin/index.html           panel                                                            ← generado
data/productos.json        EL CATÁLOGO (fuente de verdad)
assets/js/config.js        BRAND_NAME, WhatsApp, envíos, pagos, PIN
assets/js/nucleo.js        cuentas: precios, promos, $/kg, ahorro de boxes, envío (navegador + Node)
assets/js/vistas.js        HTML de tarjetas, box, ticket y ficha (navegador + Node)
assets/js/ilustraciones.js envases dibujados por código (navegador + Node)
assets/js/store.js         catálogo, carrito, pedidos y cambios del panel (localStorage)
assets/js/carrito.js       panel del pedido y mensaje de WhatsApp
assets/js/tienda.js        home, filtros, buscador, ficha
assets/js/admin.js         panel
assets/css/tienda.css      sistema de diseño (tokens arriba; variantes B y C = otros tokens)
api/mp-preferencia.js      Mercado Pago Checkout Pro (preparado, apagado)
_build/generar.js          arma las páginas desde el catálogo
_build/imagenes.py         favicon, íconos, og.png y PNG de cada producto (Playwright)
```

## Cambiar el nombre de la marca

1. `assets/js/config.js` → `BRAND_NAME: "El nombre"` y `marcaProvisoria: false`.
2. `node _build/generar.js` y `python _build/imagenes.py`.
3. Cambiar `name` en `site.webmanifest` y `prefijoPedido` en la config (hoy `TM`).
4. Push.

Después de editar `data/productos.json` a mano también hay que correr `node _build/generar.js` (las páginas de
producto salen prearmadas para Google).

## Mercado Pago (preparado, no conectado)

El botón usa `api/mp-preferencia.js`, que **recalcula los precios en el servidor** (no confía en lo que manda el
navegador) y devuelve el link de pago. Para activarlo: cargar `MP_ACCESS_TOKEN` en Vercel → Settings →
Environment Variables (el token de la cuenta de Damián, nunca en el código), poner
`pagos.mercadoPago.activo: true` en la config y hacer redeploy. Mientras tanto, si el cliente elige Mercado Pago,
el pedido va por WhatsApp y Damián le manda el link.

## Qué falta para la versión final

1. **Nombre, logo y dominio.** Con el nombre: logo (hoy es solo tipográfico), dominio .com.ar con el protocolo
   NIC.ar + Cloudflare + Vercel de la agencia, y reemplazar `urlBase` en la config.
2. **Base de datos** para catálogo, pedidos y envíos (Supabase), con **login real** en vez del PIN.
3. **Productos, precios y fotos reales.** Las fotos de proveedor entran por el panel.
4. **WhatsApp de pedidos** en `config.js` (hoy vacío: WhatsApp se abre para elegir a quién mandarlo).
5. **Mercado Pago** con la cuenta de Damián (ver arriba) y el aviso de pago aprobado en el panel.
6. **Sacar el noindex:** meta `robots` en `_build/generar.js`, header `X-Robots-Tag` en `vercel.json`,
   `robots.txt` (dejar `Disallow: /admin` y el sitemap) y `esDemo: false` en la config para sacar el aviso.
7. **Sin TACC:** usar la etiqueta solo en productos con certificado del proveedor (RNPA / logo oficial).
   No agregar propiedades de salud en las descripciones (ANMAT).
8. Google Analytics o Plausible con el evento "pedido enviado", Google Business Profile, Instagram con link a la tienda.

## Desarrollo local

```bash
node _build/generar.js
```

Servir la carpeta con cualquier servidor estático que resuelva `/producto/almendras` → `producto/almendras/index.html`
(en la carpeta del proyecto hay uno: `node ../insumos/servidor.js 5193`).
