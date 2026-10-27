# Especificación de Requerimientos — Panadería Efrata

| | |
|---|---|
| **Versión** | 0.1 (borrador para aprobación) |
| **Fecha** | 2026-10-26 |
| **Fuentes** | `docs/propuesta.md` · `CLAUDE.md` (INV-xx, D-xxx) |
| **Sintaxis** | EARS (*Easy Approach to Requirements Syntax*) |

### Convenciones

- **Idioma (D-012):** cada frase EARS va completa en inglés; títulos, campos y notas en español.
- **Textos de la interfaz:** los mensajes al usuario se citan en español entre comillas, porque así se muestran (R6).
- **Términos:** se usa el lenguaje ubicuo de `CLAUDE.md` §3 (`Product`, `Supply`, `Expense`, `Sale`, `SaleItem`, `Order`, `OrderItem`, `Production`, `StockOut`, `StockCount`).
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
* **Origen:** INV-24, D-023.

---

## 2. Inventario de productos terminados

### REQ-F-03: Registrar producción
* **Tipo:** Evento
* **Disparador:** El dueño registra unidades producidas de uno o más productos.
* **Precondición:** Los productos están activos.
* **Sintaxis EARS:**
  > **WHEN** the owner saves a `Production` with a quantity and a date for a `Product`, **THEN** the system **SHALL** add that quantity to the product's stock on hand.
* **Nota:** producir no descuenta insumos (INV-10). Fecha pasada o de hoy (REQ-F-23).
* **Origen:** INV-11, INV-26.

### REQ-F-04: Editar o eliminar producción
* **Tipo:** Evento
* **Disparador:** El dueño edita o elimina un registro de producción.
* **Precondición:** El registro existe.
* **Sintaxis EARS:**
  > **WHEN** the owner edits or deletes a `Production`, **IF** the resulting stock on hand would be lower than zero, **THEN** the system **SHALL** block the change and display "Solo hay X disponibles de {producto}".

  > **WHEN** the owner edits or deletes a `Production` and the resulting stock is valid, **THEN** the system **SHALL** adjust the stock on hand by the difference.
* **Origen:** INV-23, INV-01.

### REQ-F-05: Registrar salida de inventario
* **Tipo:** Evento
* **Disparador:** El dueño saca unidades no vendidas de un producto.
* **Precondición:** El producto está activo.
* **Sintaxis EARS:**
  > **WHEN** the owner saves a `StockOut` with a quantity, a date and a reason (`REUSED` or `GIVEN_AWAY`), **IF** the quantity exceeds the product's available-to-sell stock, **THEN** the system **SHALL** block it and display "Solo hay X disponibles de {producto}".

  > **WHEN** the owner saves a valid `StockOut`, **THEN** the system **SHALL** subtract the quantity from the stock on hand without recording it as a sale or an expense.
* **Origen:** INV-21, D-020.

### REQ-F-06: Mostrar existencias de productos
* **Tipo:** Estado / Interfaz
* **Disparador:** El dueño consulta el inventario de productos.
* **Precondición:** Existe al menos un producto activo.
* **Sintaxis EARS:**
  > **WHILE** the product inventory is displayed, the system **SHALL** show for each active `Product` its stock on hand, its reserved quantity (sum of quantities in `PENDING` orders) and its available-to-sell stock (stock on hand − reserved quantity).
* **Nota:** valores derivados; no se guardan.
* **Origen:** INV-14, `CLAUDE.md` §3.2.

---

## 3. Inventario de insumos

### REQ-F-07: Crear y editar insumo
* **Tipo:** Evento
* **Disparador:** El dueño guarda un insumo nuevo o editado.
* **Precondición:** Formulario de insumo abierto.
* **Sintaxis EARS:**
  > **WHEN** the owner saves a `Supply` with a name and a unit, **THEN** the system **SHALL** store it as active with its own unit.
* **Origen:** INV-05, INV-07. Validaciones en REQ-F-20 a REQ-F-22.

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
  > **WHEN** the owner saves an `Expense`, **IF** its category is `SUPPLIES`, **THEN** the system **SHALL** require a `Supply`, a quantity and an amount, store the expense and add the quantity to that supply's stock.
* **Origen:** INV-08, D-007.

