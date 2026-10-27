# Especificación de Requerimientos — Panadería Efrata

| | |
|---|---|
| **Versión** | 1.8 (2026-10-26) — cambios: REQ-F-24 (D-044); REQ-F-25 y REQ-F-26 (D-048, D-049); REQ-F-06, REQ-F-15 y REQ-F-20 (D-050 a D-053); prioridad y entrega (D-063 a D-066); auditoría del paso 7 (D-069 a D-081), con REQ-F-27 y REQ-F-28 nuevos; mensaje de enteros y montos negativos (D-083, D-084); eliminar salidas (D-098); unidad bloqueada con historial (D-102) |
| **Fecha** | 2026-10-26 |
| **Fuentes** | `docs/propuesta.md` · `CLAUDE.md` (INV-xx, D-xxx) |
| **Sintaxis** | EARS (*Easy Approach to Requirements Syntax*) |

### Convenciones

- **Idioma (D-012):** cada frase EARS va completa en inglés; títulos, campos y notas en español.
- **Textos de la interfaz:** los mensajes al usuario se citan en español entre comillas, porque así se muestran (R6).
- **Términos:** se usa el lenguaje ubicuo de `CLAUDE.md` §3 (`Product`, `Supply`, `Expense`, `Sale`, `SaleItem`, `Order`, `OrderItem` —`CatalogOrderItem` / `CustomOrderItem`—, `Production`, `StockOut`, `StockCount`).
- **★ Regla de negocio compleja (RC-02):** requerimiento redactado con la forma condicional **WHEN** [evento] **IF** [condición] **THEN** the system **SHALL** [respuesta].
- **Montos:** en colones (₡), guardados como céntimos enteros (D-025).

---

## 1. Catálogo

### REQ-F-01: Crear y editar producto
* **Tipo:** Evento
* **Disparador:** El dueño guarda un producto nuevo o editado.
* **Precondición:** Formulario de producto abierto.
* **Sintaxis EARS:**
  > **WHEN** the owner saves a `Product` with a name and a price, **THEN** the system **SHALL** store the product as active and make it available for sales, orders and production.

  > **WHEN** the owner adds a `Product` to a sale or an order, **THEN** the system **SHALL** prefill the line price with the product price and allow the owner to edit it for that line only.
* **Origen:** INV-03, INV-04, INV-13. Validaciones en REQ-F-20 a REQ-F-22.

### REQ-F-02: Desactivar o eliminar producto o insumo ★
* **Tipo:** Evento
* **Disparador:** El dueño elige eliminar un `Product` o un `Supply`.
* **Precondición:** El producto o insumo existe.
* **Sintaxis EARS:**
  > **WHEN** the owner requests to delete a `Product` or a `Supply`, **IF** it has history (sales, orders, production, stock outs, expenses or stock counts), **THEN** the system **SHALL** deactivate it instead of deleting it, keep its history and reports unchanged, and exclude it from new operations.

  > **WHEN** the owner requests to delete a `Product` or a `Supply`, **IF** it has no history, **THEN** the system **SHALL** delete it after the owner confirms.

  > **WHEN** the owner requests to delete or deactivate a `Product`, **IF** it is included in any `PENDING` order, **THEN** the system **SHALL** block the action and display "{producto} está en pedidos pendientes".
* **Precedencia:** la regla de pedidos pendientes se evalúa **primero**. Si aplica, bloquea la acción y no se desactiva ni se elimina, aunque el producto tenga historial (D-074).
* **Origen:** INV-24, D-023, D-074.

### REQ-F-25: Reactivar producto o insumo
* **Tipo:** Evento
* **Disparador:** El dueño reactiva un producto o insumo desactivado.
* **Precondición:** El producto o insumo está desactivado.
* **Sintaxis EARS:**
  > **WHILE** the inventory is displayed, the system **SHALL** list deactivated products and supplies in a collapsible "Desactivados" section, separated from the active ones.

  > **WHEN** the owner reactivates a deactivated `Product` or `Supply`, **THEN** the system **SHALL** mark it as active and make it available again for new operations.
* **Origen:** D-048.

---

## 2. Inventario de productos terminados

### REQ-F-03: Registrar producción
* **Tipo:** Evento
* **Disparador:** El dueño registra unidades producidas de uno o más productos.
* **Precondición:** Los productos están activos.
* **Sintaxis EARS:**
  > **WHEN** the owner saves a `Production` with a quantity and a date for a `Product`, **THEN** the system **SHALL** add that quantity to the product's stock on hand.

  > **WHEN** the owner saves the production form, **IF** no product has a quantity, **THEN** the system **SHALL** block the save and display "Ingresa al menos una cantidad".
