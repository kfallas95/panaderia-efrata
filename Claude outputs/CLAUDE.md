# CLAUDE.md — Memoria semántica del proyecto

> Fuente de verdad para cualquier agente o colaborador que trabaje en este proyecto.
> Solo se registra lo definido por el autor o lo que aparece en los artefactos fuente.
> Cada dato indica su origen. Lo no definido se marca **PENDIENTE** y no se asume.

**Versión:** 0.1 (borrador para aprobación) · **Fecha:** 2026-10-26

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
| `docs/propuesta.md` | Documento fuente: alcance, módulos, reglas, identidad visual y requisitos del curso | ✅ v1.0 |
| `CLAUDE.md` | Memoria semántica: lenguaje ubicuo, invariantes, decisiones, preguntas abiertas | 🟡 Este documento |
| `system_prompt.md` | Reglas de contexto para agentes de IA (RC-03) | 🟡 Borrador |
| `docs/requirements.md` | Requerimientos en EARS, completos en inglés (RC-02) | Paso 2 |
| `docs/data-contract.json` | Contrato de datos (JSON Schema) | Paso 3 |
| `docs/wireframe.md` | Wireframes | Paso 4 |
| `docs/design.md` | Arquitectura, módulos, estado y trazabilidad | Paso 5 |
| `docs/retrospective.md` | Retrospectiva de la Parte 1 | Paso 6 |
| `docs/tasks.md` | Plan por fases con Unchanged Behavior | Paso 8 |

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

## 3. Lenguaje ubicuo — PROPUESTA (pendiente de aprobación)

### 3.1 Entidades

| Término (código) | Término (UI) | Significado | Origen |
|---|---|---|---|
| `Product` | Producto | Artículo del catálogo que se vende, con precio fijo | `[P §3.1]` |
| `Supply` | Insumo | Materia prima (harina, azúcar…) con su propia unidad | `[P §3.3]` |
| `Expense` | Gasto | Gasto registrado, de categoría Insumos o Servicios | `[P §3.4]` |
| `Sale` | Venta | Venta registrada; descuenta inventario de productos | `[P §3.5]` |
| `Order` | Pedido | Encargo de un cliente | `[P §3.6]` |
| `OrderItem` | Línea del pedido | Producto del catálogo o artículo personalizado dentro de un pedido | `[P §3.6]` |
| `Production` | Producción | Registro de "hice X" que suma al inventario de un producto | `[P §3.2]` |
| `StockCount` | Conteo físico | Registro que reemplaza la cantidad de un insumo por la real | `[P §3.3]` |

> **Nota:** `Production` y `StockCount` como entidades propias (con historial) o solo como operaciones que modifican la cantidad es una decisión **PENDIENTE** (Q-05).

**Convención de nombres (heredada del proyecto anterior):** entidades en `PascalCase`; campos en `camelCase`; enumeraciones en `UPPER_SNAKE_CASE`.

### 3.2 Valores calculados (no se guardan)

| Término (código) | Término (UI) | Fórmula | Origen |
|---|---|---|---|
| `stockOnHand` | En existencia | Unidades físicas del producto | `[P §3.2]` |
| `reservedQuantity` | Apartado | Σ cantidades del producto en pedidos `PENDING` | `[P §3.2]` |
| `availableToSell` | Disponible para vender | `stockOnHand − reservedQuantity` | `[P §3.2]` |
| `missingToProduce` | Faltan por producir | Unidades que un pedido no logra apartar | `[P §3.6]` |
| `totalSold` | Total vendido | Σ ventas del período | `[P §3.7]` |
| `totalExpenses` | Total de gastos | Σ gastos del período (desglose Insumos / Servicios) | `[P §3.7]` |
| `profit` | Ganancia | `totalSold − totalExpenses` (puede ser negativa) | `[P §3.7]` |

> Que `stockOnHand` se guarde como campo o se calcule a partir de producciones y ventas depende de Q-05.

### 3.3 Enumeraciones

| Constante (código) | Etiqueta (UI) | Origen |
|---|---|---|
| `ExpenseCategory`: `SUPPLIES`, `SERVICES` | Insumos, Servicios | `[P §3.4]` |
| `OrderStatus`: `PENDING`, `DELIVERED`, `CANCELLED` | Pendiente, Entregado, Cancelado | `[P §3.6]` |
| `ReportPeriod`: `DAY`, `MONTH` | Día, Mes | `[P §3.7]` |

### 3.4 Relaciones (RC-01a)

```
Product  1 ──< Sale            una venta es de un producto (ver Q-01)
Product  1 ──< OrderItem       las líneas personalizadas no tienen Product
Order    1 ──< OrderItem
Order    1 ──o Sale            al entregar, el pedido genera una venta
Supply   1 ──< Expense         solo gastos SUPPLIES
Product  1 ──< Production
Supply   1 ──< StockCount
```

---

## 4. Invariantes y reglas del dominio

