# Plan de implementación — Panadería Efrata

| | |
|---|---|
| **Versión** | 0.1 (borrador para aprobación) |
| **Fecha** | 2026-10-26 |
| **Fuentes** | `docs/requirements.md` v1.5 · `docs/design.md` v1.1 · `docs/data-contract.json` v1.2 · `docs/wireframe.md` v1.2 · `CLAUDE.md` · `system_prompt.md` |
| **Verificación** | Manual, sin pruebas automatizadas (R5). Cada fase termina con su lista de verificación. |
| **Ejecución** | Módulos ES nativos y Live Server, sin build (R4) |

### Convenciones

- Cada tarea cita el requerimiento (REQ-F-xx), la regla (INV-xx) o la decisión (D-xxx) que implementa.
- **Orden:** primero la base (fases 0 a 4); después cortes verticales, cada uno con servicio, pantalla y verificación.
- **Validaciones (REQ-F-20 a REQ-F-23 y REQ-F-28):** cada formulario las incluye en su propia fase; la Fase 11 las recorre todas.
- **Regla de comportamiento sin cambios (*Unchanged Behavior*):**
  - Desde la Fase 1, cada fase lista en **Comportamiento sin cambios** lo que debe seguir igual.
  - Antes de cerrar una fase se repite la verificación de las fases anteriores afectadas (regresión manual).
  - Si una tarea necesita cambiar un comportamiento existente, no se hace en silencio: primero se registra la decisión en `CLAUDE.md` §9 y se actualiza la especificación (`system_prompt.md` §4).
- **Una fase a la vez:** no se pasa a la siguiente sin la aprobación del autor.
- **Fecha simulada (D-057, D-079):** las verificaciones usan `?today=AAAA-MM-DD&time=HH:MM` antes del `#`, por ejemplo `http://127.0.0.1:5500/index.html?today=2026-11-02&time=10:00#/orders`. El reloj avanza desde esa hora.
- **Datos de verificación:** la app empieza vacía. Los datos se crean en la propia app durante las fases 5 a 9 y se reutilizan en las siguientes. Son los mismos de `docs/wireframe.md`, así que los resultados esperados coinciden.

---

## Fase 0 — Esqueleto del proyecto

- [ ] **T-0.1** Crear `index.html`, que carga `src/main.js` con `type="module"` (R4).
- [ ] **T-0.2** Crear las carpetas de design §4: `src/{domain,application,infrastructure,state,ui/{components,screens}}` y `assets/{illustrations,icons}`.
- [ ] **T-0.3** Crear `styles.css` mobile-first con la paleta "Horno cálido" como variables CSS (`#FBF5EC`, `#6B4226`, `#D4A24C`), títulos serif y tarjetas redondeadas (D-014, R7).
- [ ] **T-0.4** Dibujar los SVG propios con la paleta:
  - Ilustraciones: espiga (encabezado), pan y croissant (estados vacíos).
  - Íconos: pedidos, ventas, inventario, gastos y reporte (D-014, R2).

**Verificación:** Live Server abre la página, la consola no muestra errores y los SVG se ven en la paleta correcta.

---

## Fase 1 — Dominio puro (`src/domain/`)

El dominio no usa el DOM, IndexedDB, `new Date()` ni `crypto`; recibe `now` o `today` como parámetro (design §2.1).

- [ ] **T-1.1** `types.js`: enumeraciones `ExpenseCategory`, `OrderStatus`, `StockOutReason` y `SupplyUnit`, con sus etiquetas en español (`CLAUDE.md` §3.3).
- [ ] **T-1.2** `money.js`: `parseMoney(text)` y `formatMoney(cents)` (D-025, D-058).
  - Acepta coma o punto como separador decimal.
  - No acepta separadores de miles.
  - Máximo 2 decimales.
- [ ] **T-1.3** `quantity.js`: `parseProductQuantity` (enteros) y `parseSupplyQuantity` (hasta 3 decimales, guardada en milésimas) (D-038, D-075).
- [ ] **T-1.4** `dates.js`: comparación de fechas y horas locales, rango de día y de mes, y "posterior al minuto" (D-075).
  - ⚠️ `new Date("2026-11-07")` se interpreta como UTC y en Costa Rica (UTC-6) da el día anterior. Usar siempre `new Date(y, m − 1, d)`.