* **Nota:** producir no descuenta insumos (INV-10). Fecha pasada o de hoy (REQ-F-23). En el formulario de varios productos, las casillas vacías se ignoran y se guarda un registro por cada producto con cantidad (D-076).
* **Origen:** INV-11, INV-26, D-076.

### REQ-F-04: Editar o eliminar producción
* **Tipo:** Evento
* **Disparador:** El dueño edita o elimina un registro de producción.
* **Precondición:** El registro existe.
* **Sintaxis EARS:**
  > **WHEN** the owner edits or deletes a `Production`, **IF** the resulting stock on hand would be lower than zero, **THEN** the system **SHALL** block the change and display "Solo hay X de {producto} en existencia", where X is the current stock on hand.

  > **WHEN** the owner edits or deletes a `Production` and the resulting stock is valid, **THEN** the system **SHALL** adjust the stock on hand by the difference.
* **Origen:** INV-23, INV-01.

### REQ-F-05: Registrar salida de inventario
* **Tipo:** Evento
* **Disparador:** El dueño saca unidades no vendidas de un producto.
* **Precondición:** El producto está activo.
* **Sintaxis EARS:**
  > **WHEN** the owner saves a `StockOut` with a quantity, a date and a reason (`REUSED` or `GIVEN_AWAY`), **IF** the quantity exceeds the product's available-to-sell stock, **THEN** the system **SHALL** block it and display "Solo hay X disponibles de {producto}".

  > **WHEN** the owner saves a valid `StockOut`, **THEN** the system **SHALL** subtract the quantity from the stock on hand without recording it as a sale or an expense.

  > **WHEN** the owner confirms the deletion of a `StockOut`, **THEN** the system **SHALL** delete it and return its quantity to the product's stock on hand.
* **Nota:** las salidas no se editan; para corregir una se elimina y se registra de nuevo (D-098).
* **Origen:** INV-21, D-020, D-098.

### REQ-F-06: Mostrar existencias de productos
* **Tipo:** Estado / Interfaz
* **Disparador:** El dueño consulta el inventario de productos.
* **Precondición:** Existe al menos un producto activo.
* **Sintaxis EARS:**
  > **WHILE** the product inventory is displayed, the system **SHALL** show for each active `Product` its stock on hand, its reserved quantity (sum of quantities in `PENDING` orders) and its available-to-sell stock (stock on hand − reserved quantity, shown as 0 when the reserved quantity exceeds the stock on hand) and, when the reserved quantity exceeds the stock on hand, the missing quantity "Faltan X por producir" (X = reserved quantity − stock on hand).
* **Nota sobre el 0:** disponible para vender nunca se muestra negativo (INV-01, D-051).
* **Nota:** valores derivados; no se guardan.
* **Origen:** INV-14, `CLAUDE.md` §3.2, D-077.

---

## 3. Inventario de insumos

### REQ-F-07: Crear y editar insumo
* **Tipo:** Evento
* **Disparador:** El dueño guarda un insumo nuevo o editado.
* **Precondición:** Formulario de insumo abierto.
* **Sintaxis EARS:**
  > **WHEN** the owner saves a `Supply` with a name and a unit, **THEN** the system **SHALL** store it as active with its own unit.

  > **WHEN** the owner edits a `Supply`, **IF** it has history (purchases or stock counts) **AND** the unit is changed, **THEN** the system **SHALL** block the save and display "La unidad no se puede cambiar porque el insumo ya tiene compras o conteos".
* **Origen:** INV-05, INV-07, D-102. Validaciones en REQ-F-20 a REQ-F-22.

### REQ-F-08: Conteo físico de insumo
* **Tipo:** Evento
* **Disparador:** El dueño registra la cantidad real de un insumo.
* **Precondición:** El insumo está activo.
* **Sintaxis EARS:**
  > **WHEN** the owner saves a `StockCount` with a quantity greater than or equal to zero, **THEN** the system **SHALL** replace the supply quantity with that value and store the count date, the previous quantity and the new quantity.
* **Nota:** es la única entrada numérica que admite 0 (INV-03). Los conteos no se editan ni se eliminan (INV-23).
* **Origen:** INV-09, INV-25, D-024.

---

