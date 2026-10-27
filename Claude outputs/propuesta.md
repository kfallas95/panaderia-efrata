# Propuesta — Panadería Efrata

| | |
|---|---|
| **Versión** | 0.3 (borrador para aprobación) |
| **Fecha** | 2026-10-26 |
| **Autor** | Kevin — UCenfotec |
| **Rol** | Documento fuente del proyecto (Paso 0 de Spec Driven Development). Todo su contenido fue definido o aprobado por el autor. |

---

## 1. Contexto

- **Producto:** aplicación web **"Panadería Efrata"**.
- **Usuario:** el **dueño** de la panadería, único usuario. Trabaja solo, desde su casa.
- **Propósito:** tener un lugar donde llevar el control de **gastos, ventas, inventario y pedidos**.
- **Prioridad:** los cuatro módulos tienen la misma importancia.
- **Moneda:** solo **colones (₡)**, con decimales.

## 2. Restricciones técnicas

| # | Restricción | Nota |
|---|---|---|
| R1 | Persistencia en **IndexedDB** del navegador. Un solo usuario por navegador, sin backend ni login. | El curso permite LocalStorage, IndexedDB o una base de datos ligera; el autor eligió IndexedDB. |
| R2 | Sin servicios externos (APIs) en tiempo de ejecución. | Igual que el proyecto anterior. |
| R3 | JavaScript sin framework de UI. | Igual que el proyecto anterior. |
| R4 | Sin herramienta de build: módulos ES nativos servidos con un servidor local (Live Server). | Igual que el proyecto anterior. |
| R5 | Verificación manual, sin pruebas automatizadas. | Igual que el proyecto anterior. |
| R6 | Código, contrato de datos y lenguaje ubicuo en inglés; interfaz en español. | Igual que el proyecto anterior. |
| R7 | Diseño mobile-first y responsive. | Igual que el proyecto anterior. |
| R8 | Arquitectura en capas (UI, Estado, Aplicación, Dominio, Infraestructura) con patrón repositorio. | Igual que el proyecto anterior. |

## 3. Módulos

### 3.1 Catálogo de productos
- El dueño crea cada producto una sola vez.
- Cada producto tiene un **precio fijo**. En una venta o un pedido el precio se llena automáticamente y se puede editar para ese caso puntual.

### 3.2 Inventario de productos terminados
- Indica qué productos hay **disponibles para vender**.
- **Producción:** el dueño escribe una cantidad junto a cada producto (por ejemplo, "hice 30") y el inventario sube.
- **Ventas:** cada venta descuenta del inventario.
- Por cada producto se muestra:
  - **En existencia**
  - **Apartado** (reservado por pedidos pendientes)
  - **Disponible para vender** = En existencia − Apartado

### 3.3 Inventario de insumos
- Indica **cuántos insumos hay** (harina, azúcar, huevos…).
- Cada insumo tiene **su propia unidad**.
- **Sin recetas:** producir no descuenta insumos.
- **Compras:** un gasto de categoría Insumos suma automáticamente la cantidad comprada.
- **Conteo físico:** cuando el dueño quiera, revisa sus insumos y escribe la cantidad real, que **reemplaza** la registrada.
- *Decisión revisable:* si el autor no queda satisfecho en el uso, se reevalúa (por ejemplo, agregando recetas).

### 3.4 Gastos
- **Categorías:** Insumos y Servicios ("por los momentos").
- Un gasto de **Insumos** indica el insumo, la cantidad y el monto (por ejemplo, Harina · 2 kg · ₡2 000) y suma esa cantidad al inventario de insumos.
- Un gasto de **Servicios** (por ejemplo, luz o agua) no afecta el inventario.

### 3.5 Ventas
- Se registra **cada venta** por separado: producto, cantidad y precio.
- Descuenta el producto del inventario de productos terminados.
- Las ventas normales **no pueden usar unidades apartadas** por pedidos.

