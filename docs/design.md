# Documento de Diseño — Panadería Efrata

| | |
|---|---|
| **Versión** | 1.3 (2026-10-27: auditoría del paso 7, D-069 a D-082; D-083 y D-084; mensaje de pedido sin líneas, D-110) |
| **Fecha** | 2026-10-26 |
| **Fuentes** | `docs/propuesta.md` · `CLAUDE.md` · `docs/requirements.md` v1.9 · `docs/data-contract.json` v1.2 · `docs/wireframe.md` v1.3 |

### Convenciones de este documento

- Cada decisión cita su origen (`D-xxx`, `INV-xx`, `REQ-F-xx`, `R#`).
- Las decisiones de este paso son **D-055 a D-066**, y las de la auditoría **D-069 a D-081** (§10). Todas están aprobadas por el autor.
- Los nombres de módulos, funciones y archivos van en inglés (R6) y usan el lenguaje ubicuo (`CLAUDE.md` §3).

---

## 1. Alcance y restricciones de diseño

| Restricción | Consecuencia en el diseño |
|---|---|
| R1 IndexedDB, sin backend | La base de datos vive en el navegador. Hay un repositorio por object store y la API de IndexedDB es asíncrona. |
| R2 Sin servicios externos | Sin CDN. Los SVG y las fuentes se guardan en el repositorio. |
| R3 Sin framework | Las vistas son funciones que construyen DOM. El estado es un store propio con suscriptores. |
| R4 Sin build | `index.html` carga `src/main.js` con `type="module"` y se sirve con Live Server. |
| R5 Verificación manual | La fecha simulada (D-057) permite probar casos que dependen del tiempo. |
| R7 Mobile-first | El CSS base es para celular; con `@media (min-width: 768px)` se pasa a menú lateral y columnas. |
| R8 Capas | Ver §2. |

---

## 2. Arquitectura general

### 2.1 Capas (R8)

```
┌──────────────────────────────────────────────────────────┐
│ UI            router, pantallas, componentes, SVG        │
│               (solo lee selectores y llama servicios)    │
├──────────────────────────────────────────────────────────┤
│ Estado        store en memoria + selectores derivados    │
├──────────────────────────────────────────────────────────┤
│ Aplicación    servicios: product, supply, production,    │
│               stockOut, stockCount, expense, sale,       │
│               order, report                              │
├──────────────────────────────────────────────────────────┤
│ Dominio       reglas puras: dinero, fechas, existencias, │
│               asignación de pedidos, validaciones        │
├──────────────────────────────────────────────────────────┤
│ Infraestructura  IndexedDB, repositorios, reloj, IDs     │
└──────────────────────────────────────────────────────────┘
```

**Regla de dependencias:**

- `ui → state`, `ui → application`.
- `application → domain`, `application → state` y los puertos (§2.2).
- `state → domain`.
- `infrastructure` implementa los puertos.
- `domain` no importa nada de otra capa: no usa `indexedDB`, el DOM, `new Date()` ni `crypto`.

### 2.2 Puertos (interfaces que usa la capa de aplicación)

| Puerto | Métodos | Implementación |
|---|---|---|
| `Repository<T>` (uno por entidad raíz) | `getAll()`, `getById(id)`, `add(entity, tx?)`, `put(entity, tx?)`, `delete(id, tx?)` — todos `async` | `IndexedDbRepository` |
| `TransactionRunner` | `run(storeNames, async (tx) => …)`: todo o nada (D-056) | `IndexedDbTransactionRunner` |
| `Clock` | `now()` → fecha y hora local; `today()` → `YYYY-MM-DD` | `SystemClock` con fecha simulada (D-057) |
| `IdGenerator` | `newId()` → UUID | `crypto.randomUUID()` |

- `StockCount` no tiene `put` sobre registros existentes ni `delete`, porque los conteos no se editan ni se eliminan (INV-23).
- `StockCount` se crea con `add`.

---

## 3. Arquitectura de la interfaz

### 3.1 Rutas (router por hash, D-055)