- [ ] **T-1.5** `stock.js`: `stockOnHand`, `reservedQuantity`, `availableToSell` (mínimo 0), faltante por producto y `supplyQuantity(s, now)` (design §6).
- [ ] **T-1.6** `orderAllocation.js`: asignación por plazo (hora de entrega + 2 h), entrega y `createdAt` (D-050, D-053, D-063).
- [ ] **T-1.7** `totals.js`: totales de venta y de pedido, y saldo del pedido. `report.js`: `totalSold`, `totalExpenses` por categoría y `profit` (INV-19).
- [ ] **T-1.8** `validators.js`:
  - Vacíos.
  - Valores > 0 (el conteo físico admite 0).
  - Duplicados sin distinguir mayúsculas ni espacios extra.
  - Líneas repetidas.
  - Fechas.
  - Teléfono de 8 dígitos.
  - Adelanto ≤ total.
  - Producto en pedidos pendientes (REQ-F-20 a REQ-F-24, REQ-F-27, D-074).
- [ ] **T-1.9** `messages.js`: todos los textos de error de design §8, en español.

**Comportamiento sin cambios:**

- La página sigue abriendo sin errores (Fase 0).
- El dominio no importa nada de otras capas.

**Verificación (consola del navegador):**

| Caso | Esperado |
|---|---|
| `parseMoney("1250,50")` y `parseMoney("1250.50")` | 125050 |
| `parseMoney("1.250")` | Error "Usa máximo 2 decimales" |
| `parseMoney("12a")` · `parseMoney("1,2,3")` | Error "Escribe un número válido, por ejemplo 1250,50" |
| `formatMoney(125050)` | `₡1 250,50` |
| `parseSupplyQuantity("2,5")` | 2500 |
| `parseSupplyQuantity("2,3755")` | Error "Usa máximo 3 decimales" |
| `parseProductQuantity("1,5")` | Error "Usa máximo 0 decimales" ❓ ver nota |
| Pan casero: producción 20, salida 2, venta 5 | `stockOnHand` = 13 |
| Harina: conteo 3500 el 1 nov 18:00 + compra 2000 el 2 nov 09:30 | 5500 (5,5 kg) |
| La misma compra fechada el 1 nov a las 17:00 o a las 18:00 | 3500 (no suma; D-037, D-075) |
| Asignación con 13 panes: María 10 (sáb 7 nov 15:00) y Luis 6 (dom 8 nov 09:00); `now` = sáb 14:00 | María: faltan 0 · Luis: faltan 3 |
| Lo mismo con `now` = sáb 16:00 | María: faltan 0 (atrasada, dentro del margen) · Luis: faltan 3 |
| Lo mismo con `now` = sáb 17:01 | María: faltan 3 · Luis: faltan 0 |
| `"8888-0000"` · `"88880000"` · `"8888-000"` | válido · válido · Error "El teléfono debe tener 8 dígitos" |

> **Nota ❓:** para cantidades de producto, el mensaje de REQ-F-28 con n = 0 queda "Usa máximo 0 decimales". Se confirma con el autor al revisar este plan.

---

## Fase 2 — Infraestructura (`src/infrastructure/`)

- [ ] **T-2.1** `db.js`: abrir `panaderiaEfrata` versión 1 y crear las 8 tablas con sus índices en `onupgradeneeded` (design §5.4, D-060).
  - Si IndexedDB no está disponible: "No se puede guardar información en este navegador".
- [ ] **T-2.2** `repositories.js`: `IndexedDbRepository` con `getAll`, `getById`, `add`, `put` y `delete`, todos asíncronos. `stockCounts` no expone `put` ni `delete` (INV-23).
- [ ] **T-2.3** `transactionRunner.js`: `run(storeNames, fn)` en una sola transacción, todo o nada (D-056).
- [ ] **T-2.4** `clock.js`: `SystemClock` con `now()` y `today()` en hora local.
  - Admite la fecha simulada `?today=…&time=…`, que avanza desde la hora indicada (D-057, D-079).
  - Es el único archivo que usa `new Date()` sin argumentos.
- [ ] **T-2.5** `idGenerator.js`: `crypto.randomUUID()`.

**Comportamiento sin cambios:**