## 4. Gastos

### REQ-F-09: Registrar gasto de Insumos ★
* **Tipo:** Evento
* **Disparador:** El dueño guarda un gasto de categoría Insumos.
* **Precondición:** Existe al menos un insumo activo.
* **Sintaxis EARS:**
  > **WHEN** the owner saves an `Expense`, **IF** its category is `SUPPLIES`, **THEN** the system **SHALL** require a description, a `Supply`, a quantity and an amount, store the expense and add the quantity to that supply's stock only if its date and time are strictly later (to the minute) than the last stock count of that supply.
* **Nota:** la compra siempre cuenta en el reporte; solo deja de sumar al inventario si es anterior o del mismo minuto que el último conteo, porque el conteo ya la incluye (D-037, D-075).
* **Origen:** INV-08, D-007, D-037, D-040, D-075.

### REQ-F-10: Registrar gasto de Servicios
* **Tipo:** Evento
* **Disparador:** El dueño guarda un gasto de categoría Servicios.
* **Precondición:** Formulario de gasto abierto.
* **Sintaxis EARS:**
  > **WHEN** the owner saves an `Expense` with category `SERVICES`, **THEN** the system **SHALL** require a description and an amount and store the expense without changing any inventory.
* **Origen:** INV-08, D-040.

### REQ-F-11: Editar o eliminar gasto
* **Tipo:** Evento
* **Disparador:** El dueño edita o elimina un gasto.
* **Precondición:** El gasto existe.
* **Sintaxis EARS:**
  > **WHEN** the owner edits or deletes a `SUPPLIES` `Expense`, **IF** the adjustment would leave the supply quantity below zero, **THEN** the system **SHALL** block the change and display "Solo hay X {unidad} de {insumo}".

  > **WHEN** the owner edits or deletes an `Expense` and the adjustment is valid, **THEN** the system **SHALL** apply it and adjust the supply stock by the difference when the category is `SUPPLIES`.
* **Nota:** la primera regla es **defensiva**: con las reglas actuales la cantidad de un insumo no puede quedar negativa, porque solo las compras suman y el conteo la reemplaza (D-081).
* **Origen:** INV-23, INV-01.

---

## 5. Ventas

### REQ-F-12: Registrar venta ★
* **Tipo:** Evento
* **Disparador:** El dueño guarda una venta.
* **Precondición:** La venta tiene al menos un `SaleItem`.
* **Sintaxis EARS:**
  > **WHEN** the owner adds to a `Sale` a product that is already in the sale, **THEN** the system **SHALL** add the quantity to the existing line instead of creating a new one.

  > **WHEN** the owner saves a `Sale`, **IF** the quantity of any `SaleItem` exceeds the available-to-sell stock of its `Product`, **THEN** the system **SHALL** block the whole sale and display "Solo hay X disponibles de {producto}" for each affected product.

  > **WHEN** the owner saves a `Sale` and every item is within its available-to-sell stock, **THEN** the system **SHALL** store the sale and subtract each item's quantity from its product's stock on hand.
* **Nota:** una venta normal no puede usar unidades apartadas por pedidos. La existencia se valida sobre el total, no en el tiempo: una venta con fecha anterior a su producción es válida si el total alcanza (D-080).
* **Origen:** INV-12, INV-01, D-016, D-069, D-080.

### REQ-F-13: Editar venta
* **Tipo:** Evento
* **Disparador:** El dueño edita una venta.
* **Precondición:** La venta existe.
* **Sintaxis EARS:**
  > **WHEN** the owner edits a `Sale`, **IF** the net increase of any product exceeds its available-to-sell stock, **THEN** the system **SHALL** block the change and display "Solo hay X disponibles de {producto}".

  > **WHEN** the owner edits a `Sale` and the change is valid, **THEN** the system **SHALL** adjust each product's stock on hand by the difference between the previous and the new quantities.

  > **WHEN** the owner edits a `Sale`, **IF** it was generated by a delivered `Order`, **THEN** the system **SHALL** allow changing only its date.
* **Nota:** para cambiar los productos de una venta que viene de un pedido se elimina la venta (el pedido vuelve a Pendiente, REQ-F-14), se edita el pedido y se entrega de nuevo (D-072).
* **Origen:** INV-23, D-072.

