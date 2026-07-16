# Plan de Crecimiento — Columpio Kids

Sistema de gestión integral para tienda física + Uber Eats, dimensionado para un
promedio de 10 ventas diarias, usable desde el navegador y empaquetable como APK.

---

## 1. Estado actual (julio 2026)

| Área | Estado |
|---|---|
| Stack | Next.js 16, React 19, TypeScript, Tailwind 4, Supabase |
| Módulo Uber Eats | ✅ Funcional: catálogo, tiendas, exportación Excel |
| Creación/edición de productos | ✅ Existe (modal en pestaña Catálogo) — se mantiene |
| Base de datos | ⚠️ La app apunta al Supabase de **olivoWeb** (otro negocio) |
| BD propia | ⚠️ Proyecto Supabase `columpio-kids` creado pero **vacío** (migración pendiente) |
| Autenticación | ❌ No existe; políticas RLS abiertas ("allow all") |
| POS / ventas / inventario / proveedores | ❌ No existen aún en esta app |

**Ventaja estratégica:** el esquema de olivoWeb ya modela ventas (`sales`,
`sale_items`, `sale_payments`), inventario (`inventory_movements`, `branch_stock`),
proveedores (`suppliers`, `supplier_orders`, `product_batches`) y turnos de caja
(`cash_shifts`). Ese diseño está probado y se puede replicar en la BD propia de
Columpio Kids sin arrastrar datos ajenos.

---

## 2. Arquitectura objetivo

Una sola aplicación Next.js (PWA) con módulos por pestaña/ruta:

```
/admin
 ├── Catálogo      → CRUD de productos (hasta 300, con imagen)
 ├── POS           → venta táctil, carrito, boleta imprimible
 ├── Ventas        → historial, detalle, anulaciones
 ├── Inventario    → stock, movimientos, alertas de reposición
 ├── Proveedores   → fichas, lead time, órdenes de compra, recepción
 ├── Reportes      → ventas del día/mes, top productos, margen
 └── Uber Eats     → (ya existe) catálogo + exportación
```

- **Backend:** Supabase (Postgres + Auth + Storage + RPC)
- **Frontend:** Next.js desplegado en Vercel, instalable como PWA
- **APK:** TWA (Bubblewrap) envolviendo la PWA — mismo código, un solo mantenimiento

---

## 3. Fases

### Fase 0 — Fundaciones (≈1 semana) · CRÍTICA
1. Aplicar migraciones al proyecto Supabase propio (`columpio-kids`) con el esquema:
   `products`, `categories`, `sales`, `sale_items`, `sale_payments`,
   `inventory_movements`, `suppliers`, `supplier_orders`, `supplier_order_items`,
   `uber_eats_products`, `uber_eats_stores`, `settings`.
2. Actualizar `.env` para apuntar a la BD propia (corta el enlace con olivoWeb).
3. **Supabase Auth** (email + contraseña para el dueño/vendedores) y RLS real:
   lectura pública solo donde corresponda, escritura solo autenticados.
4. Función RPC transaccional `registrar_venta(items, pago)` que inserta la venta
   y descuenta stock en una sola transacción (evita stock negativo o doble descuento).

### Fase 1 — Catálogo ampliado a 300 productos (≈1-2 semanas)
- Subida de imágenes a **Supabase Storage** con compresión en el cliente
  (WebP ~150-200 KB → 300 productos ≈ 60 MB, el plan gratis da 1 GB).
- Campos: código de barras, categoría, precio compra, precio venta, stock,
  umbral de reposición, proveedor preferente.
- Importación CSV para carga masiva inicial.
- La edición de productos existente se conserva y se amplía.

### Fase 2 — POS + Boleta (≈2-3 semanas)
- Pantalla de venta táctil: grilla de productos con foto, búsqueda, y lector de
  código de barras (un lector USB funciona como teclado en el navegador; como
  alternativa, escaneo por cámara del teléfono).
- Carrito con cantidades, descuentos, método de pago (efectivo con cálculo de
  vuelto, tarjeta, transferencia).
- Registro de venta vía RPC transaccional → descuenta inventario al instante.
- **Boleta imprimible:** plantilla con CSS `@media print` para papel térmico de
  80 mm (logo, ítems, total, método de pago) usando `window.print()`.
- Historial de ventas con reimpresión y anulación (repone stock).

### Fase 3 — Inventario y reabastecimiento (≈2 semanas)
- Kardex de movimientos IN/OUT con motivo (venta, recepción, merma, ajuste).
- Alertas: productos bajo el umbral → lista de sugerencia de compra agrupada
  por proveedor.
- Proveedores: contacto, días de despacho, **tiempo de entrega (lead time)**,
  monto mínimo de pedido.