- Las funciones del dominio (Fase 1) conservan sus firmas y resultados.
- Abrir la app no borra ni reescribe datos que ya estén en IndexedDB.

**Verificación:**

- DevTools → Application → IndexedDB muestra `panaderiaEfrata` con las 8 tablas.
- Una transacción forzada a fallar no guarda nada en ninguna tabla.
- Con `?today=2026-11-07&time=14:59`, `clock.now()` devuelve 14:59 y un minuto después devuelve 15:00.

---

## Fase 3 — Estado (`src/state/`)

- [ ] **T-3.1** `store.js`: `getState`, `setState` y `subscribe`; se hidrata desde IndexedDB al arrancar (D-059).
- [ ] **T-3.2** `selectors.js`: valores derivados (existencias, apartado, faltantes, totales, reporte) que usan solo funciones del dominio. Nunca se guardan (D-036).

**Comportamiento sin cambios:**

- Leer entidades al store no las modifica en IndexedDB.
- Ningún valor derivado se guarda.

**Verificación:** cambiar el store desde la consola dispara los suscriptores, y los selectores devuelven los mismos valores que la Fase 1.

---

## Fase 4 — UI base (`src/ui/`)

- [ ] **T-4.1** `router.js`: router por hash con las rutas de design §3.1 (D-055). Una ruta desconocida lleva a `#/orders`.
- [ ] **T-4.2** `AppShell` (D-046, R7):
  - **Celular:** barra inferior con Pedidos, Ventas, Inventario, Gastos y Reporte.
  - **768 px o más:** menú lateral.
  - **Encabezado:** espiga y "Panadería Efrata".
- [ ] **T-4.3** `FabButton` (+) según la sección; oculto en Reporte (D-046).
- [ ] **T-4.4** Componentes compartidos (design §3.3): `MoneyText`, `MoneyInput`, `QuantityInput`, `FieldError`, `ConfirmDialog`, `Tabs`, `Chips`, `CollapsibleSection`, `EmptyState` e `Icon`.
- [ ] **T-4.5** `SimulatedDateBanner`: "Fecha simulada: … · Volver a la fecha real" (D-057).

**Comportamiento sin cambios:**

- Dominio, repositorios y store (fases 1 a 3) no cambian; la UI solo lee selectores y llama servicios.

**Verificación:**

- La app abre en Pedidos.
- Navegar por las 5 secciones funciona, y Atrás, Adelante y recargar conservan la pantalla.
- Al ensanchar la ventana aparece el menú lateral.
- El (+) no aparece en Reporte.
- Con `?today=` aparece el aviso amarillo, y "Volver a la fecha real" lo quita.

---

## Fase 5 — Catálogo e inventario de productos

Fecha simulada: `?today=2026-11-02&time=10:00`.

- [ ] **T-5.1** `productService`: crear y editar (REQ-F-01); eliminar o desactivar (REQ-F-02, D-074); reactivar (REQ-F-25).
- [ ] **T-5.2** `productionService`: registrar con el formulario de varios productos ("Ingresa al menos una cantidad"), editar y eliminar sin dejar la existencia negativa (REQ-F-03, REQ-F-04, D-076).
- [ ] **T-5.3** `stockOutService`: salida con motivo, sin superar lo disponible (REQ-F-05).
- [ ] **T-5.4** `InventoryScreen`, pestaña Productos (REQ-F-06, D-077):
  - `StockLine`: existencia, apartado, disponible y "Faltan X" en dorado.
  - Sección "Desactivados".
  - Detalle con historial.
  - Menú (+).

**Cubre:** REQ-F-01 a REQ-F-06, REQ-F-25 (productos), REQ-F-20 a REQ-F-23 y REQ-F-28 en sus formularios.

**Comportamiento sin cambios:**

- Las fases 0 a 4 funcionan igual.
- Registrar producción o salidas no modifica el catálogo.

**Verificación:**