### REQ-F-14: Eliminar venta ★
* **Tipo:** Evento
* **Disparador:** El dueño elimina una venta.
* **Precondición:** La venta existe.
* **Sintaxis EARS:**
  > **WHEN** the owner confirms the deletion of a `Sale`, **THEN** the system **SHALL** delete it and return the quantity of each `SaleItem` to its product's stock on hand.

  > **WHEN** the owner confirms the deletion of a `Sale`, **IF** the sale was generated by a delivered `Order`, **THEN** the system **SHALL** also set that order back to `PENDING` so that it reserves its products again.
* **Origen:** INV-20, INV-22, D-017, D-021.

---

## 6. Pedidos

### REQ-F-15: Crear pedido ★
* **Tipo:** Evento
* **Disparador:** El dueño guarda un pedido nuevo.
* **Precondición:** El pedido tiene al menos un `OrderItem`.
* **Sintaxis EARS:**
  > **WHEN** the owner saves a new `Order`, **THEN** the system **SHALL** store it as `PENDING` and reserve the quantity of each catalog `OrderItem`, even if the stock is not enough.

  > **WHEN** a `PENDING` order is displayed, **IF** the stock on hand of a catalog product does not cover the quantity of that product in this order after allocating the stock to the other `PENDING` orders with higher priority, **THEN** the system **SHALL** show "Faltan X {producto} por producir" for that product, where X is the uncovered quantity.

  > **WHEN** the owner adds a custom `OrderItem` with a description and a price, **THEN** the system **SHALL** store it without affecting any inventory.
* **Nota:** datos obligatorios: cliente, teléfono, líneas, fecha y hora de entrega; opcionales: notas y adelanto (D-026). El adelanto solo se anota (INV-17).
* **Prioridad (D-050, D-053, D-063):**
  1. Primero los pedidos **en plazo**, es decir, que no han superado su hora de entrega **+ 2 horas**, del más próximo al más lejano; en empate, el registrado antes.
  2. Después los pedidos que superaron ese margen, con el mismo orden.
  3. Si el cliente avisa que se atrasará, el dueño **reprograma** la entrega editando el pedido (REQ-F-16) y la prioridad se recalcula (D-064).
* **Asignación:** las unidades en existencia se asignan siguiendo esa prioridad. Ejemplo: 13 panes; María pide 10 (sábado) y Luis 6 (domingo) → María cubierta, a Luis le faltan 3. Si el sábado a las 17:01 María no se ha entregado ni reprogramado, pierde la prioridad: Luis queda cubierto y a María le faltan 3.
* **Origen:** INV-14, INV-15, INV-06, D-009, D-050, D-053, D-063, D-064.

### REQ-F-16: Editar o eliminar pedido
* **Tipo:** Evento
* **Disparador:** El dueño edita o elimina un pedido.
* **Precondición:** El pedido está en `PENDING`.
* **Sintaxis EARS:**
  > **WHEN** the owner edits a `PENDING` order, **THEN** the system **SHALL** recalculate the reserved quantities with the new lines.

  > **WHEN** the owner confirms the deletion of a `PENDING` order, **THEN** the system **SHALL** delete it and release its reserved quantities.

  > **WHILE** an `Order` is `DELIVERED` or `CANCELLED`, the system **SHALL** show it as read-only, without edit, delete, deliver or cancel actions.
* **Nota:** para deshacer una entrega se elimina su venta (REQ-F-14, D-021). Las pestañas Entregados y Cancelados se ordenan por `closedAt`, el más reciente primero (D-071).
* **Origen:** D-022, INV-27, D-071.

### REQ-F-17: Entregar pedido ★
* **Tipo:** Evento
* **Disparador:** El dueño marca un pedido como Entregado.
* **Precondición:** El pedido está en `PENDING`.
* **Sintaxis EARS:**
  > **WHEN** the owner marks an `Order` as `DELIVERED`, **IF** any catalog product of the order shows a missing quantity ("Faltan X {producto} por producir") according to the priority allocation of REQ-F-15, **THEN** the system **SHALL** block the delivery, keep the order as `PENDING` and display "Faltan X {producto} por producir para este pedido".

  > **WHEN** the owner marks an `Order` as `DELIVERED` and the stock is enough, **THEN** the system **SHALL** create a `Sale` for the order total (advance payment + balance) dated with the actual date when it is marked, subtract the catalog products from the stock on hand, release the reservation and record the moment as `closedAt`.
* **Nota:** un pedido solo puede usar las unidades que la prioridad le asignó; no puede tomar las de otro pedido con mayor prioridad (D-063, reemplaza D-032). Los artículos personalizados se incluyen en el total sin afectar el inventario.
* **Origen:** INV-16, D-029, D-063, D-066, D-071.

