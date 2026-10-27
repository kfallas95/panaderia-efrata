# CLAUDE.md — Memoria semántica del proyecto

> Fuente de verdad para cualquier agente o colaborador que trabaje en este proyecto.
> Solo se registra lo definido por el autor o lo que aparece en los artefactos fuente.
> Cada dato indica su origen. Lo no definido se marca **PENDIENTE** y no se asume.

**Versión:** 1.1 (2026-10-26: auditoría del paso 7) · **Fecha:** 2026-10-26

**Etiquetas de origen:** `[Autor]` decisión del autor en conversación · `[P §n]` `docs/propuesta.md` · `[RC-xx]` requisito del curso (`docs/propuesta.md` §6) · `D-xxx` decisión registrada (§9).

> Las filas marcadas **PROPUESTA** fueron sugeridas por el agente y están pendientes de aprobación del autor.

---

## 1. Contexto del proyecto

- **Producto:** aplicación web **"Panadería Efrata"**. `[P §1]`
- **Usuario:** el **dueño** de la panadería, único usuario. Trabaja solo, desde su casa. `[P §1]`
- **Propósito:** llevar el control de **gastos, ventas, inventario y pedidos**. Los cuatro módulos tienen la misma prioridad. `[P §1]`
- **Moneda:** solo **colones (₡)**, con decimales. `[P §1]`
- **Metodología:** Spec Driven Development (SDD). Se especifica y aprueba antes de implementar. `[Autor]`

### Artefactos

| Artefacto | Rol | Estado |
|---|---|---|
| `docs/propuesta.md` | Documento fuente: alcance, módulos, reglas, identidad visual y requisitos del curso | ✅ v1.1 (nota de vigencia, C-01) |
| `CLAUDE.md` | Memoria semántica: lenguaje ubicuo, invariantes, decisiones, preguntas abiertas | ✅ v1.1 (auditoría del paso 7) |
| `system_prompt.md` | Reglas de contexto para agentes de IA (RC-03) | ✅ v1.2 (auditoría del paso 7) |
| `docs/requirements.md` | Requerimientos en EARS, completos en inglés (RC-02) | ✅ v1.9 |
| `docs/data-contract.json` | Contrato de datos (JSON Schema) | ✅ v1.2 |
| `docs/wireframe.md` | Wireframes | ✅ v1.3 |
| `docs/design.md` | Arquitectura, módulos, estado y trazabilidad | ✅ v1.2 |
| `docs/REFLECTION.md` | Reflexión del proyecto (reemplaza la retrospectiva del paso 6; D-068, D-086) | Al final del proyecto |
| `docs/tasks.md` | Plan por fases con Unchanged Behavior | ✅ v1.0 |

---

## 2. Reglas de colaboración (obligatorias para el agente)

1. **No inventar información.** Todo contenido viene del autor o de los artefactos fuente.
2. **Preguntar ante cualquier vacío** antes de asumir. Las propuestas se marcan `PROPUESTA — pendiente de aprobación`.
3. **El autor toma las decisiones.** El agente presenta opciones con trade-offs; el autor elige.
4. **Trazabilidad.** Toda decisión se registra en §9 con su motivo.
5. **Lenguaje ubicuo.** Usar exactamente los términos de §3; no crear sinónimos.
6. **Idioma.** Código, contrato de datos y lenguaje ubicuo en inglés; interfaz en español (R6). Requerimientos EARS completos en inglés; el resto de la documentación en español (D-012).
7. **Conflictos entre fuentes** se registran en §10 y no se resuelven sin el autor.
8. **Paso a paso.** No se avanza al siguiente paso SDD sin la aprobación explícita del autor.

---

## 3. Lenguaje ubicuo (aprobado, D-015)

### 3.1 Entidades

| Término (código) | Término (UI) | Significado | Origen |
|---|---|---|---|
| `Product` | Producto | Artículo del catálogo que se vende, con precio fijo | `[P §3.1]` |
| `Supply` | Insumo | Materia prima (harina, azúcar…) con su propia unidad | `[P §3.3]` |
| `Expense` | Gasto | Gasto registrado, de categoría Insumos o Servicios | `[P §3.4]` |
| `Sale` | Venta | Venta registrada; puede incluir varios productos (D-016) | `[P §3.5]` · D-016 |
| `SaleItem` | Línea de la venta | Producto, cantidad y precio dentro de una venta | D-016 · D-019 |
| `Order` | Pedido | Encargo de un cliente | `[P §3.6]` |
| `OrderItem` | Línea del pedido | Producto del catálogo o artículo personalizado dentro de un pedido | `[P §3.6]` |
| `CatalogOrderItem` | Línea de catálogo | `OrderItem` con `productId`; aparta unidades | `data-contract.json` · D-081 |
| `CustomOrderItem` | Artículo personalizado | `OrderItem` con descripción, cantidad y precio libres; no pasa por inventario. En una venta de pedido se guarda en `customItems` | `data-contract.json` · D-042 · D-081 |
| `Production` | Producción | Registro de "hice X" que suma al inventario de un producto | `[P §3.2]` |
| `StockOut` | Salida de inventario | Unidades de un producto que salen sin venderse, con motivo (D-020) | D-018 · D-020 |
| `StockCount` | Conteo físico | Registro que reemplaza la cantidad de un insumo por la real | `[P §3.3]` |