| Ruta | Pantalla | Wireframe |
|---|---|---|
| `#/orders` *(inicial, D-046)* · `#/orders?tab=delivered` · `#/orders?tab=cancelled` | `OrdersScreen` | §1 |
| `#/orders/new` · `#/orders/{id}` · `#/orders/{id}/edit` | `OrderForm` · `OrderDetail` | §2, §3 |
| `#/sales` · `#/sales/new` · `#/sales/{id}/edit` | `SalesScreen` · `SaleForm` (en ventas de pedido solo la fecha, D-072) | §4, §5 |
| `#/inventory/products` · `#/inventory/supplies` | `InventoryScreen` | §6, §7 |
| `#/inventory/products/{id}` · `#/inventory/supplies/{id}` | `ProductDetail` · `SupplyDetail` | §6, §7 |
| `#/inventory/products/{id}/edit` · `#/inventory/supplies/{id}/edit` | `ProductForm` · `SupplyForm` | §6, §7 |
| `#/inventory/production` · `#/inventory/production/{id}/edit` (D-097) · `#/inventory/stock-out` · `#/inventory/count` · `#/inventory/products/new` · `#/inventory/supplies/new` | Formularios de inventario | §8 |
| `#/expenses?category=…` · `#/expenses/new` · `#/expenses/{id}/edit` | `ExpensesScreen` · `ExpenseForm` | §9 |
| `#/report?period=day&date=…` · `#/report?period=month&month=…` | `ReportScreen` | §10 |

- Una ruta desconocida redirige a `#/orders`.
- El router escucha `hashchange`, así que Atrás, Adelante y recargar conservan la pantalla.

### 3.2 Árbol de componentes

```
App
├─ SimulatedDateBanner        (solo con fecha simulada, D-057)
├─ AppShell                   barra inferior (celular) / menú lateral (computadora)
│  ├─ AppHeader               espiga SVG + "Panadería Efrata" (D-014)
│  ├─ <pantalla activa>
│  └─ FabButton (+)           acción según la sección; oculto en Reporte (D-046)
└─ ConfirmDialog              confirmaciones de eliminar, desactivar y cancelar
```

### 3.3 Componentes compartidos

| Componente | Uso |
|---|---|
| `MoneyText` | Muestra céntimos como `₡1 250,50`; los negativos como `−₡13 000,50` (RNF-10, D-084). |
| `MoneyInput` · `QuantityInput` | Leen coma o punto según D-058 y entregan céntimos o cantidad. |
| `FieldError` | Mensaje rojo junto al campo (RC-04, REQ-F-20 a REQ-F-24, REQ-F-27 y REQ-F-28). |
| `ConfirmDialog` | Confirmación simple con texto (REQ-F-02, REQ-F-14, REQ-F-16). |
| `Tabs` · `Chips` | Pestañas de Pedidos e Inventario; filtro de Gastos. |
| `CollapsibleSection` | "Desactivados" (REQ-F-25). |
| `OrderCard` | Tarjeta con total, adelanto, saldo, "Faltan X" y "Atrasado". |
| `StockLine` | Existencia · Apartado · Disponible · "Faltan X por producir" en dorado si aplica (REQ-F-06, D-077). |
| `LineItemsEditor` | Líneas de venta o pedido con precio prellenado y editable (INV-13). |
| `EmptyState` | Ilustración SVG decorativa + texto + botón (D-014). Croissant en Pedidos y Ventas; pan en Inventario y Gastos (D-090). |
| `Icon` | SVG propios desde `assets/icons/` (R2). |

### 3.4 Comportamiento responsive (R7)

- **Menos de 768 px:** barra inferior de 5 secciones y botón flotante (+).
- **768 px o más:** menú lateral; el (+) pasa al encabezado de la sección y las tarjetas se acomodan en columnas.

---

## 4. Estructura de módulos (R8)