### REQ-F-10: Registrar gasto de Servicios
* **Tipo:** Evento
* **Disparador:** El dueño guarda un gasto de categoría Servicios.
* **Precondición:** Formulario de gasto abierto.
* **Sintaxis EARS:**
  > **WHEN** the owner saves an `Expense` with category `SERVICES`, **THEN** the system **SHALL** store the expense without changing any inventory.
* **Origen:** INV-08.

### REQ-F-11: Editar o eliminar gasto
* **Tipo:** Evento
* **Disparador:** El dueño edita o elimina un gasto.
* **Precondición:** El gasto existe.
* **Sintaxis EARS:**
  > **WHEN** the owner edits or deletes a `SUPPLIES` `Expense`, **IF** the adjustment would leave the supply quantity below zero, **THEN** the system **SHALL** block the change and display "Solo hay X {unidad} de {insumo}".

  > **WHEN** the owner edits or deletes an `Expense` and the adjustment is valid, **THEN** the system **SHALL** apply it and adjust the supply stock by the difference when the category is `SUPPLIES`.
* **Origen:** INV-23, INV-01.

---

## 5. Ventas

### REQ-F-12: Registrar venta ★
* **Tipo:** Evento
* **Disparador:** El dueño guarda una venta.
* **Precondición:** La venta tiene al menos un `SaleItem`.
* **Sintaxis EARS:**
  > **WHEN** the owner saves a `Sale`, **IF** the quantity of any `SaleItem` exceeds the available-to-sell stock of its `Product`, **THEN** the system **SHALL** block the whole sale and display "Solo hay X disponibles de {producto}" for each affected product.

  > **WHEN** the owner saves a `Sale` and every item is within its available-to-sell stock, **THEN** the system **SHALL** store the sale and subtract each item's quantity from its product's stock on hand.
* **Nota:** una venta normal no puede usar unidades apartadas por pedidos.
* **Origen:** INV-12, INV-01, D-016.

### REQ-F-13: Editar venta
* **Tipo:** Evento
* **Disparador:** El dueño edita una venta.
* **Precondición:** La venta existe.
* **Sintaxis EARS:**
  > **WHEN** the owner edits a `Sale`, **IF** the net increase of any product exceeds its available-to-sell stock, **THEN** the system **SHALL** block the change and display "Solo hay X disponibles de {producto}".

  > **WHEN** the owner edits a `Sale` and the change is valid, **THEN** the system **SHALL** adjust each product's stock on hand by the difference between the previous and the new quantities.
* **Origen:** INV-23.

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

  > **WHEN** a `PENDING` order is displayed, **IF** the available stock of a catalog product does not cover its reserved quantity, **THEN** the system **SHALL** show "Faltan X por producir" for that product.

  > **WHEN** the owner adds a custom `OrderItem` with a description and a price, **THEN** the system **SHALL** store it without affecting any inventory.
* **Nota:** datos obligatorios: cliente, teléfono, líneas, fecha y hora de entrega; opcionales: notas y adelanto (D-026). El adelanto solo se anota (INV-17).
* **Origen:** INV-14, INV-15, INV-06, D-009.

### REQ-F-16: Editar o eliminar pedido
* **Tipo:** Evento
* **Disparador:** El dueño edita o elimina un pedido.
* **Precondición:** El pedido está en `PENDING`.
* **Sintaxis EARS:**
  > **WHEN** the owner edits a `PENDING` order, **THEN** the system **SHALL** recalculate the reserved quantities with the new lines.

  > **WHEN** the owner confirms the deletion of a `PENDING` order, **THEN** the system **SHALL** delete it and release its reserved quantities.
* **Origen:** D-022, INV-27.

### REQ-F-17: Entregar pedido ★
* **Tipo:** Evento
* **Disparador:** El dueño marca un pedido como Entregado.
* **Precondición:** El pedido está en `PENDING`.
* **Sintaxis EARS:**
  > **WHEN** the owner marks an `Order` as `DELIVERED`, **IF** the stock on hand of any catalog product is lower than the quantity in the order, **THEN** the system **SHALL** block the delivery, keep the order as `PENDING` and display "Solo hay X de {producto}".

  > **WHEN** the owner marks an `Order` as `DELIVERED` and the stock is enough, **THEN** the system **SHALL** create a `Sale` for the order total (advance payment + balance) dated with the actual date when it is marked, subtract the catalog products from the stock on hand and release the reservation.