> **Nota:** `Production` y `StockCount` son entidades con historial (D-022, D-024).

**Convención de nombres (heredada del proyecto anterior):** entidades en `PascalCase`; campos en `camelCase`; enumeraciones en `UPPER_SNAKE_CASE`.

### 3.2 Valores calculados (no se guardan)

| Término (código) | Término (UI) | Fórmula | Origen |
|---|---|---|---|
| `stockOnHand` | En existencia | Unidades físicas del producto | `[P §3.2]` |
| `reservedQuantity` | Apartado | Σ cantidades del producto en pedidos `PENDING` | `[P §3.2]` |
| `availableToSell` | Disponible para vender | `max(0, stockOnHand − reservedQuantity)` (D-051) | `[P §3.2]` |
| `missingToProduce` | Faltan por producir | Unidades de un pedido no cubiertas por la existencia, asignando primero a los pedidos en plazo (hora de entrega + 2 h) por entrega más próxima y, si empatan, al registrado antes; después a los que superaron el margen (D-050, D-053, D-063) | `[P §3.6]` |
| `totalSold` | Total vendido | Σ ventas del período | `[P §3.7]` |
| `totalExpenses` | Total de gastos | Σ gastos del período (desglose Insumos / Servicios) | `[P §3.7]` |
| `profit` | Ganancia | `totalSold − totalExpenses` (puede ser negativa) | `[P §3.7]` |

> Las existencias **se calculan** (D-036): `stockOnHand` = Σ `Production` − Σ `SaleItem` − Σ `StockOut`. Cantidad de un `Supply` = `newQuantity` del último `StockCount` + Σ compras `SUPPLIES` con fecha y hora (al minuto) estrictamente posteriores a ese conteo (D-037, D-041, D-075).

### 3.3 Enumeraciones

| Constante (código) | Etiqueta (UI) | Origen |
|---|---|---|
| `ExpenseCategory`: `SUPPLIES`, `SERVICES` | Insumos, Servicios | `[P §3.4]` |
| `SupplyUnit`: `KG`, `G`, `L`, `ML`, `UNIT` | kg, g, L, ml, unidad | D-039 · D-045 |
| `OrderStatus`: `PENDING`, `DELIVERED`, `CANCELLED` | Pendiente, Entregado, Cancelado | `[P §3.6]` |
| `StockOutReason`: `REUSED`, `GIVEN_AWAY` | Reutilizado, Regalado | D-020 |
| `ReportPeriod`: `DAY`, `MONTH` | Día, Mes | `[P §3.7]` |

### 3.4 Relaciones (RC-01a)

```
Sale     1 ──< SaleItem        una venta tiene una o más líneas (D-016)
Product  1 ──< SaleItem
Product  1 ──< OrderItem       las líneas personalizadas no tienen Product
Order    1 ──< OrderItem
Order    1 ──o Sale            al entregar, el pedido genera una venta
Supply   1 ──< Expense         solo gastos SUPPLIES
Product  1 ──< Production
Product  1 ──< StockOut
Supply   1 ──< StockCount
```

---

## 4. Invariantes y reglas del dominio