| Acción | Esperado |
|---|---|
| Crear "Pan casero" a ₡1 500,00 | Aparece con existencia 0 |
| Crear "pan casero " | "Ya existe un producto con ese nombre" |
| Precio 0 · nombre vacío | "Solo se admiten valores mayores a 0" · "Este campo es obligatorio" |
| Producción con todas las casillas vacías | "Ingresa al menos una cantidad" |
| Producción de 20 el 2 nov | Existencia 20 |
| Producción con fecha 3 nov | "La fecha no puede ser futura" |
| Salida de 2, Regalado | Existencia 18; no aparece como venta |
| Salida de 30 | "Solo hay 18 disponibles de Pan casero" |
| Editar la producción de 20 a 1 | "Solo hay 18 de Pan casero en existencia"; no cambia nada |
| Eliminar "Pan casero" (tiene historial) | Se desactiva y aparece en "Desactivados"; Reactivar lo devuelve |

---

## Fase 6 — Insumos y gastos

- [ ] **T-6.1** `supplyService`: crear y editar con unidad de lista fija (REQ-F-07, D-039); eliminar o desactivar (REQ-F-02); reactivar (REQ-F-25).
- [ ] **T-6.2** `stockCountService`: conteo con `countedAt` y la cantidad anterior; admite 0; no se edita ni se elimina (REQ-F-08, D-024).
- [ ] **T-6.3** `expenseService` (REQ-F-09 a REQ-F-11, D-040, D-041, D-075):
  - Insumos: descripción, insumo, cantidad, monto, fecha y hora (por defecto la actual).
  - Servicios: descripción y monto.
  - Editar y eliminar.
- [ ] **T-6.4** Pestaña Insumos de `InventoryScreen` y `ExpensesScreen`, con chips y agrupación por día (D-047).

**Cubre:** REQ-F-02 y REQ-F-25 (insumos), REQ-F-07 a REQ-F-11.

**Comportamiento sin cambios:**

- La pestaña Productos y sus existencias (Fase 5) no cambian al registrar insumos o gastos.
- Los gastos de Servicios no afectan ningún inventario (INV-08).

**Verificación:**

| Acción (fecha simulada) | Esperado |
|---|---|
| Crear "Harina" en kg | Aparece con 0 kg y "Sin conteos" |
| `?today=2026-11-01&time=18:00` · conteo 3,5 | Harina 3,5 kg; historial: anterior 0, nuevo 3,5 |
| Conteo −1 | "La cantidad no puede ser negativa" |
| `?today=2026-11-02&time=09:30` · gasto de Insumos "Compra de harina", 2 kg, ₡2 000,00 | Harina 5,5 kg |
| Gasto de Insumos de 1 kg con fecha 1 nov a las 17:00 | Harina sigue en 5,5 kg; el gasto sí aparece en Gastos. **Eliminarlo después** para no alterar el reporte de la Fase 10 |
| Gasto de Servicios "Recibo de luz" ₡18 500,50 a las 10:00 | Aparece en Gastos; ningún inventario cambia |
| Gasto con la descripción vacía | "Este campo es obligatorio" |
| Monto "18.500,50" | "Escribe un número válido, por ejemplo 1250,50" |

---

## Fase 7 — Ventas

Fecha simulada: `?today=2026-11-02&time=11:00`. Pan casero tiene existencia 18 (Fase 5).

- [ ] **T-7.1** `saleService.create`, `update` y `delete` (REQ-F-12 a REQ-F-14):
  - Líneas repetidas: se suman en una (D-069).
  - Bloqueo de toda la venta si una línea no alcanza (D-031).
  - Validación sobre el total (D-080).
- [ ] **T-7.2** `SaleForm` con `LineItemsEditor`: precio prellenado y editable (INV-13).
- [ ] **T-7.3** `SalesScreen`: ventas agrupadas por día con su total (D-047).

**Cubre:** REQ-F-12 a REQ-F-14 (ventas normales), REQ-F-22 (líneas repetidas).

**Comportamiento sin cambios:**

- El catálogo, la producción, las salidas, los insumos y los gastos no cambian al vender.
- La pestaña Insumos no se ve afectada por las ventas.

**Verificación:**

| Acción | Esperado |
|---|---|
| Venta con Pan casero 3 + Pan casero 2 | Una sola línea de 5 · total ₡7 500,00 · existencia 13 |
| Venta de 14 panes | "Solo hay 13 disponibles de Pan casero"; no se guarda nada y el formulario conserva los datos |
| Editar la venta de 5 a 6 | Existencia 12; volver a 5 → existencia 13 |
| Venta con fecha 3 nov | "La fecha no puede ser futura" |
| Eliminar una venta de prueba | Las unidades vuelven a la existencia |

