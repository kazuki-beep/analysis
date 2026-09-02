# Vida Bebida 2.0 — prototipo de rediseño

Dos archivos estáticos, sin build ni dependencias.

```
index.html    El prototipo de tienda
audit.html    La auditoría (se sirve en /audit con cleanUrls)
vercel.json   Deploy config — noindex, porque es un prototipo
```

```bash
python3 -m http.server 8000     # http://localhost:8000
vercel --prod                   # /  y  /audit
```

## Lo que este prototipo NO es

No toca Shopify. No hay catálogo real, carrito real ni checkout. Es una maqueta
de front-end para evaluar la experiencia antes de tocar el tema en producción.

## De dónde salen los datos

`vidabebida.com` está bloqueado por la política de red de este entorno — ver
[`RESEARCH.md`](RESEARCH.md) para el detalle y las opciones de desbloqueo. Todo
el contenido se reconstruyó de fuentes públicas indexadas y **debe verificarse
contra la tienda en vivo antes de publicar**.

Marcado explícitamente en la interfaz:

- **Precios** — de maqueta. Subrayado punteado en toda la UI, más un aviso fijo
  arriba de la página. Ninguno se presenta como precio real.
- **Packaging** — cada espacio lleva la etiqueta `asset` y espera la fotografía
  original. No se dibujaron envases falsos ni se alteraron etiquetas.
- **Colores** — la paleta se deriva de ingredientes reales (jamaica, limón,
  mango, moras, jengibre, mate), no de la identidad de Vida Bebida. Vive
  completa en el bloque `:root` de `index.html` y se sustituye ahí.

No se inventaron reseñas, calificaciones, afirmaciones de salud, descuentos ni
capturas de "antes".

## Puntos de sustitución

| Qué | Dónde |
|---|---|
| Paleta de marca | `:root { }` al inicio de `index.html` |
| Catálogo | `var P = [...]` y `var FAM = {...}` en el `<script>` |
| Umbral de envío gratis | `var FREE_SHIP = 300` — leerlo de Shopify, no fijarlo |
| Puntos de venta | `var STORES = [...]` |
| Preguntas frecuentes | `var FAQ = [...]` y el bloque `application/ld+json` |
| Texto de la promoción | `<div class="ann">` — cotejar con la tienda en vivo |

## Arma tu Caja — lo que hace falta en Shopify

El flujo funciona como prototipo. Para producción hace falta una de dos:

1. **Producto de caja con propiedades de línea** — un producto por tamaño
   (12, 24) y la mezcla de sabores como line item properties. Simple, sin apps,
   pero el inventario por sabor no se descuenta solo.
2. **App de bundles** — descuenta inventario por componente. Verificar
   compatibilidad con la app de suscripciones ya instalada.

En ambos casos el total es la suma de las piezas: el prototipo no aplica ningún
descuento propio.