- Órdenes de compra con estados (pendiente → enviada → recibida); la recepción
  actualiza stock automáticamente y registra fecha real vs esperada.

### Fase 4 — Distribución: PWA + APK (≈1-2 semanas)
1. **PWA primero:** manifest + service worker → instalable en Android y escritorio
   directamente desde Chrome ("Agregar a pantalla de inicio"). Cubre el
   requerimiento sin pasar por Play Store.
2. **APK real (opcional):** empaquetar la PWA con Bubblewrap (TWA). Publicable
   en Play Store si se desea.
3. Reportes básicos: ventas por día/semana/mes, top 10 productos, margen bruto.

**Tiempo total estimado: 7-10 semanas** a ritmo parcial.

---

## 4. Análisis de capacidad — 10 ventas diarias

| Métrica | Volumen | Límite plan gratis | Holgura |
|---|---|---|---|
| Ventas | ~300/mes, ~3.600/año | — | Postgres maneja millones de filas |
| Ítems vendidos | ~900-1.500 filas/mes | 500 MB de BD | ~2 MB/año de datos ≈ décadas |
| Imágenes | 300 × ~200 KB ≈ 60 MB | 1 GB Storage | 16× |
| Usuarios | 1-3 (dueño + vendedores) | 50.000 MAU | irrelevante |
| Tráfico | decenas de peticiones/día | 5 GB egress/mes | enorme |

**Veredicto:** la infraestructura gratuita soporta este negocio con margen para
crecer 50-100× sin cambiar nada. Costo esperado: **$0/mes** (o ~$20/mes si se
formaliza Vercel Pro, ver cabo suelto #7).

---

## 5. Cabos sueltos y riesgos

1. **Decisión de BD sin cerrar (bloqueante).** El proyecto `columpio-kids` en
   Supabase existe pero está vacío y la app sigue apuntando a olivoWeb. Hasta no
   migrar, cualquier dato nuevo queda mezclado con el otro negocio.
2. **Seguridad (bloqueante para el POS).** Sin login y con RLS "allow all",
   cualquiera que obtenga la anon key puede leer/modificar ventas y precios.
   Resolver en Fase 0, antes de registrar ventas reales.
3. **Boleta tributaria (legal, Chile).** Una boleta impresa desde el navegador es
   un *ticket de cortesía*; no reemplaza la **boleta electrónica del SII**. Si se
   requiere emitir documentos tributarios: integrar un proveedor DTE
   (OpenFactura, LibreDTE, Facto; ~$10-25k CLP/mes) o emitir por el portal del
   SII en paralelo. Decisión del negocio, no técnica.
4. **Impresión desde APK.** `window.print()` es fiable en Chrome/PWA pero
   irregular dentro de una TWA/WebView. Mitigaciones: usar la PWA en Chrome para
   imprimir, app Android RawBT (recibe el ticket y lo manda a impresora térmica
   Bluetooth/USB por ESC/POS), o Web Bluetooth directo. Definir el hardware de
   impresión antes de la Fase 4.
5. **Dependencia `xlsx` (SheetJS).** La versión publicada en npm está desactualizada
   y tiene CVEs conocidos. Al ser uso interno el riesgo es bajo, pero conviene
   migrar a `exceljs` o instalar SheetJS desde su CDN oficial.
6. **Carreras de stock.** Dos dispositivos vendiendo a la vez no deben descontar
   stock desde el cliente; toda venta pasa por la RPC transaccional (Fase 0.4).
7. **Vercel Hobby y uso comercial.** Los términos del plan gratuito excluyen uso
   comercial; formalizarlo son ~US$20/mes, o desplegar en alternativa (Cloudflare,
   VPS). Riesgo bajo, anotado.
8. **Respaldos.** El plan gratis de Supabase no incluye point-in-time recovery.
   Programar exportación semanal (pg_dump o CSV automático) de ventas y productos.
9. **Rutas públicas vs. admin.** Hoy `/` redirige al panel. Si a futuro habrá web
   de clientes (catálogo público), separar `/admin/*` con middleware de auth.
10. **Modo offline del POS.** Si se corta internet no se puede vender. Para 10
    ventas/día el riesgo es tolerable al inicio; a futuro: cola local en
    IndexedDB con sincronización. Anotado como mejora, no bloqueante.

---

## 6. Orden recomendado de ejecución

```
Fase 0 (BD propia + auth + RPC)  ──►  bloquea todo lo demás
Fase 1 (catálogo 300 + imágenes) ──►  requiere Fase 0
Fase 2 (POS + boleta)            ──►  requiere Fases 0-1
Fase 3 (inventario/proveedores)  ──►  puede solaparse con Fase 2
Fase 4 (PWA/APK + reportes)      ──►  al final, sobre app estable
```