Al cerrar la fase debe quedar **una** venta de 5 panes el 2 nov, con existencia 13.

---

## Fase 8 — Pedidos

- [ ] **T-8.1** `orderService.create`, `update` y `delete` (REQ-F-15, REQ-F-16):
  - `createdAt`.
  - Líneas de catálogo y personalizadas.
  - Apartado.
  - Teléfono (REQ-F-24) y adelanto ≤ total (REQ-F-27).
  - Entrega hoy o futura solo al crear o cambiarla (D-073).
- [ ] **T-8.2** `OrdersScreen`:
  - Pestañas Pendientes, Entregados y Cancelados (D-047, D-071).
  - `OrderCard` con total, adelanto, saldo, "Faltan X {producto} por producir" (dorado) y "Atrasado" (rojo) (REQ-F-26).
- [ ] **T-8.3** `OrderForm` y `OrderDetail` (wireframe §2 y §3).
- [ ] **T-8.4** Re-render cada 60 s con la app visible y al volver a la pestaña (D-062, design §5.3).
- [ ] **T-8.5** Bloquear desactivar o eliminar productos en pedidos pendientes (REQ-F-02, D-074).

**Cubre:** REQ-F-15, REQ-F-16, REQ-F-24, REQ-F-26, REQ-F-27.

**Comportamiento sin cambios:**

- Crear, editar o eliminar pedidos no cambia la existencia ni las ventas.
- Solo cambian el apartado, el disponible y los faltantes (INV-14).

**Verificación** (`?today=2026-11-02&time=12:00`; existencia de Pan casero 13):

| Acción | Esperado |
|---|---|
| María Rojas, 8888-0000, sáb 7 nov 15:00, 10 Pan casero + "Queque de chocolate personalizado" 1 × ₡15 000,00, adelanto ₡10 000,00, nota "Que diga Feliz cumpleaños" | Total ₡30 000,00 · saldo ₡20 000,00 · sin faltantes |
| Luis Vargas, 8555-2222, dom 8 nov 09:00, 6 Pan casero | "Faltan 3 Pan casero por producir" en Luis |
| Inventario de Pan casero | Existencia 13 · apartado 16 · disponible 0 · "Faltan 3 por producir" |
| Venta normal de 1 pan | "Solo hay 0 disponibles de Pan casero" |
| Teléfono "8888-000" · adelanto ₡40 000,00 · entrega el 1 nov | "El teléfono debe tener 8 dígitos" · "El adelanto no puede superar el total del pedido" · "La entrega no puede estar en el pasado" |
| Agregar Pan casero dos veces en un pedido | Se suma en una sola línea |
| Eliminar o desactivar "Pan casero" | "Pan casero está en pedidos pendientes" |
| `?today=2026-11-07&time=14:59` · esperar 1 minuto en Pedidos | María pasa a "Atrasado" sin recargar; sigue cubierta |
| `…time=16:00` · editar la nota de María sin cambiar la entrega | Se guarda (D-073) |
| `…time=17:01` | María: "Faltan 3 Pan casero por producir" · Luis: sin faltantes |

---

## Fase 9 — Entrega y cancelación

- [ ] **T-9.1** `orderService.deliver` (REQ-F-17, D-029, D-056, D-063, D-066, D-071):
  - Bloquea si el pedido tiene faltantes.
  - Crea la venta con la fecha real, incluidos los `customItems`.
  - Guarda `closedAt` en la misma transacción que la venta.
- [ ] **T-9.2** `orderService.cancel`: libera lo apartado, guarda la nota opcional y `closedAt` (REQ-F-18).
- [ ] **T-9.3** Pedidos entregados y cancelados de solo lectura (REQ-F-16, D-071). Una venta de pedido solo permite editar la fecha (REQ-F-13, D-072).
- [ ] **T-9.4** Eliminar la venta de un pedido: el pedido vuelve a Pendiente y `closedAt` queda en null, en la misma transacción (REQ-F-14, D-021). Aviso "El pedido de {cliente} volverá a Pendiente".

**Cubre:** REQ-F-17, REQ-F-18, y REQ-F-13 y REQ-F-14 para ventas de pedido.