| ID | Regla | Origen |
|---|---|---|
| INV-01 | Ningún inventario (productos ni insumos) queda en negativo. Si una operación supera lo disponible, se bloquea con "Solo hay X…". | `[P §4]` |
| INV-02 | Campos vacíos se rechazan, con mensaje visible junto al campo. Únicos opcionales: `Order` notas, adelanto y nota de cancelación; en el formulario de producción, las casillas vacías se ignoran (debe haber al menos una cantidad). | `[P §4]` · RC-04 · D-026 · D-076 |
| INV-03 | Precios, montos y cantidades deben ser **> 0**. Excepción: el conteo físico admite **0**. | `[P §4]` · RC-04 |
| INV-04 | No existen dos `Product` con el mismo nombre. | `[P §4]` · RC-04 |
| INV-05 | No existen dos `Supply` con el mismo nombre. | `[P §4]` · RC-04 |
| INV-06 | Un `Order` no tiene dos `OrderItem` del mismo `Product`, ni una `Sale` dos `SaleItem` del mismo `Product`; la cantidad se suma en una sola línea. | `[P §4]` · RC-04 · D-069 |
| INV-07 | Cada `Supply` tiene su propia unidad; no se cambia si el insumo tiene historial (D-102). | `[P §3.3]` |
| INV-08 | Un `Expense` `SUPPLIES` indica insumo, cantidad y monto, y **suma** la cantidad al `Supply`. Un `Expense` `SERVICES` no afecta inventario. | `[P §3.4]` |
| INV-09 | Un `StockCount` **reemplaza** la cantidad del `Supply` por la real. | `[P §3.3]` |
| INV-10 | Producir **no** descuenta insumos (sin recetas). | `[P §3.3]` |
| INV-11 | `Production` suma unidades al `stockOnHand` del producto. | `[P §3.2]` |
| INV-12 | Una `Sale` normal descuenta cada producto de sus `SaleItem` y no puede usar unidades apartadas: cantidad de cada línea ≤ `availableToSell`. | `[P §3.5]` · D-016 |
| INV-13 | El precio de `Product` se copia en la venta o la línea del pedido y es editable para ese caso. | `[P §3.1]` |
| INV-14 | Un `Order` `PENDING` aparta unidades de cada producto del catálogo; siempre se puede crear y, si no alcanzan, muestra "Faltan X por producir". | `[P §3.6]` |
| INV-15 | Los `OrderItem` personalizados tienen descripción y precio libre y no pasan por inventario. | `[P §3.6]` |
| INV-16 | Al pasar a `DELIVERED`: se crea una `Sale` por el total del pedido (adelanto + saldo) con la **fecha real** en que se marca Entregado (D-029) y se descuentan los productos. Solo se entrega si el pedido no tiene faltantes según la prioridad; si no, se bloquea con "Faltan X {producto} por producir para este pedido". | `[P §3.6]` · D-029 · D-063 · D-066 |
| INV-17 | El adelanto solo se anota; no es venta hasta la entrega. | `[P §3.6]` |
| INV-18 | Al pasar a `CANCELLED`: se liberan las unidades apartadas; lo ocurrido con el adelanto solo se anota y no se calcula. | `[P §3.6]` |
| INV-19 | Reporte por `DAY` o `MONTH`: `totalSold`, `totalExpenses` (Insumos / Servicios) y `profit`. | `[P §3.7]` |
| INV-20 | Al **eliminar** una `Sale`, las unidades de sus líneas **vuelven** al inventario. | D-017 |
| INV-21 | Un `StockOut` resta unidades del producto con motivo `REUSED` o `GIVEN_AWAY`; no cuenta como venta ni como gasto. Cantidad ≤ `availableToSell` (INV-01). | D-020 |
| INV-22 | Eliminar la `Sale` de un pedido entregado devuelve las unidades y regresa el `Order` a `PENDING` (vuelve a apartar). | D-021 |
| INV-23 | Se pueden editar ventas, editar o eliminar gastos, producciones y pedidos, y eliminar salidas (D-098). El inventario se ajusta por la diferencia; si el ajuste lo dejaría en negativo, se bloquea (INV-01). Los conteos físicos no se editan ni se eliminan. | D-022 |
| INV-24 | Un `Product` o `Supply` con historial no se elimina: se desactiva (`isActive = false`) y no aparece para nuevas operaciones. Sin historial, se puede eliminar. Un `Product` en pedidos `PENDING` no se puede desactivar ni eliminar. | D-023 · D-074 |
| INV-25 | Cada `StockCount` guarda fecha, cantidad anterior y cantidad nueva. | D-024 |
| INV-26 | Ventas, gastos, producciones y salidas admiten fecha **pasada o de hoy**; nunca futura. | D-027 |
| INV-27 | Al crear un `Order` o al **cambiar** la fecha u hora de entrega de uno `PENDING`, la nueva entrega debe ser **hoy o futura**. Editar otros datos no lo exige. | D-028 · D-073 |

---

## 5. Restricciones técnicas

| # | Restricción | Origen |
|---|---|---|
| R1 | IndexedDB; un usuario por navegador, sin backend ni login | `[P §2]` · RC-01b |
| R2 | Sin servicios externos en tiempo de ejecución | `[P §2]` |
| R3 | JavaScript sin framework de UI | `[P §2]` |
| R4 | Sin build: módulos ES nativos y Live Server | `[P §2]` |
| R5 | Verificación manual, sin pruebas automatizadas | `[P §2]` |
| R6 | Código, contrato y lenguaje ubicuo en inglés; interfaz en español | `[P §2]` |
| R7 | Mobile-first y responsive | `[P §2]` |
| R8 | Arquitectura en capas (UI, Estado, Aplicación, Dominio, Infraestructura) con patrón repositorio | `[P §2]` |

---

## 6. Identidad visual

- **Paleta "Horno cálido":** crema `#FBF5EC` (fondo) · café `#6B4226` (texto) · dorado trigo `#D4A24C` (acento y botón principal). `[P §5]`
- Títulos en serif; tarjetas redondeadas. `[P §5]`
- Ilustraciones SVG propias guardadas en el proyecto: encabezado, pantallas vacías e íconos de sección. `[P §5]`
- **Tonos de apoyo (D-088):** tarjetas `#FFFFFF`, bordes `#EADBC4`, texto secundario `#8A6A52`, texto sobre dorado `#3E2614`; rojo de error `#B3261E` (errores, "Atrasado", montos negativos).
- **Ilustraciones (D-089, D-090):**
  - Espiga: encabezado y favicon.
  - Croissant: Pedidos y Ventas vacíos.
  - Pan: Inventario y Gastos vacíos.
  - Son solo decorativas; la acción la tiene el botón.

---

## 7. Pantallas y navegación

### 7.1 Navegación (D-046)

```
Panadería Efrata                 (pantalla inicial: Pedidos)
 ├─ Pedidos     Pendientes · Entregados · Cancelados      (+) Nuevo pedido
 ├─ Ventas      agrupadas por día con total               (+) Nueva venta
 ├─ Inventario  Productos · Insumos · Desactivados        (+) menú: Producción, Salida,
 │                                                             Conteo, Nuevo producto, Nuevo insumo
 ├─ Gastos      chips Todos · Insumos · Servicios         (+) Nuevo gasto
 └─ Reporte     Día / Mes                                 sin (+)
```