```
/
├── index.html                 carga src/main.js (type="module")
├── styles.css                 paleta "Horno cálido" como variables CSS (D-014)
├── CLAUDE.md · system_prompt.md · README.md
├── assets/
│   ├── illustrations/         wheat.svg, bread.svg, croissant.svg… (estados vacíos, encabezado)
│   └── icons/                 orders.svg, sales.svg, inventory.svg, expenses.svg, report.svg
├── docs/
└── src/
    ├── main.js                arranque: abre la BD, hidrata el store, inicia el router y el reloj
    ├── domain/
    │   ├── types.js           enumeraciones y etiquetas en español
    │   ├── money.js           parseMoney, formatMoney (céntimos)
    │   ├── quantity.js        parseQuantity (enteros o hasta 3 decimales)
    │   ├── dates.js           comparación de fechas y horas locales, rangos día y mes
    │   ├── stock.js           stockOnHand, reservedQuantity, availableToSell, supplyQuantity
    │   ├── orderAllocation.js asignación por plazo, entrega y createdAt (D-050, D-053, D-063)
    │   ├── totals.js          totales de venta y pedido, saldo
    │   ├── report.js          totalSold, totalExpenses, profit
    │   ├── validators.js      vacíos, > 0, duplicados, fechas, teléfono, adelanto
    │   └── messages.js        textos de error en español (D-035, D-052)
    ├── application/
    │   ├── productService.js · supplyService.js
    │   ├── productionService.js · stockOutService.js · stockCountService.js
    │   ├── expenseService.js · saleService.js · orderService.js
    │   └── reportService.js
    ├── infrastructure/
    │   ├── db.js              apertura de IndexedDB y esquema (§5.4)
    │   ├── repositories.js    IndexedDbRepository por store
    │   ├── transactionRunner.js
    │   ├── clock.js           SystemClock + fecha simulada (D-057)
    │   └── idGenerator.js
    ├── state/
    │   ├── store.js           getState, setState, subscribe
    │   └── selectors.js       valores derivados (usan solo el dominio)
    └── ui/
        ├── app.js · router.js · dom.js
        ├── components/        §3.3
        └── screens/           orders/, sales/, inventory/, expenses/, report/
```

**Convenciones de archivos (completan `system_prompt.md` §3):**

- Archivos en `camelCase.js`, con un módulo por responsabilidad.
- Solo exportaciones con nombre; no se usa `export default`.
- Las pantallas exportan `render{Nombre}Screen(container, params)`.

---

## 5. Manejo de estado y persistencia

### 5.1 Dónde vive cada dato

| Dato | Dónde | Motivo |
|---|---|---|
| Entidades (8 colecciones) | IndexedDB (fuente de verdad) + copia en el store | R1; la copia en memoria permite calcular rápido |
| Existencias, apartado, disponible, faltantes, cantidad de insumo, totales, reporte | Selectores (calculados) | D-036; nunca se guardan |
| Pestaña, filtro y formulario en edición | Store (solo memoria) | Estado de la UI |

### 5.2 Ciclo de escritura

```
UI (formulario) ──► servicio de aplicación
                     1. valida con domain/validators (con los datos del store)
                     2. si hay error → devuelve { errors } → la UI muestra FieldError; no se guarda nada
                     3. TransactionRunner.run([...stores], tx => repositorios.put/delete)
                     4. si la transacción confirma → actualiza el store → los suscriptores re-renderizan
                     5. si falla → mensaje "No se pudo guardar. Intenta de nuevo." y el store no cambia
```

- Las validaciones que dependen del inventario (por ejemplo, REQ-F-12 "Solo hay X") se calculan con el estado **incluyendo el cambio propuesto** antes de guardar.

### 5.3 Eventos de tiempo

| Evento | Acción |
|---|---|
| Arranque y `visibilitychange` (volver a la pestaña) | Re-renderizar: la fecha de hoy y "Atrasado" se recalculan con `Clock`. |
| Fecha simulada (D-057, D-079) | El reloj simulado **avanza** desde la hora indicada en la dirección; no queda fijo. |
| Cada 60 s con la app visible (D-062) | Re-renderizar Pedidos para que "Atrasado" aparezca a tiempo (REQ-F-26). |

### 5.4 Esquema de IndexedDB

- **Base de datos:** `panaderiaEfrata`, **versión 1**.
- Si en el futuro cambia el esquema, se sube la versión y se migra en `onupgradeneeded`; nunca se borran datos en silencio.

| Object store | `keyPath` | Índices |
|---|---|---|
| `products` | `id` | — |
| `supplies` | `id` | — |
| `productions` | `id` | `productId`, `date` |
| `stockOuts` | `id` | `productId`, `date` |
| `stockCounts` | `id` | `supplyId`, `countedAt` |
| `expenses` | `id` | `supplyId`, `date` |
| `sales` | `id` | `date`, `orderId` |
| `orders` | `id` | `status`, `deliveryDate` |

- No hay índice por nombre: los duplicados (REQ-F-22, D-034) se validan en el dominio con los datos del store (D-070).
- **Si IndexedDB no está disponible** (por ejemplo, navegación privada o permisos bloqueados), la app muestra "No se puede guardar información en este navegador" y no permite operar.

### 5.5 Transacciones todo o nada (D-056)

| Operación | Stores en la misma transacción |
|---|---|
| Entregar pedido (REQ-F-17) | `orders` + `sales` |
| Eliminar venta de un pedido (REQ-F-14) | `sales` + `orders` |
| Registrar producción de varios productos (wireframe §8) | `productions` |
| Desactivar o eliminar producto o insumo (REQ-F-02) | El store de la entidad |