* **Nota:** al entregar, el pedido usa sus propias unidades apartadas; por eso se compara con la existencia y no con el disponible para vender. Los artículos personalizados se incluyen en el total sin afectar el inventario.
* **Origen:** INV-16, D-029.

### REQ-F-18: Cancelar pedido
* **Tipo:** Evento
* **Disparador:** El dueño marca un pedido como Cancelado.
* **Precondición:** El pedido está en `PENDING`.
* **Sintaxis EARS:**
  > **WHEN** the owner marks an `Order` as `CANCELLED`, **THEN** the system **SHALL** release its reserved quantities and allow the owner to record a note about the advance payment, without using it in any calculation.
* **Origen:** INV-17, INV-18.

---

## 7. Reporte

### REQ-F-19: Reporte por día o mes
* **Tipo:** Evento
* **Disparador:** El dueño abre el reporte y elige un período.
* **Precondición:** Ninguna.
* **Sintaxis EARS:**
  > **WHEN** the owner selects a day or a month in the report, **THEN** the system **SHALL** display the total sold, the total expenses broken down into `SUPPLIES` and `SERVICES`, and the profit (total sold − total expenses) for that period.
* **Nota:** la ganancia puede ser negativa. Las salidas de inventario no cuentan como venta ni como gasto (INV-21).
* **Origen:** INV-19, D-010.

---

## 8. Validaciones y casos de borde (RC-04)

### REQ-F-20: Campos vacíos
* **Tipo:** Validación
* **Disparador:** El dueño intenta guardar cualquier formulario.
* **Precondición:** Formulario activo.
* **Sintaxis EARS:**
  > **WHEN** the owner tries to save a form, **IF** a required field is empty or contains only spaces, **THEN** the system **SHALL** block the save and display an error message next to that field, keeping the rest of the entered data.
* **Origen:** INV-02, D-026.

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
* **Disparador:** El dueño guarda un producto, un insumo o una línea de pedido.
* **Precondición:** Formulario activo.
* **Sintaxis EARS:**
  > **WHEN** the owner saves a `Product` or a `Supply`, **IF** another one already has the same name (ignoring uppercase, lowercase and extra spaces), **THEN** the system **SHALL** block the save and display "Ya existe un {producto/insumo} con ese nombre".

  > **WHEN** the owner adds to an `Order` a catalog product that is already in the order, **THEN** the system **SHALL** add the quantity to the existing line instead of creating a new one.
* **Origen:** INV-04, INV-05, INV-06, D-011.

### REQ-F-23: Fechas
* **Tipo:** Validación
* **Disparador:** El dueño guarda un registro con fecha.
* **Precondición:** Formulario activo.
* **Sintaxis EARS:**
  > **WHEN** the owner saves a `Sale`, `Expense`, `Production` or `StockOut`, **IF** its date is later than today, **THEN** the system **SHALL** block the save and display "La fecha no puede ser futura".

  > **WHEN** the owner creates or edits a `PENDING` order, **IF** the delivery date and time are earlier than now, **THEN** the system **SHALL** block the save and display "La entrega debe ser hoy o en el futuro".
* **Origen:** INV-26, INV-27, D-027, D-028.

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
| RNF-10 | Montos en colones guardados como céntimos enteros y mostrados con 2 decimales. | D-025 |

---

## 10. Cobertura de RC-02

| REQ | Regla de negocio compleja |
|---|---|
| REQ-F-02 | Producto o insumo con historial: se desactiva en lugar de eliminarse |
| REQ-F-09 | Gasto de Insumos: suma automáticamente al inventario |
| REQ-F-12 | Venta: se bloquea completa si una línea supera lo disponible para vender |
| REQ-F-14 | Eliminar venta: devuelve unidades; si viene de un pedido, este vuelve a Pendiente |
| REQ-F-15 | Pedido: aparta unidades aunque no alcancen y muestra lo que falta |
| REQ-F-17 | Entregar pedido: venta automática con fecha real o bloqueo si no hay existencias |

Seis reglas; el curso pide mínimo tres.