- **Celular:** barra inferior con 5 secciones y botón flotante (+) según la sección (D-046).
- **Computadora:** menú lateral; mismo contenido (R7).
- **Encabezado:** espiga SVG + "Panadería Efrata" (D-014).

### 7.2 Contenido de las pantallas (D-047)

| Pantalla | Contenido |
|---|---|
| Pedidos | Pestañas Pendientes (entrega más próxima primero) · Entregados · Cancelados (más reciente primero según `closedAt`, D-071). Tarjeta: cliente, entrega, total, adelanto, saldo, "Faltan X {producto} por producir" en dorado y "Atrasado" en rojo (D-049). Detalle (solo `PENDING`; los demás son de lectura, D-071): Entregar, Cancelar, Editar, Eliminar. |
| Ventas | Agrupadas por día (más reciente primero) con total del día. Etiqueta "Pedido de {cliente}" si viene de un pedido. Tocar → editar o eliminar. |
| Inventario | Pestañas Productos (existencia, apartado, disponible) e Insumos (cantidad y unidad). Sección plegable "Desactivados" con opción de reactivar (D-048). Tocar → detalle con historial y acciones. |
| Gastos | Chips Todos · Insumos · Servicios; agrupados por día con total. Tocar → editar o eliminar. |
| Reporte | Selector Día / Mes + fecha; tarjetas Total vendido, Total de gastos (Insumos / Servicios) y Ganancia (roja si es negativa). |

---

## 8. Persistencia

- **IndexedDB** del navegador (R1). Un navegador = un cliente; sin usuarios ni login.
- **Acceso a datos:** la lógica de dominio nunca accede directamente a IndexedDB; lo hace mediante repositorios (R8). Los repositorios son **asíncronos**.
- **Limitaciones aceptadas:** un solo dispositivo y navegador, sin sincronización; los datos se pierden si el cliente borra los datos de navegación.
- **Montos:** colones guardados como **céntimos enteros** (₡1 250,50 → 125050); la UI muestra y recibe colones con 2 decimales (D-025).
- **Cantidades de insumo:** milésimas enteras de su unidad (2,5 kg → 2500); la UI muestra hasta 3 decimales (D-075).

---

## 9. Registro de decisiones