### REQ-F-26: Pedido atrasado
* **Tipo:** Estado / Interfaz
* **Disparador:** Llega la fecha y hora de entrega de un pedido sin que se marque Entregado ni Cancelado.
* **Precondición:** El pedido está en `PENDING`.
* **Sintaxis EARS:**
  > **WHILE** an `Order` is `PENDING` and its delivery date and time are earlier than now, the system **SHALL** highlight it in red with the label "Atrasado" in the orders list and in its detail.
* **Nota:** es solo visual; no cambia el estado ni bloquea entregarlo o cancelarlo. La etiqueta aparece al pasar la hora de entrega; la **prioridad** se pierde 2 horas después (D-065).
* **Origen:** D-049, D-062, D-065.

### REQ-F-18: Cancelar pedido
* **Tipo:** Evento
* **Disparador:** El dueño marca un pedido como Cancelado.
* **Precondición:** El pedido está en `PENDING`.
* **Sintaxis EARS:**
  > **WHEN** the owner marks an `Order` as `CANCELLED`, **THEN** the system **SHALL** release its reserved quantities, record the moment as `closedAt` and allow the owner to record an optional note about the advance payment, without using it in any calculation.
* **Origen:** INV-17, INV-18, D-071, D-076.

---

## 7. Reporte

### REQ-F-19: Reporte por día o mes
* **Tipo:** Evento
* **Disparador:** El dueño abre el reporte y elige un período.
* **Precondición:** Ninguna.
* **Sintaxis EARS:**
  > **WHEN** the owner selects a day or a month in the report, **THEN** the system **SHALL** display the total sold, the total expenses broken down into `SUPPLIES` and `SERVICES`, and the profit (total sold − total expenses) for that period.
* **Nota:** la ganancia puede ser negativa; se muestra en rojo con el signo menos antes del símbolo: "−₡13 000,50" (D-084). Las salidas de inventario no cuentan como venta ni como gasto (INV-21).
* **Origen:** INV-19, D-010.

---

## 8. Validaciones y casos de borde (RC-04)

### REQ-F-20: Campos vacíos
* **Tipo:** Validación
* **Disparador:** El dueño intenta guardar cualquier formulario.
* **Precondición:** Formulario activo.
* **Sintaxis EARS:**
  > **WHEN** the owner tries to save a form, **IF** a required field is empty or contains only spaces, **THEN** the system **SHALL** block the save and display "Este campo es obligatorio" next to that field, keeping the rest of the entered data.
* **Origen:** INV-02, D-026, D-052.

### REQ-F-21: Valores numéricos
* **Tipo:** Validación
* **Disparador:** El dueño ingresa un precio, monto o cantidad.
* **Precondición:** Campo numérico activo.
* **Sintaxis EARS:**
  > **WHEN** the owner enters a price, amount or quantity, **IF** the value is less than or equal to zero, **THEN** the system **SHALL** block the save and display "Solo se admiten valores mayores a 0".

  > **WHEN** the owner enters a `StockCount` quantity, **IF** the value is less than zero, **THEN** the system **SHALL** block the save and display "La cantidad no puede ser negativa".
* **Origen:** INV-03, D-011.

### REQ-F-22: Duplicados
* **Tipo:** Validación
* **Disparador:** El dueño guarda un producto, un insumo o una línea de pedido o de venta.
* **Precondición:** Formulario activo.
* **Sintaxis EARS:**
  > **WHEN** the owner saves a `Product` or a `Supply`, **IF** another one already has the same name (ignoring uppercase, lowercase and extra spaces), **THEN** the system **SHALL** block the save and display "Ya existe un {producto/insumo} con ese nombre".

  > **WHEN** the owner adds to an `Order` a catalog product that is already in the order, **THEN** the system **SHALL** add the quantity to the existing line instead of creating a new one. The same applies to a `Sale` (REQ-F-12).
* **Origen:** INV-04, INV-05, INV-06, D-011, D-069.

### REQ-F-23: Fechas
* **Tipo:** Validación
* **Disparador:** El dueño guarda un registro con fecha.
* **Precondición:** Formulario activo.
* **Sintaxis EARS:**
  > **WHEN** the owner saves a `Sale`, `Expense`, `Production` or `StockOut`, **IF** its date is later than today, **THEN** the system **SHALL** block the save and display "La fecha no puede ser futura".

  > **WHEN** the owner creates a `PENDING` order or changes the delivery date or time of a `PENDING` order, **IF** the new delivery date and time are earlier than now, **THEN** the system **SHALL** block the save and display "La entrega no puede estar en el pasado".