| ID | Regla | Origen |
|---|---|---|
| INV-01 | Ningún inventario (productos ni insumos) queda en negativo. Si una operación supera lo disponible, se bloquea con "Solo hay X…". | `[P §4]` |
| INV-02 | Campos vacíos se rechazan, con mensaje visible junto al campo. Campos opcionales: **PENDIENTE** (Q-07). | `[P §4]` · RC-04 |
| INV-03 | Precios, montos y cantidades deben ser **> 0**. Excepción: el conteo físico admite **0**. | `[P §4]` · RC-04 |
| INV-04 | No existen dos `Product` con el mismo nombre. | `[P §4]` · RC-04 |
| INV-05 | No existen dos `Supply` con el mismo nombre. | `[P §4]` · RC-04 |
| INV-06 | Un `Order` no tiene dos `OrderItem` del mismo `Product`; la cantidad se suma en una sola línea. | `[P §4]` · RC-04 |
| INV-07 | Cada `Supply` tiene su propia unidad. | `[P §3.3]` |
| INV-08 | Un `Expense` `SUPPLIES` indica insumo, cantidad y monto, y **suma** la cantidad al `Supply`. Un `Expense` `SERVICES` no afecta inventario. | `[P §3.4]` |
| INV-09 | Un `StockCount` **reemplaza** la cantidad del `Supply` por la real. | `[P §3.3]` |
| INV-10 | Producir **no** descuenta insumos (sin recetas). | `[P §3.3]` |
| INV-11 | `Production` suma unidades al `stockOnHand` del producto. | `[P §3.2]` |
| INV-12 | Una `Sale` normal descuenta del producto y no puede usar unidades apartadas: cantidad ≤ `availableToSell`. | `[P §3.5]` |
| INV-13 | El precio de `Product` se copia en la venta o la línea del pedido y es editable para ese caso. | `[P §3.1]` |
| INV-14 | Un `Order` `PENDING` aparta unidades de cada producto del catálogo; siempre se puede crear y, si no alcanzan, muestra "Faltan X por producir". | `[P §3.6]` |
| INV-15 | Los `OrderItem` personalizados tienen descripción y precio libre y no pasan por inventario. | `[P §3.6]` |
| INV-16 | Al pasar a `DELIVERED`: se crea una `Sale` por el total del pedido (adelanto + saldo) con la fecha de entrega y se descuentan los productos. Si no alcanzan, se bloquea con "Solo hay X…". | `[P §3.6]` |
| INV-17 | El adelanto solo se anota; no es venta hasta la entrega. | `[P §3.6]` |
| INV-18 | Al pasar a `CANCELLED`: se liberan las unidades apartadas; lo ocurrido con el adelanto solo se anota y no se calcula. | `[P §3.6]` |
| INV-19 | Reporte por `DAY` o `MONTH`: `totalSold`, `totalExpenses` (Insumos / Servicios) y `profit`. | `[P §3.7]` |

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

---

## 7. Pantallas y flujos

**PENDIENTE.** Se definen después de cerrar las preguntas de §11 y antes del wireframe (paso 4).

---

## 8. Persistencia

- **IndexedDB** del navegador (R1). Un navegador = un cliente; sin usuarios ni login.
- **Acceso a datos:** la lógica de dominio nunca accede directamente a IndexedDB; lo hace mediante repositorios (R8). Los repositorios son **asíncronos**.
- **Limitaciones aceptadas:** un solo dispositivo y navegador, sin sincronización; los datos se pierden si el cliente borra los datos de navegación.
- **Montos:** representación interna **PENDIENTE** (Q-06).

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

---

## 10. Conflictos entre fuentes

Ninguno registrado.

---

## 11. Vacíos de información (preguntas abiertas)

| ID | Pregunta | Afecta |
|---|---|---|
| Q-01 | ¿Una venta es de **un solo producto**, o puede incluir **varios productos** (como un tiquete)? | `Sale`, INV-12 |
| Q-02 | ¿Ventas, gastos, producciones y conteos se pueden **editar o eliminar**? Si se elimina una venta, ¿las unidades **vuelven** al inventario? | Todas las entidades |
| Q-03 | Los productos que **no se venden** (por ejemplo, pan del día anterior), ¿cómo salen del inventario? ¿Se registra una merma o una corrección manual? | Inventario de productos |
| Q-04 | ¿Se puede **eliminar** un producto o insumo que ya tiene ventas o gastos? ¿O solo desactivarlo? | `Product`, `Supply` |
| Q-05 | `Production` y `StockCount`: ¿guardar **historial** (quién, cuándo, cuánto) o solo actualizar la cantidad? | Modelo de datos |
| Q-06 | Montos en colones con decimales: **PROPUESTA:** guardarlos como **céntimos enteros** (₡1 250,50 → 125050) para evitar errores de decimales de JavaScript, igual que en el proyecto anterior. | Contrato de datos |
| Q-07 | ¿Qué campos son **opcionales**? Por ejemplo, teléfono del cliente, notas o adelanto del pedido. | INV-02 |
| Q-08 | ¿Se puede registrar una venta o un gasto con **fecha pasada**? ¿Un pedido con fecha de entrega pasada? | Validaciones |