### 3.6 Pedidos
- **Pedido** = encargo de un **cliente** a la panadería.
- **Datos:** nombre y teléfono del cliente, productos y cantidades, fecha y hora de entrega, notas y adelanto.
- **Estados:** Pendiente · Entregado · Cancelado.
- **Productos del catálogo:** al crear el pedido, apartan unidades del inventario. El pedido siempre se puede crear; si no hay suficientes unidades, muestra "Faltan X por producir".
- **Artículos personalizados** (por ejemplo, un queque especial): descripción y precio libre; no pasan por el inventario.
- **Al entregar:** se crea automáticamente una **venta** por el total del pedido (adelanto + saldo), con la fecha de entrega, y se descuentan los productos del inventario. Si no hay suficientes, se bloquea con el mensaje "Solo hay X…".
- **Adelanto:** solo se anota en el pedido; no cuenta como venta hasta la entrega.
- **Cancelado con adelanto:** solo se anota qué pasó con ese dinero; el sistema no hace cálculos con él. Las unidades apartadas se liberan.

### 3.7 Reporte
- Se puede ver **por día** o **por mes**.
- **Total vendido:** suma de las ventas del período.
- **Total de gastos:** suma de los gastos del período, con desglose en Insumos y Servicios.
- **Ganancia:** Total vendido − Total de gastos. Puede ser negativa.

## 4. Reglas generales

- **Nada queda en negativo** en ningún inventario. Si una operación supera lo disponible, se bloquea con el mensaje "Solo hay X…".
- **Campos vacíos:** se rechazan, con un mensaje visible junto al campo.
- **Valores numéricos:** precios, montos y cantidades deben ser **> 0**. Se rechazan el 0 y los negativos.
  - **Excepción:** el **conteo físico** de insumos admite **0** ("se acabó").
- **Duplicados no permitidos:**
  - **Nombre de producto:** no pueden existir dos productos con el mismo nombre.
  - **Nombre de insumo:** no pueden existir dos insumos con el mismo nombre.
  - **Producto en un pedido:** un pedido no puede tener dos líneas del mismo producto; la cantidad se suma en una sola línea.

## 5. Identidad visual

- **Paleta "Horno cálido":**

  | Rol | Color |
  |---|---|
  | Fondo | crema `#FBF5EC` |
  | Texto principal | café `#6B4226` |
  | Acento y botón principal | dorado trigo `#D4A24C` |

- Tipografía **serif en títulos** y tarjetas redondeadas.
- **Ilustraciones SVG propias**, guardadas en el proyecto (R2), con los colores de la paleta y usadas con moderación:
  1. **Encabezado:** espiga o pan junto a "Panadería Efrata".
  2. **Pantallas vacías:** por ejemplo, un croissant con "Aún no tienes productos".
  3. **Íconos de sección:** Ventas, Pedidos, Inventario, Gastos, Reporte.

## 6. Requisitos del curso (RC)

| ID | Requisito | Cómo se cumple | Paso |
|---|---|---|---|
| RC-01a | La app gestiona al menos 2 entidades de datos vinculadas | Producto → Ventas · Pedido → Productos del pedido · Insumo → Gastos de insumos | Paso 1 y paso 3 (contrato de datos) |
| RC-01b | Persistencia real (LocalStorage, IndexedDB o base de datos ligera) | IndexedDB (R1) | Paso 1 |
| RC-02 | `requirements.md` con al menos 3 reglas de negocio complejas en sintaxis EARS: WHEN [evento] IF [condición] THEN system SHALL [respuesta] | Se redactan a partir de las reglas de las secciones 3 y 4 | Paso 2 |
| RC-03 | Archivo de reglas de contexto en la raíz del repositorio que restrinja el stack, las convenciones de código y prohíba parches fuera de la especificación | **`system_prompt.md`**: se crea en el paso 1 y se completa en el paso 5 (diseño) | Pasos 1 y 5 |
| RC-04 | Manejo explícito de errores de usuario (entradas vacías, números negativos, duplicados) con retroalimentación visual clara y Unchanged Behavior | Reglas de la sección 4; Unchanged Behavior en cada fase de `tasks.md` | Pasos 2, 8 y 9 |

## 7. Fuera de alcance por ahora

| Tema | Motivo | Estado |
|---|---|---|
| Recetas por producto (descuento automático de insumos al producir) | Hace el uso más tedioso | Posible mejora futura si el cliente la pide |
| Varios usuarios, login, backend | Fuera de R1 | — |
| Categorías de gasto distintas de Insumos y Servicios | Hoy trabaja una sola persona desde la casa | — |