* **Nota:** editar otros datos de un pedido atrasado (notas, adelanto, líneas) no exige cambiar su entrega (D-073).
* **Origen:** INV-26, INV-27, D-027, D-028, D-073.

### REQ-F-24: Teléfono del cliente
* **Tipo:** Validación
* **Disparador:** El dueño guarda un pedido.
* **Precondición:** Formulario de pedido activo.
* **Sintaxis EARS:**
  > **WHEN** the owner saves an `Order`, **IF** the customer phone does not contain exactly 8 digits (with or without a hyphen, as in 8888-0000), **THEN** the system **SHALL** block the save and display "El teléfono debe tener 8 dígitos".
* **Origen:** D-044.

### REQ-F-27: Adelanto
* **Tipo:** Validación
* **Disparador:** El dueño guarda un pedido con adelanto.
* **Precondición:** Formulario de pedido activo.
* **Sintaxis EARS:**
  > **WHEN** the owner saves an `Order` with an advance payment, **IF** the advance payment is greater than the order total, **THEN** the system **SHALL** block the save and display "El adelanto no puede superar el total del pedido".
* **Origen:** D-043, D-078.

### REQ-F-28: Lectura de números
* **Tipo:** Validación
* **Disparador:** El dueño escribe un monto o una cantidad.
* **Precondición:** Campo numérico activo.
* **Sintaxis EARS:**
  > **WHEN** the owner enters a number, **IF** it contains letters, more than one separator or a thousands separator, **THEN** the system **SHALL** block the save and display "Escribe un número válido, por ejemplo 1250,50".

  > **WHEN** the owner enters a number, **IF** it has more decimals than allowed (2 for amounts, 3 for supply quantities), **THEN** the system **SHALL** block the save and display "Usa máximo {n} decimales".

  > **WHEN** the owner enters a product quantity, **IF** it has decimals, **THEN** the system **SHALL** block the save and display "Escribe un número entero".
* **Nota:** se acepta coma o punto como separador decimal: `1250,50` = `1250.50`. `1.250` en un monto se rechaza por tener 3 decimales, para evitar leer ₡1,25 (D-058).
* **Origen:** D-058, D-078, D-083.

---

## 9. Requerimientos no funcionales

| ID | Requerimiento | Origen |
|---|---|---|
| RNF-01 | Los datos se guardan en IndexedDB del navegador; un usuario por navegador, sin backend ni login. | R1, D-004 |
| RNF-02 | La aplicación no consume servicios externos en tiempo de ejecución. | R2 |
| RNF-03 | JavaScript sin framework de UI. | R3 |
| RNF-04 | Sin herramienta de build: módulos ES nativos servidos con un servidor local. | R4 |
| RNF-05 | Verificación manual, sin pruebas automatizadas. | R5 |
| RNF-06 | Código y contrato de datos en inglés; interfaz en español. | R6 |
| RNF-07 | Interfaz mobile-first y responsive. | R7 |
| RNF-08 | Arquitectura en capas con repositorios; el dominio no accede directamente a IndexedDB. | R8 |
| RNF-09 | Identidad visual "Horno cálido" con ilustraciones SVG propias guardadas en el proyecto. | D-014 |
| RNF-10 | Montos en colones guardados como céntimos enteros y mostrados con 2 decimales; los negativos con el signo menos antes del símbolo (−₡13 000,50). | D-025, D-084 |

---

## 10. Cobertura de RC-02

| REQ | Regla de negocio compleja |
|---|---|
| REQ-F-02 | Producto o insumo con historial: se desactiva en lugar de eliminarse |
| REQ-F-09 | Gasto de Insumos: suma automáticamente al inventario |
| REQ-F-12 | Venta: se bloquea completa si una línea supera lo disponible para vender |
| REQ-F-14 | Eliminar venta: devuelve unidades; si viene de un pedido, este vuelve a Pendiente |
| REQ-F-15 | Pedido: aparta unidades aunque no alcancen y muestra lo que falta |
| REQ-F-17 | Entregar pedido: venta automática con fecha real, o bloqueo si el pedido tiene faltantes según la prioridad |

Seis reglas; el curso pide mínimo tres.