**Comportamiento sin cambios:**

- Las ventas normales (Fase 7) funcionan igual.
- Cancelar no crea ventas ni cambia la existencia.
- Las salidas y los gastos no se ven afectados.

**Verificación:**

| Acción (fecha simulada) | Esperado |
|---|---|
| `?today=2026-11-07&time=14:00` · Entregar a Luis | "Faltan 3 Pan casero por producir para este pedido"; sigue Pendiente |
| `…time=17:01` · Entregar a Luis | Venta del 7 nov por ₡9 000,00 con la etiqueta "Pedido de Luis Vargas" · existencia 7 · Luis en Entregados, sin botones |
| Editar esa venta | Solo se puede cambiar la fecha |
| Eliminar esa venta | Aviso "El pedido de Luis Vargas volverá a Pendiente" · existencia 13 · Luis vuelve a Pendientes |
| `…time=14:00` · Entregar a María | Venta del 7 nov por ₡30 000,00 (incluye el queque) · existencia 3 · Luis: "Faltan 3" |
| Pedido de prueba con adelanto → Cancelar con la nota "Adelanto devuelto" | Pasa a Cancelados con la nota; lo apartado se libera; no hay venta |

Al cerrar la fase deben quedar: María entregada (venta de ₡30 000,00 el 7 nov), Luis pendiente y el pedido de prueba cancelado.

---

## Fase 10 — Reporte

- [ ] **T-10.1** `reportService` y `ReportScreen` (REQ-F-19):
  - Selector Día o Mes.
  - Tres tarjetas: Total vendido, Total de gastos (Insumos y Servicios) y Ganancia.
  - La ganancia se muestra en rojo si es negativa.

**Cubre:** REQ-F-19.

**Comportamiento sin cambios:**

- El reporte es solo de lectura: abrirlo no modifica datos.
- Las salidas no cuentan en él (INV-21).

**Verificación** (con los datos de las fases 5 a 9):

| Período | Total vendido | Total de gastos | Ganancia |
|---|---|---|---|
| Mes de noviembre 2026 | ₡37 500,00 | ₡20 500,50 (Insumos ₡2 000,00 · Servicios ₡18 500,50) | ₡16 999,50 |
| Día 2 nov | ₡7 500,00 | ₡20 500,50 | Negativa, en rojo (gastos mayores que ventas) |
| Día 7 nov | ₡30 000,00 | ₡0,00 | ₡30 000,00 |

---

## Fase 11 — Cierre

- [ ] **T-11.1** Revisión responsive a 360, 768 y 1280 px, sin desbordes horizontales (R7).
- [ ] **T-11.2** Revisar que todos los textos de la interfaz estén en español y coincidan con los mensajes de design §8 (R6).
- [ ] **T-11.3** Recorrer las validaciones REQ-F-20 a REQ-F-24, REQ-F-27 y REQ-F-28 en **todos** los formularios (RC-04).
- [ ] **T-11.4** Completar la matriz de verificación final (abajo) con los 28 REQ-F y los 10 RNF.
- [ ] **T-11.5** README: descripción, tecnología, cómo ejecutar con Live Server, fecha simulada y estructura del repositorio.

**Comportamiento sin cambios:**

- El pulido visual no cambia reglas: se repite la verificación completa de las fases 1 a 10.

---

## Verificación final (T-11.4)

Se completa al cerrar la Fase 11.

| REQ | Verificado en | Caso comprobado | Estado |
|---|---|---|---|
| REQ-F-01 a REQ-F-06 | Fase 5 (y 8 para REQ-F-02) | | ⬜ |
| REQ-F-07 a REQ-F-11 | Fase 6 | | ⬜ |
| REQ-F-12 a REQ-F-14 | Fases 7 y 9 | | ⬜ |
| REQ-F-15, 16, 24, 26, 27 | Fase 8 | | ⬜ |
| REQ-F-17, 18 | Fase 9 | | ⬜ |
| REQ-F-19 | Fase 10 | | ⬜ |
| REQ-F-20 a 23, 28 | Fases 5 a 9 y 11 | | ⬜ |
| REQ-F-25 | Fases 5 y 6 | | ⬜ |
| RNF-01 a RNF-10 | Fases 0 a 4 y 11 | | ⬜ |