---

## 6. Reglas de cálculo del dominio

| Valor | Fórmula | Origen |
|---|---|---|
| `stockOnHand(p)` | Σ `Production.quantity` − Σ `SaleItem.quantity` − Σ `StockOut.quantity` del producto | D-036 |
| `reservedQuantity(p)` | Σ cantidades de `p` en `Order` `PENDING` | INV-14 |
| `availableToSell(p)` | `max(0, stockOnHand − reservedQuantity)` | D-051 |
| `missingToProduce(order, p)` | Ver algoritmo de asignación | D-050, D-053, D-063 |
| `supplyQuantity(s)` | En milésimas enteras. Sin conteos: Σ compras. Con conteos: `newQuantity` del último conteo + Σ compras cuyo `date`+`time` (al minuto) es **estrictamente posterior** al minuto de `countedAt` | D-037, D-041, D-075 |
| Faltante por producto (Inventario) | `max(0, reservedQuantity − stockOnHand)` | D-077 |
| Total de venta | Σ `quantity × unitPrice` de `items` y `customItems` | `data-contract` |
| Total y saldo de pedido | Total = Σ líneas; saldo = total − (`advanceAmount` ?? 0) | D-043 |
| Reporte | `totalSold` = Σ totales de ventas con fecha en el período · `totalExpenses` = Σ `Expense.amount` en el período, separado por categoría · `profit` = `totalSold − totalExpenses` | INV-19 |

**Algoritmo de asignación (D-050, D-053, D-063):**

```
GRACE ← 2 horas
entrada: now (lo pasa la capa de aplicación desde Clock; el dominio no lee el reloj)
enPlazo(pedido) ← now < deliveryDate+deliveryTime + GRACE
para cada producto p:
  pedidos ← Orders PENDING que contienen p, ordenados por
            (enPlazo primero, deliveryDate, deliveryTime, createdAt)
  restante ← max(0, stockOnHand(p))
  para cada pedido en pedidos:
    cubierto ← min(restante, cantidad de p en pedido)
    faltante[pedido][p] ← cantidad − cubierto
    restante ← restante − cubierto
```

Ejemplo con 13 panes:

| Momento | María (sáb 15:00, 10) | Luis (dom 09:00, 6) |
|---|---|---|
| Sábado 14:00 | Cubierto 10 | Cubierto 3, faltan 3 (no se puede entregar) |
| Sábado 16:00 (Atrasado, dentro del margen) | Cubierto 10 · ⚠ Atrasado | Faltan 3 |
| Sábado 17:01 (margen vencido, sin reprogramar) | Faltan 3 · ⚠ Atrasado | Cubierto 6 (se puede entregar) |

- La etiqueta "Atrasado" aparece al pasar la hora de entrega; la prioridad se pierde 2 horas después (D-065).
- Si el cliente avisa que se atrasa, el dueño reprograma la entrega y la prioridad se recalcula (D-064).

**Validaciones de inventario negativo (INV-01):**

- **Venta y salida:** la cantidad debe ser ≤ `availableToSell`. Si una línea no alcanza, no se guarda nada (D-031). Al editar una venta se compara el aumento neto (REQ-F-13, INV-23). Los productos repetidos se suman en una línea antes de validar (D-069).
- **Validación sobre el total, no en el tiempo (D-080):** una venta con fecha anterior a su producción es válida si el total alcanza.
- **Desactivar o eliminar producto:** se bloquea si está en pedidos `PENDING` (D-074).
- **Entregar pedido:** el pedido no debe tener faltantes según la asignación (D-063, reemplaza D-032).
- **Editar o eliminar producción:** el nuevo `stockOnHand` debe ser ≥ 0.
- **Insumos:** la cantidad nunca baja de 0, porque solo las compras suman y el conteo admite 0. REQ-F-11 conserva la verificación por seguridad.

---

## 7. Flujos principales

### 7.1 Registrar venta (REQ-F-12)

```
SaleForm → saleService.create({date, items})
  validar: fecha ≤ hoy (REQ-F-23) · al menos una línea · cantidades enteras > 0 · precios > 0
  para cada línea: quantity ≤ availableToSell(producto) ; si no → "Solo hay X disponibles de {producto}"
  ¿errores? → devolverlos, no guardar (D-031)
  tx(sales): put(sale) → store → Ventas, Inventario y Reporte se actualizan
```