| ID | Decisión | Fecha |
|---|---|---|
| D-001 | El producto se llama "Panadería Efrata". Usuario único: el dueño. | 2026-10-26 |
| D-002 | Módulos: gastos, ventas, inventario y pedidos, con la misma prioridad. Se agrega reporte (D-010). | 2026-10-26 |
| D-003 | Moneda: solo colones (₡), con decimales. | 2026-10-26 |
| D-004 | Persistencia en IndexedDB (cambia respecto al proyecto anterior: el curso permite LocalStorage, IndexedDB o base de datos ligera). R2–R8 sin cambios. | 2026-10-26 |
| D-005 | Pedido = encargo de un cliente, con cliente, teléfono, productos, fecha y hora de entrega, notas y adelanto. Estados: Pendiente, Entregado, Cancelado. | 2026-10-26 |
| D-006 | Dos inventarios separados: insumos y productos terminados. Catálogo de productos con producción por cantidad. | 2026-10-26 |
| D-007 | Inventario de insumos, opción B: sin recetas; compras suman y el conteo físico reemplaza la cantidad. **Revisable** si el autor no queda satisfecho. | 2026-10-26 |
| D-008 | Nada en negativo; operaciones que lo provoquen se bloquean con "Solo hay X…". | 2026-10-26 |
| D-009 | Pedidos, opción b: apartan unidades y muestran "Faltan X por producir"; al entregar generan una venta automática; personalizados permitidos; el adelanto cuenta al entregar; si se cancela, el adelanto solo se anota y se libera lo apartado. | 2026-10-26 |
| D-010 | Reporte por día o mes: total vendido, total de gastos (Insumos / Servicios) y ganancia. | 2026-10-26 |
| D-011 | Validación: vacíos rechazados; valores > 0 salvo el conteo físico (admite 0); sin duplicados de nombre de producto, de nombre de insumo ni de producto dentro de un pedido. | 2026-10-26 |
| D-012 | Requerimientos EARS completos en inglés (WHEN / IF / THEN the system SHALL); el resto de la documentación en español. | 2026-10-26 |
| D-013 | Archivo de reglas de contexto: `system_prompt.md` en la raíz; se crea en el paso 1 y se completa en el paso 5. | 2026-10-26 |
| D-014 | Identidad visual: paleta "Horno cálido" e ilustraciones SVG propias (encabezado, pantallas vacías, íconos de sección). | 2026-10-26 |
| D-015 | Se aprueba el lenguaje ubicuo de §3. | 2026-10-26 |
| D-016 | Una venta puede incluir varios productos. | 2026-10-26 |
| D-017 | Al eliminar una venta, sus unidades vuelven al inventario. | 2026-10-26 |
| D-018 | Los productos no vendidos salen del inventario porque se reutilizan para otros productos o se regalan (mecanismo: Q-09). | 2026-10-26 |
| D-019 | Se aprueba `SaleItem` (línea de la venta). | 2026-10-26 |
| D-020 | Productos no vendidos: salida con motivo (`StockOut`: Reutilizado / Regalado). No es venta ni gasto. | 2026-10-26 |
| D-021 | La venta de un pedido entregado se puede eliminar; el pedido vuelve a Pendiente. | 2026-10-26 |
| D-022 | Editables: ventas; editables y eliminables: gastos, producciones y pedidos. Ajustes de inventario sin quedar en negativo. | 2026-10-26 |
| D-023 | Un producto o insumo con historial no se elimina: se **desactiva** (no aparece para nuevas operaciones; historial y reportes se conservan). Sin historial, se puede eliminar. | 2026-10-26 |
| D-024 | El conteo físico guarda historial: fecha, cantidad anterior y cantidad nueva. | 2026-10-26 |
| D-025 | Montos en colones guardados como céntimos enteros. | 2026-10-26 |
| D-026 | En `Order`, notas y adelanto son opcionales; cliente, teléfono, productos, fecha y hora de entrega son obligatorios. | 2026-10-26 |
| D-027 | Ventas, gastos, producciones y salidas: fecha pasada o de hoy, nunca futura (permite registrar olvidos). | 2026-10-26 |
| D-028 | Entrega de pedidos: hoy o futura. | 2026-10-26 |
| D-029 | La venta de un pedido entregado usa la fecha real en que se marca Entregado (el reporte coincide con el dinero recibido ese día). Si se marca tarde, la fecha de la venta se puede editar (D-022, D-027). | 2026-10-26 |
| D-030 | Se aprueba `docs/requirements.md` v1.0: REQ-F-01 a REQ-F-23 y RNF-01 a RNF-10. RC-02 se cubre con 6 reglas (REQ-F-02, 09, 12, 14, 15, 17). | 2026-10-26 |
| D-031 | Venta: si una línea supera lo disponible para vender, se bloquea toda la venta (no se guarda a medias). | 2026-10-26 |
| D-032 | ~~Reemplazada por D-063.~~ Entregar pedido: se compara con la existencia (el pedido usa sus unidades apartadas). Si no alcanza, se bloquea todo el pedido; no hay entregas parciales. | 2026-10-26 |
| D-033 | Solo se cancela un pedido `PENDING`. Para deshacer uno entregado se elimina su venta y vuelve a `PENDING` (D-021). | 2026-10-26 |
| D-034 | Duplicados: la comparación de nombres ignora mayúsculas, minúsculas y espacios extra. | 2026-10-26 |
| D-035 | Se aprueban los mensajes de error en español de `docs/requirements.md` (p. ej. "Solo hay X disponibles de {producto}", "Solo se admiten valores mayores a 0", "La fecha no puede ser futura"). | 2026-10-26 |
| D-036 | Las existencias de productos e insumos se calculan a partir de los movimientos; no se guardan. | 2026-10-26 |
| D-037 | Una compra de insumo con fecha y hora anteriores al último conteo físico no suma al inventario (el conteo ya la incluye); sí cuenta en el reporte. | 2026-10-26 |
| D-038 | Cantidades: productos en enteros; insumos con decimales. | 2026-10-26 |
| D-039 | Unidad de insumo de lista fija: kg, g, L, ml, unidad. | 2026-10-26 |
| D-040 | La descripción del gasto es obligatoria en Insumos y en Servicios. | 2026-10-26 |
| D-041 | El conteo físico y el gasto guardan hora para decidir si una compra es posterior al conteo. | 2026-10-26 |
| D-042 | Los artículos personalizados del pedido llevan cantidad y precio unitario. | 2026-10-26 |
| D-043 | El adelanto no puede superar el total del pedido. | 2026-10-26 |
| D-044 | Teléfono del cliente: 8 dígitos de Costa Rica; se acepta con o sin guion y se guarda sin guion. Se agrega REQ-F-24 (`requirements.md` v1.1). | 2026-10-26 |
| D-045 | Se aprueba `docs/data-contract.json` v1.0: insumos con hasta 3 decimales; hora del gasto por defecto la actual; la venta de un pedido copia sus artículos personalizados (`customItems`); unidades `KG`, `G`, `L`, `ML`, `UNIT`. | 2026-10-26 |
| D-046 | Navegación A: Pedidos (inicial) · Ventas · Inventario · Gastos · Reporte; botón (+) según la sección; menú lateral en computadora. | 2026-10-26 |
| D-047 | Contenido de pantallas según §7.2. | 2026-10-26 |
| D-048 | Productos e insumos desactivados se listan en "Desactivados" y se pueden reactivar. Se agrega REQ-F-25. | 2026-10-26 |
| D-049 | Pedido pendiente con entrega vencida se destaca en rojo como "Atrasado" (solo visual). Se agrega REQ-F-26. | 2026-10-26 |
| D-050 | *(Refinada por D-063.)* Faltantes de pedidos: la existencia se asigna primero a los pedidos con la entrega más próxima; el faltante se muestra en los siguientes. | 2026-10-26 |
| D-051 | Disponible para vender se muestra como 0 cuando lo apartado supera la existencia; nunca negativo. | 2026-10-26 |
| D-052 | Mensaje de campo vacío: "Este campo es obligatorio". | 2026-10-26 |
| D-053 | Empate en la entrega: se cubre primero el pedido registrado antes. Se agrega `Order.createdAt` (`data-contract.json` v1.1). | 2026-10-26 |
| D-054 | Se aprueba `docs/wireframe.md` v1.0. | 2026-10-26 |
| D-055 | Router por hash (`docs/design.md` §3.1). | 2026-10-26 |
| D-056 | Operaciones que tocan varios stores se guardan en una sola transacción de IndexedDB (todo o nada). | 2026-10-26 |
| D-057 | Fecha simulada `?today=YYYY-MM-DD&time=HH:MM` para pruebas manuales, con aviso "Fecha simulada · Volver a la fecha real". | 2026-10-26 |
| D-058 | Números: coma o punto como separador decimal, sin separadores de miles; máximo 2 decimales en montos, 0 en productos y 3 en insumos. Mensajes: "Escribe un número válido, por ejemplo 1250,50" y "Usa máximo {n} decimales". | 2026-10-26 |
| D-059 | Store en memoria hidratado desde IndexedDB al arrancar; selectores para todo lo derivado. | 2026-10-26 |
| D-060 | Esquema IndexedDB `panaderiaEfrata` v1 (`docs/design.md` §5.4). | 2026-10-26 |
| D-061 | Estructura de carpetas y convenciones de archivos (`docs/design.md` §4); completa `system_prompt.md` (v1.1). | 2026-10-26 |
| D-062 | Re-render cada 60 s con la app visible para mostrar "Atrasado" a tiempo. | 2026-10-26 |
| D-063 | Prioridad de pedidos: primero los que están en plazo (hora de entrega + 2 h de margen), por entrega más próxima y fecha de registro; después los que superaron el margen. Un pedido solo se entrega si no tiene faltantes. Reemplaza D-032. Motivo: si un pedido se atrasa no se sabe cuándo se entregará, y no debe bloquear al siguiente. | 2026-10-26 |
| D-064 | Si el cliente avisa que se atrasará, el dueño reprograma la entrega editando el pedido; la prioridad se recalcula con la nueva fecha. | 2026-10-26 |
| D-065 | "Atrasado" aparece al pasar la hora de entrega; la prioridad se pierde 2 horas después. | 2026-10-26 |
| D-066 | Mensaje al entregar con faltantes: "Faltan X {producto} por producir para este pedido". | 2026-10-26 |
| D-067 | Se aprueba `docs/design.md` v1.0. | 2026-10-26 |
| D-068 | El paso 6 (retrospectiva) se reemplaza por `REFLECTION.md` y se hace al final del proyecto. | 2026-10-26 |
| D-069 | Una venta no tiene dos líneas del mismo producto; si se repite, se suma a la misma línea (evita inventario negativo). INV-06 se extiende a `Sale`. | 2026-10-26 |
| D-070 | Se quita el índice `nameKey` del diseño; los duplicados se validan en el dominio y el contrato no cambia. | 2026-10-26 |
| D-071 | Pedidos `DELIVERED` y `CANCELLED` son solo de lectura; para deshacer una entrega se elimina su venta (D-021). Se agrega `Order.closedAt` para ordenarlos. | 2026-10-26 |
| D-072 | En una venta que viene de un pedido solo se edita la fecha; para cambiar productos se elimina la venta, se edita el pedido y se entrega de nuevo. | 2026-10-26 |
| D-073 | La regla "entrega hoy o futura" se valida solo al crear o al cambiar la fecha u hora de entrega. | 2026-10-26 |
| D-074 | Un producto en pedidos pendientes no se puede desactivar ni eliminar: "{producto} está en pedidos pendientes". | 2026-10-26 |
| D-075 | Cantidades de insumo en milésimas enteras; una compra suma después de un conteo solo si su minuto es estrictamente posterior al del conteo. | 2026-10-26 |
| D-076 | Formulario de producción: "Ingresa al menos una cantidad" si todas las casillas están vacías. La nota de cancelación es opcional. | 2026-10-26 |
| D-077 | Inventario de productos: "Faltan X por producir" con X = apartado − existencia cuando lo apartado supera la existencia. | 2026-10-26 |
| D-078 | Se agregan REQ-F-27 (adelanto ≤ total) y REQ-F-28 (lectura de números) y la descripción obligatoria en REQ-F-09 y REQ-F-10. | 2026-10-26 |
| D-079 | La fecha simulada (D-057) avanza desde la hora indicada; no queda fija. | 2026-10-26 |
| D-080 | La existencia se valida sobre el total, no en el tiempo: una venta con fecha anterior a su producción es válida si el total alcanza. | 2026-10-26 |
| D-081 | Correcciones editoriales de la auditoría (paso 7): nota de vigencia en la propuesta (C-01), ejemplos coherentes, referencias, términos `SupplyUnit`, `CatalogOrderItem`, `CustomOrderItem`, rutas faltantes, `now` como parámetro del dominio, `add` en repositorios y REQ-F-11 marcada como defensiva. | 2026-10-26 |
| D-082 | Mensaje de entrega en el pasado: "La entrega no puede estar en el pasado" (reemplaza "La entrega debe ser hoy o en el futuro"). Cierra el paso 7. | 2026-10-26 |
| D-083 | Cantidad de producto con decimales: mensaje "Escribe un número entero" (en lugar de "Usa máximo 0 decimales"). | 2026-10-26 |
| D-084 | Montos negativos se muestran con el signo menos antes del símbolo: "−₡13 000,50", en rojo. | 2026-10-26 |
| D-085 | Se aprueba `docs/tasks.md` v1.0: fases 0 a 11 con Unchanged Behavior y verificación con fecha simulada. Se cierra la especificación (paso 8). | 2026-10-26 |
| D-086 | `REFLECTION.md` va en la carpeta `docs/` (precisa D-068). El repositorio Git se crea ahora, antes de la Fase 0. | 2026-10-26 |
| D-087 | Repositorio `github.com/kfallas95/panaderia-efrata` sin `.gitignore` ni `.gitattributes`; las exclusiones (`Claude outputs/`, archivos del sistema, `.vscode/`) viven en `.git/info/exclude`, solo en la computadora del autor. | 2026-10-26 |
| D-088 | Tonos de apoyo de la paleta (tomados de la muestra aprobada) y rojo de error `#B3261E`. | 2026-10-26 |
| D-089 | La espiga también se usa como favicon (ícono de la pestaña). | 2026-10-26 |
| D-090 | Pantallas vacías: croissant en Pedidos y Ventas; pan en Inventario y Gastos. Las ilustraciones son solo decorativas. | 2026-10-26 |
| D-091 | Fase 0 verificada por el autor y aprobada (commit `Fase 0: esqueleto del proyecto`). | 2026-10-26 |
| D-092 | Fase 1 verificada por el autor y aprobada (commit `Fase 1: dominio puro`; 63 casos comprobados). | 2026-10-26 |
| D-093 | Fase 2 verificada por el autor y aprobada (commit `Fase 2: infraestructura`). Se agregan a `messages.js` los textos de almacenamiento de design §5 ("No se puede guardar información en este navegador", "No se pudo guardar. Intenta de nuevo."). | 2026-10-26 |
| D-094 | Fase 3 verificada por el autor y aprobada (commit `Fase 3: estado`). | 2026-10-26 |
| D-095 | Fase 4 (UI base): textos de estados vacíos "Aún no tienes ventas", "Aún no tienes productos", "Aún no tienes insumos" y "Aún no tienes gastos"; Reporte sin ilustración; aviso de fecha simulada en amarillo suave `#FFF3C4` con borde dorado; el botón (+) solo en las listas; en computadora "+ Nuevo pedido", "+ Nueva venta", "+ Nuevo gasto" e Inventario "+ Nuevo" con menú; formularios aún no construidos muestran "← Título". | 2026-10-26 |
| D-096 | Fase 4 verificada por el autor y aprobada (commit `Fase 4: UI base`). | 2026-10-26 |
| D-097 | Las producciones se editan o eliminan desde el historial del detalle del producto; editar abre `#/inventory/production/{id}/edit` (fecha y cantidad). | 2026-10-26 |
| D-098 | Las salidas de inventario se pueden **eliminar** (la existencia vuelve a subir); no se editan: para corregir una se elimina y se registra de nuevo. Amplía D-022. | 2026-10-26 |
| D-099 | Textos de confirmación: "¿Eliminar {producto}?" (producto sin historial); "{producto} tiene historial; se desactivará y no aparecerá en nuevas ventas ni pedidos" (con historial); "¿Eliminar la producción de {cantidad} {producto} del {fecha}?". | 2026-10-26 |
| D-100 | Fase 5: confirmación "¿Eliminar la salida de {cantidad} {producto} del {fecha}?"; textos de apoyo "No hay productos desactivados", "Sin movimientos", "Escribe cuántas unidades hiciste de cada producto." y etiqueta "Desactivado"; "Faltan X por producir" en dorado oscuro `#8A5A00` sobre `#FBEFD5`; al guardar, producto nuevo y producción vuelven a Inventario, y editar producto, editar producción y salida vuelven al detalle; el historial del producto junta producciones, salidas y ventas (estas últimas solo de lectura). | 2026-10-26 |
| D-101 | Fase 5 verificada por el autor y aprobada (commit `Fase 5: catálogo e inventario de productos`). | 2026-10-26 |
| D-102 | La unidad de un insumo solo se puede cambiar mientras no tenga historial (compras o conteos); después: "La unidad no se puede cambiar porque el insumo ya tiene compras o conteos". Se agrega a REQ-F-07 (`requirements.md` v1.8). | 2026-10-26 |
| D-103 | Textos de confirmación: "¿Eliminar {insumo}?" (sin historial); "{insumo} tiene historial; se desactivará y no aparecerá en nuevos gastos ni conteos" (con historial); "¿Eliminar el gasto {descripción} ({monto})?". | 2026-10-26 |
| D-104 | Fase 6: filtro de gastos sin resultados "No hay gastos en esta categoría"; textos "No hay insumos desactivados", "Registrado: {cantidad} {unidad}" y "Cantidad real ({unidad})"; un gasto se edita o elimina desde su formulario ("Eliminar gasto"); al editar un gasto se conserva su insumo aunque esté desactivado; el historial del insumo junta conteos y compras (las compras se editan desde Gastos). | 2026-10-26 |
| D-105 | Fase 6 verificada por el autor y aprobada (commit `Fase 6: insumos y gastos`). | 2026-10-26 |
| D-106 | Una venta sin productos se bloquea con "Agrega al menos un producto". Se agrega a REQ-F-12 (`requirements.md` v1.9). | 2026-10-26 |
| D-107 | Una venta se edita o elimina desde su formulario (botón "Eliminar venta"); confirmación "¿Eliminar la venta de {total} del {fecha}?". Si viene de un pedido se agrega "El pedido de {cliente} volverá a Pendiente". | 2026-10-26 |
| D-108 | Fase 7: "Nueva venta" empieza con una línea y las líneas vacías se ignoran; al editar, el disponible incluye las unidades de esa venta; las líneas repetidas se unen al guardar; las ventas de pedidos llevan la etiqueta "Pedido de {cliente}". | 2026-10-26 |
| D-109 | Fase 7 verificada por el autor y aprobada (commit `Fase 7: ventas`). | 2026-10-26 |
| D-110 | Un pedido sin líneas (ni del catálogo ni personalizadas) se bloquea con "Agrega al menos un producto", igual que una venta (D-106). Se agrega a REQ-F-15 (`requirements.md` v1.10). | 2026-10-26 |
| D-111 | Pestañas de Pedidos sin pedidos: croissant + "Aún no tienes pedidos entregados" y "Aún no tienes pedidos cancelados", sin botón (Pendientes conserva "Aún no tienes pedidos pendientes" + Nuevo pedido). En la Fase 8 el detalle del pedido muestra solo Editar y Eliminar; Entregar y Cancelar se agregan en la Fase 9. | 2026-10-26 |
| D-112 | Fase 8: "Nuevo pedido" empieza con una línea del catálogo y sin personalizados, y las líneas vacías se ignoran; al editar, el disponible incluye lo que el pedido ya apartaba; al guardar, un pedido nuevo vuelve a la lista y uno editado a su detalle; las tarjetas muestran líneas, Total, Adelanto (solo si hay) y Saldo; el re-render cada 60 s y al volver a la pestaña aplica solo a la lista y al detalle de pedidos, nunca a formularios. | 2026-10-26 |
| D-113 | Fase 8 verificada por el autor y aprobada (commit `Fase 8: pedidos`). | 2026-10-27 |
| D-114 | Fase 9: (1) Entregar pide confirmación "¿Marcar como entregado el pedido de {cliente}? Se registrará una venta de {total}"; el bloqueo por faltantes se muestra en rojo debajo del botón Entregar. (2) Cancelar abre "¿Cancelar el pedido de {cliente}?" con el campo "Nota sobre el adelanto (opcional)" y los botones "Cancelar pedido" y "Volver". (3) El detalle de un pedido cerrado muestra "Entregado el {fecha} · {hora}" o "Cancelado el {fecha} · {hora}" y, si la hay, la nota de cancelación. (4) Después de entregar o cancelar se queda en el detalle, ya sin botones. (5) En el formulario de una venta de pedido las líneas y los artículos personalizados se ven bloqueados; solo la fecha se edita. | 2026-10-27 |