### 7.2 Entregar pedido (REQ-F-17)

```
OrderDetail (Entregar) → orderService.deliver(orderId)
  para cada línea de catálogo: missingToProduce(order, producto) = 0 ;
    si no → "Faltan X {producto} por producir para este pedido", sigue PENDING (D-063, D-066)
  sale ← { id, date: clock.today() (D-029), items: líneas de catálogo, customItems, orderId }
  tx(orders, sales): put(sale) · put(order con status DELIVERED, saleId y closedAt = now) (D-071)
  → lo apartado se libera solo, porque el pedido ya no está PENDING
```

### 7.3 Eliminar venta (REQ-F-14)

```
ConfirmDialog ("El pedido de {cliente} volverá a Pendiente" si sale.orderId)
  tx(sales[, orders]): delete(sale) · [put(order con status PENDING, saleId null y closedAt null)]
  → las unidades vuelven, porque la existencia se calcula; el pedido vuelve a apartar
```

### 7.4 Gasto de Insumos y conteo físico (REQ-F-09, REQ-F-08)

```
ExpenseForm (SUPPLIES) → expenseService.create({category, description, supplyId, quantity, amount, date, time})
  → la cantidad del insumo sube solo si el minuto de date+time es estrictamente posterior al minuto de countedAt del último conteo (D-037, D-075)
StockCount → stockCountService.create({supplyId, newQuantity})
  → countedAt = Clock.now() (en la capa de aplicación) · previousQuantity = supplyQuantity(s) en ese momento
```

---

## 8. Validación y casos de borde (RC-04)

| Caso | Regla | Mensaje |
|---|---|---|
| Vacío o solo espacios | REQ-F-20 | "Este campo es obligatorio" |
| Monto, precio o cantidad ≤ 0 | REQ-F-21 | "Solo se admiten valores mayores a 0" |
| Conteo negativo | REQ-F-21 | "La cantidad no puede ser negativa" |
| Duplicado de nombre | REQ-F-22 | "Ya existe un producto con ese nombre" / "…insumo…" |
| Inventario insuficiente | REQ-F-05, 12, 13 | "Solo hay X disponibles de {producto}" |
| Editar o eliminar producción | REQ-F-04 | "Solo hay X de {producto} en existencia" |
| Insumo negativo (defensiva, no se dispara) | REQ-F-11 | "Solo hay X {unidad} de {insumo}" |
| Producto en pedidos pendientes | REQ-F-02 | "{producto} está en pedidos pendientes" |
| Producción sin cantidades | REQ-F-03 | "Ingresa al menos una cantidad" |
| Venta sin productos | REQ-F-12 | "Agrega al menos un producto" (D-106) |
| Pedido sin líneas | REQ-F-15 | "Agrega al menos un producto" (D-110) |
| Cambiar la unidad de un insumo con historial | REQ-F-07 | "La unidad no se puede cambiar porque el insumo ya tiene compras o conteos" (D-102) |
| Entregar pedido con faltantes | REQ-F-17 | "Faltan X {producto} por producir para este pedido" |
| Fecha futura / entrega pasada | REQ-F-23 | "La fecha no puede ser futura" / "La entrega no puede estar en el pasado" |
| Teléfono | REQ-F-24 | "El teléfono debe tener 8 dígitos" |
| Adelanto mayor al total | REQ-F-27 | "El adelanto no puede superar el total del pedido" |
| Número mal escrito: letras, más de un separador o separador de miles | REQ-F-28 | "Escribe un número válido, por ejemplo 1250,50" |
| Más decimales de los permitidos: 2 en montos, 3 en insumos | REQ-F-28 | "Usa máximo {n} decimales" |
| Decimales en la cantidad de un producto | REQ-F-28 | "Escribe un número entero" (D-083) |

**Lectura de números (D-058):**

- Se acepta **un** separador decimal, coma o punto: `1250,50` = `1250.50` = ₡1 250,50.
- **No** se aceptan separadores de miles: `1.250` en un monto tiene 3 decimales y se rechaza. Así se evita leer ₡1,25 por error.

**Unchanged Behavior en la UI:** si un guardado falla por validación, el formulario conserva todo lo ingresado y no cambia ningún dato guardado.

---

## 9. Trazabilidad: requerimientos → diseño

| REQ | Dominio | Aplicación | UI |
|---|---|---|---|
| REQ-F-01 | `validators` | `productService.save` | `ProductForm` |
| REQ-F-02 | `validators` (tiene historial) | `productService` / `supplyService.removeOrDeactivate` | `ConfirmDialog` |
| REQ-F-03 / 04 | `stock` | `productionService` | Formulario Producción |
| REQ-F-05 | `stock` | `stockOutService` (registrar y eliminar, D-098) | Formulario Salida · historial del producto |
| REQ-F-06 | `stock` | — | `StockLine`, `InventoryScreen` |
| REQ-F-07 | `validators` | `supplyService.save` | `SupplyForm` |
| REQ-F-08 | `stock` | `stockCountService` | Formulario Conteo |
| REQ-F-09 / 10 / 11 | `stock`, `validators` | `expenseService` | `ExpenseForm`, `ExpensesScreen` |
| REQ-F-12 / 13 / 14 | `stock`, `totals` | `saleService` | `SaleForm`, `SalesScreen` |
| REQ-F-15 / 16 | `orderAllocation`, `totals` | `orderService.create/update/delete` | `OrderForm`, `OrderCard` |
| REQ-F-17 / 18 | `stock` | `orderService.deliver/cancel` | `OrderDetail` |
| REQ-F-19 | `report` | `reportService` | `ReportScreen` |
| REQ-F-20 a 24, 27, 28 | `validators`, `money`, `quantity`, `messages` | todos los servicios | `FieldError` |
| REQ-F-25 | — | `productService` / `supplyService.reactivate` | `CollapsibleSection` |
| REQ-F-26 | `dates`, `orderAllocation` (margen) | — | `OrderCard` + temporizador (§5.3) |
| RNF-01 a 10 | §1, §2, §4, §5.4 | | |

---

## 10. Decisiones de este paso (registradas en `CLAUDE.md`)

| ID | Decisión |
|---|---|
| D-055 | Router por hash con las rutas de §3.1 |
| D-056 | Operaciones que tocan varios stores en una sola transacción de IndexedDB (todo o nada) |
| D-057 | Fecha simulada `?today=YYYY-MM-DD&time=HH:MM` con aviso "Fecha simulada · Volver a la fecha real" |
| D-058 | Números: coma o punto como separador decimal; sin separadores de miles; máximo de decimales por tipo; mensajes de §8 |
| D-059 | Store en memoria hidratado desde IndexedDB al arrancar; selectores para todo lo derivado |
| D-060 | Esquema IndexedDB `panaderiaEfrata` v1 con los stores e índices de §5.4 |
| D-061 | Estructura de carpetas y convenciones de archivos de §4 |
| D-062 | Re-render cada 60 s con la app visible para "Atrasado" |
| D-063 | Prioridad de pedidos con margen de 2 horas; entregar solo sin faltantes (reemplaza D-032) |
| D-064 | Si el cliente avisa un atraso, se reprograma la entrega editando el pedido |
| D-065 | "Atrasado" aparece al pasar la hora; la prioridad se pierde 2 horas después |
| D-066 | Mensaje al entregar con faltantes: "Faltan X {producto} por producir para este pedido" |
| D-069 | Productos repetidos en una venta se suman en una línea |
| D-070 | Sin índice `nameKey`; duplicados validados en el dominio |
| D-071 | Pedidos entregados o cancelados de solo lectura; `Order.closedAt` |
| D-072 | Venta de pedido: solo se edita la fecha |
| D-073 | "Entrega hoy o futura" solo al crear o cambiar la entrega |
| D-074 | No desactivar ni eliminar productos con pedidos pendientes |
| D-075 | Insumos en milésimas enteras; compra posterior al conteo al minuto y estricta |
| D-076 | "Ingresa al menos una cantidad"; nota de cancelación opcional |
| D-077 | Faltante por producto en Inventario |
| D-078 | REQ-F-27 y REQ-F-28; descripción obligatoria del gasto |
| D-079 | La fecha simulada avanza |
| D-080 | Existencia validada sobre el total |
| D-081 | Correcciones editoriales de la auditoría |
| D-082 | "La entrega no puede estar en el pasado" |
| D-083 | "Escribe un número entero" para cantidades de producto |
| D-084 | Montos negativos: "−₡13 000,50" |
| D-097 | Ruta para editar producción |
| D-098 | Las salidas se pueden eliminar |
| D-102 | Unidad del insumo bloqueada con historial |
| D-106 | Venta sin productos bloqueada |

## 11. Pendientes

Ninguno.