---

## 10. Conflictos entre fuentes

| ID | Conflicto | Fuentes | Estado |
|---|---|---|---|
| C-01 | `docs/propuesta.md` §3.6 dice que la venta de un pedido usa "la fecha de entrega" y que se bloquea con "Solo hay X…". Decisiones posteriores lo cambiaron: fecha real (D-029) y bloqueo por faltantes con "Faltan X {producto} por producir para este pedido" (D-063, D-066). | `propuesta.md` vs D-029, D-063, D-066 | Resuelto por D-081: se agrega a la propuesta una nota de vigencia; prevalecen las decisiones registradas. |

---

## 11. Vacíos de información (preguntas abiertas)

| ID | Pregunta | Afecta |
|---|---|---|
| ~~Q-01~~ | **Resuelto por D-016.** | — |
| ~~Q-02~~ | **Resuelto por D-017 y D-022.** | — |
| ~~Q-03~~ | **Resuelto por D-018** (mecanismo en Q-09). | — |
| ~~Q-04~~ | **Resuelto por D-023.** | — |
| ~~Q-05~~ | **Resuelto por D-024.** | — |
| ~~Q-06~~ | **Resuelto por D-025.** | — |
| ~~Q-07~~ | **Resuelto por D-026.** | — |
| ~~Q-08~~ | **Resuelto por D-027 y D-028.** | — |
| ~~Q-09~~ | **Resuelto por D-020.** | — |
| ~~Q-10~~ | **Resuelto por D-021.** | — |
| ~~Q-11~~ | **Resuelto por D-029.** | — |
| ~~Q-12~~ | **Resuelto por D-044.** | — |
| ~~Q-13~~ | **Resuelto por D-048.** | — |
| ~~Q-14~~ | **Resuelto por D-049.** | — |
| ~~Q-15~~ | **Resuelto por D-050.** | — |
| ~~Q-16~~ | **Resuelto por D-053.** | — |
