# Wireframes — Panadería Efrata

| | |
|---|---|
| **Versión** | 1.3 (2026-10-26: mensaje de entrega por D-066; auditoría del paso 7, D-069 a D-082; D-083 y D-084) |
| **Fecha** | 2026-10-26 |
| **Fuentes** | `CLAUDE.md` §6 y §7 (D-014, D-046 a D-084) · `docs/requirements.md` v1.6 · `docs/data-contract.json` v1.2 |

### Convenciones

- Bocetos de estructura, no de diseño final. La paleta "Horno cálido", la tipografía serif en los títulos y los SVG propios se aplican en la implementación (RNF-09).
- **Pantallas vacías (D-090):** croissant en Pedidos y Ventas; pan en Inventario y Gastos. Las ilustraciones son solo decorativas.
- `[ ]` campo · `( )` botón · `▾` lista desplegable · `🌾` espiga SVG del encabezado (no es emoji) · `⚠` alerta visual.
- Datos de ejemplo: se parte de `docs/data-contract.json` y se agregan estos datos para mostrar los casos de borde. Todos son coherentes entre pantallas. "Hoy" es lunes 2 de noviembre de 2026, después de las 10:00.
  - **Datos agregados:**
    - Producción de 10 Pan casero (1 nov).
    - Producción de 24 Galletas de avena (2 nov).
    - Producto Galletas de avena (₡500,00).
    - Insumo Huevos (sin conteos) con una compra de 30 unidad el 30 oct por ₡3 000,00 ("Compra de huevos"). Es de octubre, así que no aparece en el reporte de noviembre.
    - Pedido **entregado** de Sofía Jiménez (1 nov): 10 Pan casero + 1 queque personalizado de ₡15 000,00.
    - Pedidos **pendientes**: Ana Mora (12 galletas, lun 2 nov 10:00, atrasada), María Rojas (contrato) y Luis Vargas (6 Pan casero, dom 8 nov 09:00).
  - **Pan casero:** producido 30 (10 + 20) − regalado 2 − vendido 15 (5 + 10 de Sofía) = existencia 13. Apartado 16 (María 10 + Luis 6). Disponible para vender 0. Faltan 3 (Luis, por prioridad D-063).
  - **Galletas de avena:** existencia 24; apartado 12 (Ana); disponible para vender 12.
- Los montos se muestran con 2 decimales (RNF-10).

---

## 1. Pedidos — Pendientes (pantalla inicial, D-046)

```
┌────────────────────────────────────────┐
│ 🌾 Panadería Efrata                     │
├────────────────────────────────────────┤
│ [Pendientes]  Entregados   Cancelados  │
├────────────────────────────────────────┤
│ ┌────────────────────────────────────┐ │
│ │ ⚠ Atrasado                         │ │  ← rojo (REQ-F-26)
│ │ Ana Mora · 8777-1111               │ │
│ │ Entrega: lun 2 nov · 10:00         │ │
│ │ 12 × Galletas de avena             │ │
│ │ Total ₡6 000,00 · Saldo ₡6 000,00  │ │
│ └────────────────────────────────────┘ │
│ ┌────────────────────────────────────┐ │
│ │ María Rojas · 8888-0000            │ │
│ │ Entrega: sáb 7 nov · 15:00         │ │
│ │ Total ₡30 000,00                   │ │
│ │ Adelanto ₡10 000,00                │ │
│ │ Saldo ₡20 000,00                   │ │
│ └────────────────────────────────────┘ │
│ ┌────────────────────────────────────┐ │
│ │ Luis Vargas · 8555-2222            │ │
│ │ Entrega: dom 8 nov · 09:00         │ │
│ │ 6 × Pan casero · Total ₡9 000,00   │ │
│ │ Faltan 3 Pan casero por producir   │ │  ← dorado (REQ-F-15)
│ └────────────────────────────────────┘ │
│                                   (+)  │  ← Nuevo pedido
├───────┬───────┬────────┬──────┬────────┤
│Pedidos│Ventas │Inventa.│Gastos│Reporte │
└───────┴───────┴────────┴──────┴────────┘
```

- **Pendientes:** entrega más próxima primero. **Entregados y Cancelados:** más reciente primero (D-047).
- **Estado vacío:** croissant SVG + "Aún no tienes pedidos pendientes" + (Nuevo pedido) (D-014).

## 2. Detalle del pedido

```
┌────────────────────────────────────────┐
│ ← Pedido                               │
├────────────────────────────────────────┤
│ María Rojas · 8888-0000                │
│ Entrega: sáb 7 nov · 15:00             │
│ Estado: Pendiente                      │
│                                        │
│ 10 × Pan casero      ₡1 500  ₡15 000   │
│  1 × Queque de chocolate               │
│      personalizado   ₡15 000 ₡15 000   │
│ ────────────────────────────────────── │
│ Total                      ₡30 000,00  │
│ Adelanto                   ₡10 000,00  │
│ Saldo                      ₡20 000,00  │
│                                        │
│ Notas: Que diga Feliz cumpleaños       │
│                                        │
│ (      Entregar      )                 │  ← botón principal dorado
│ ( Editar ) ( Cancelar ) ( Eliminar )   │
└────────────────────────────────────────┘
```

- **Entregar** (REQ-F-17): crea la venta con la fecha real. Si al pedido le faltan unidades, muestra el bloqueo de la sección 11.
- **Cancelar** (REQ-F-18): pide una nota opcional sobre el adelanto y libera lo apartado.
- **Eliminar** (REQ-F-16): pide confirmación con el texto "¿Eliminar el pedido de María Rojas?".
- **Pedidos Entregados o Cancelados:** el detalle es solo de lectura y no muestra botones (D-071). Para deshacer una entrega se elimina la venta desde Ventas.

## 3. Nuevo / editar pedido

```
┌────────────────────────────────────────┐
│ ← Nuevo pedido                         │
├────────────────────────────────────────┤
│ Cliente      [María Rojas            ] │
│ Teléfono     [8888-0000              ] │
│ Entrega      [07/11/2026] [15:00]      │
│                                        │
│ Productos                              │
│ [Pan casero        ▾] [10] [₡1 500,00] │
│   Disponible para vender: 0 · ✕        │
│ ( + Producto del catálogo )            │
│                                        │
│ Personalizados                         │
│ [Queque de chocolate personalizado   ] │
│ [1] [₡15 000,00]                     ✕ │
│ ( + Artículo personalizado )           │
│                                        │
│ Total                      ₡30 000,00  │
│ Adelanto (opcional) [₡10 000,00      ] │
│ Notas (opcional)    [Que diga Feliz…  ] │
│                                        │
│ (            Guardar            )      │
└────────────────────────────────────────┘
```

- **Precio del producto:** se llena desde el catálogo y se puede editar (INV-13).
- **Producto repetido:** si se agrega un producto que ya está, se suma a su línea (REQ-F-22).
- **Productos desactivados:** no aparecen en la lista (INV-24).

## 4. Ventas

```
┌────────────────────────────────────────┐
│ 🌾 Panadería Efrata                     │
├────────────────────────────────────────┤
│ Hoy · lun 2 nov            ₡7 500,00   │
│ ┌────────────────────────────────────┐ │
│ │ 5 × Pan casero          ₡7 500,00  │ │
│ └────────────────────────────────────┘ │
│                                        │
│ Dom 1 nov                 ₡30 000,00   │
│ ┌────────────────────────────────────┐ │
│ │ Pedido de Sofía Jiménez            │ │  ← etiqueta (D-047)
│ │ 10 × Pan casero ·                  │ │
│ │ 1 × Queque personalizado           │ │
│ │                         ₡30 000,00 │ │
│ └────────────────────────────────────┘ │
│                                   (+)  │  ← Nueva venta
├───────┬───────┬────────┬──────┬────────┤
│Pedidos│Ventas │Inventa.│Gastos│Reporte │
└───────┴───────┴────────┴──────┴────────┘
```

- Al tocar una venta se puede **editar** (REQ-F-13) o **eliminar** (REQ-F-14).
- Si la venta viene de un pedido, el aviso de eliminación dice: "El pedido de {cliente} volverá a Pendiente".

## 5. Nueva / editar venta

```
┌────────────────────────────────────────┐
│ ← Nueva venta                          │
├────────────────────────────────────────┤
│ Fecha   [02/11/2026]                   │
│                                        │
│ [Pan casero        ▾] [5 ] [₡1 500,00] │
│   Disponible para vender: 0          ✕ │
│   ⚠ Solo hay 0 disponibles de Pan      │  ← rojo, junto a la línea
│     casero                             │
│ ( + Producto )                         │
│                                        │
│ Total                       ₡7 500,00  │
│ (            Guardar            )      │
└────────────────────────────────────────┘
```

- Si una línea no alcanza, **no se guarda nada** (D-031) y los datos ingresados se conservan.
- Si se agrega un producto que ya está en la venta, se suma a su línea (D-069).
- **Venta que viene de un pedido:** solo se puede cambiar la fecha; las líneas aparecen bloqueadas (D-072).

## 6. Inventario — Productos

```
┌────────────────────────────────────────┐
│ 🌾 Panadería Efrata                     │
├────────────────────────────────────────┤
│ [Productos]   Insumos                  │
├────────────────────────────────────────┤
│ ┌────────────────────────────────────┐ │
│ │ Pan casero              ₡1 500,00  │ │
│ │ Existencia 13 · Apartado 16        │ │
│ │ Disponible para vender  0          │ │
│ │ Faltan 3 por producir              │ │
│ └────────────────────────────────────┘ │
│ ┌────────────────────────────────────┐ │
│ │ Galletas de avena         ₡500,00  │ │
│ │ Existencia 24 · Apartado 12        │ │
│ │ Disponible para vender  12         │ │
│ └────────────────────────────────────┘ │
│                                        │
│ ▸ Desactivados (1)                     │  ← plegable (REQ-F-25)
│                                   (+)  │
├───────┬───────┬────────┬──────┬────────┤
│Pedidos│Ventas │Inventa.│Gastos│Reporte │
└───────┴───────┴────────┴──────┴────────┘
```

**Detalle del producto** (al tocarlo):

- Historial de producción, salidas y ventas.
- Acciones: (Editar) (Producción) (Salida) (Eliminar o desactivar).
- **Eliminar** (REQ-F-02):
  - Si el producto tiene historial: "Pan casero tiene historial; se desactivará y no aparecerá en nuevas ventas ni pedidos".
  - Si no tiene historial: se elimina después de confirmar.

## 7. Inventario — Insumos

```
┌────────────────────────────────────────┐
│ 🌾 Panadería Efrata                     │
├────────────────────────────────────────┤
│  Productos   [Insumos]                 │
├────────────────────────────────────────┤
│ ┌────────────────────────────────────┐ │
│ │ Harina                    5,5 kg   │ │
│ │ Último conteo: 1 nov · 18:00       │ │
│ └────────────────────────────────────┘ │
│ ┌────────────────────────────────────┐ │
│ │ Huevos                 30 unidad   │ │
│ │ Sin conteos                        │ │
│ └────────────────────────────────────┘ │
│                                        │
│ ▸ Desactivados (0)                     │
│                                   (+)  │
├───────┬───────┬────────┬──────┬────────┤
│Pedidos│Ventas │Inventa.│Gastos│Reporte │
└───────┴───────┴────────┴──────┴────────┘
```

**Detalle del insumo:**

- Historial de conteos (fecha, cantidad anterior y cantidad nueva) y de compras.
- Acciones: (Conteo físico) (Editar) (Eliminar o desactivar).

## 8. Menú (+) de Inventario y formularios

```
┌────────────────────────────────────────┐
│  ( Producción      )                   │
│  ( Salida          )                   │
│  ( Conteo físico   )                   │
│  ( Nuevo producto  )                   │
│  ( Nuevo insumo    )                   │
└────────────────────────────────────────┘

Producción                       Salida
┌──────────────────────────┐     ┌──────────────────────────┐
│ Fecha [02/11/2026]       │     │ Producto [Pan casero  ▾] │
│ Pan casero        [  20] │     │ Cantidad [2 ]            │
│ Galletas de avena [    ] │     │ Motivo   (•) Reutilizado │
│ (     Guardar      )     │     │          ( ) Regalado    │
└──────────────────────────┘     │ Fecha    [02/11/2026]    │
  ← un número por producto        │ (     Guardar      )     │
    (P §3.2)                      └──────────────────────────┘

Conteo físico                    Nuevo insumo
┌──────────────────────────┐     ┌──────────────────────────┐
│ Insumo [Harina        ▾] │     │ Nombre [Harina         ] │
│ Registrado: 5,5 kg       │     │ Unidad [kg ▾]            │
│ Cantidad real [3,5   ] kg│     │   kg · g · L · ml ·      │
│ (     Guardar      )     │     │   unidad                 │
└──────────────────────────┘     │ (     Guardar      )     │
  ← admite 0 (REQ-F-08)           └──────────────────────────┘
```

- **Producción:** se guarda un registro por cada producto con cantidad; las casillas vacías se ignoran. Si todas están vacías: "Ingresa al menos una cantidad" (D-076).
- **Faltan X por producir** en la tarjeta del producto aparece en dorado cuando lo apartado supera la existencia (D-077).
- **Nuevo producto:** nombre y precio.

## 9. Gastos

```
┌────────────────────────────────────────┐
│ 🌾 Panadería Efrata                     │
├────────────────────────────────────────┤
│ [Todos]  Insumos  Servicios            │
├────────────────────────────────────────┤
│ Hoy · lun 2 nov           ₡20 500,50   │
│ ┌────────────────────────────────────┐ │
│ │ Insumos · Compra de harina         │ │
│ │ 2 kg de Harina · 09:30  ₡2 000,00  │ │
│ ├────────────────────────────────────┤ │
│ │ Servicios · Recibo de luz          │ │
│ │ 10:00                  ₡18 500,50  │ │
│ └────────────────────────────────────┘ │
│                                   (+)  │
├───────┬───────┬────────┬──────┬────────┤
│Pedidos│Ventas │Inventa.│Gastos│Reporte │
└───────┴───────┴────────┴──────┴────────┘

Nuevo gasto
┌────────────────────────────────────────┐
│ Categoría  (•) Insumos  ( ) Servicios  │
│ Descripción [Compra de harina        ] │
│ Insumo      [Harina ▾]                 │  ← solo Insumos
│ Cantidad    [2     ] kg                │  ← solo Insumos
│ Monto       [₡2 000,00               ] │
│ Fecha [02/11/2026]  Hora [09:30]       │  ← hora actual (D-045)
│ (            Guardar            )      │
└────────────────────────────────────────┘
```

## 10. Reporte

```
┌────────────────────────────────────────┐
│ 🌾 Panadería Efrata                     │
├────────────────────────────────────────┤
│ Día  [Mes]        [noviembre 2026 ▾]   │
├────────────────────────────────────────┤
│ ┌────────────────────────────────────┐ │
│ │ Total vendido                      │ │
│ │ ₡37 500,00                         │ │
│ └────────────────────────────────────┘ │
│ ┌────────────────────────────────────┐ │
│ │ Total de gastos                    │ │
│ │ ₡20 500,50                         │ │
│ │ Insumos ₡2 000,00                  │ │
│ │ Servicios ₡18 500,50               │ │
│ └────────────────────────────────────┘ │
│ ┌────────────────────────────────────┐ │
│ │ Ganancia                           │ │
│ │ ₡16 999,50                         │ │  ← rojo y con signo si es negativa: −₡13 000,50
│ └────────────────────────────────────┘ │
├───────┬───────┬────────┬──────┬────────┤
│Pedidos│Ventas │Inventa.│Gastos│Reporte │
└───────┴───────┴────────┴──────┴────────┘
```

- Las salidas de inventario no cuentan en el reporte (INV-21).
- En Reporte no hay botón (+) (D-046).

## 11. Errores de usuario (RC-04)

Todos los errores aparecen **en rojo junto al campo o la acción**. Al fallar no se borra lo que el dueño escribió (REQ-F-20).

| Caso | Mensaje | REQ |
|---|---|---|
| Campo obligatorio vacío o solo espacios | "Este campo es obligatorio" | REQ-F-20 |
| Precio, monto o cantidad ≤ 0 | "Solo se admiten valores mayores a 0" | REQ-F-21 |
| Conteo físico negativo | "La cantidad no puede ser negativa" | REQ-F-21 |
| Nombre repetido | "Ya existe un producto con ese nombre" / "Ya existe un insumo con ese nombre" | REQ-F-22 |
| Venta o salida que supera lo disponible | "Solo hay X disponibles de {producto}" | REQ-F-05, 12, 13 |
| Editar o eliminar producción que deja la existencia en negativo | "Solo hay X de {producto} en existencia" | REQ-F-04 |
| Gasto que deja un insumo en negativo (verificación defensiva; con las reglas actuales no ocurre) | "Solo hay X {unidad} de {insumo}" | REQ-F-11 |
| Desactivar o eliminar un producto en pedidos pendientes | "{producto} está en pedidos pendientes" | REQ-F-02 |
| Producción sin ninguna cantidad | "Ingresa al menos una cantidad" | REQ-F-03 |
| Entregar un pedido con faltantes | "Faltan X {producto} por producir para este pedido" (el pedido sigue Pendiente) | REQ-F-17 |
| Fecha futura | "La fecha no puede ser futura" | REQ-F-23 |
| Entrega en el pasado | "La entrega no puede estar en el pasado" | REQ-F-23 |
| Teléfono inválido | "El teléfono debe tener 8 dígitos" | REQ-F-24 |
| Adelanto mayor al total | "El adelanto no puede superar el total del pedido" | REQ-F-27 |
| Número mal escrito (letras, dos separadores, separador de miles) | "Escribe un número válido, por ejemplo 1250,50" | REQ-F-28 |
| Demasiados decimales (montos e insumos) | "Usa máximo {n} decimales" | REQ-F-28 |
| Decimales en la cantidad de un producto | "Escribe un número entero" | REQ-F-28 |

```
Ejemplo — Nuevo producto con errores
┌────────────────────────────────────────┐
│ Nombre [Pan casero                   ] │
│ ⚠ Ya existe un producto con ese nombre │
│ Precio [0                            ] │
│ ⚠ Solo se admiten valores mayores a 0  │
│ (            Guardar            )      │
└────────────────────────────────────────┘
```

## 12. Versión de computadora (R7, D-046)

```
┌──────────────┬───────────────────────────────────────────────────────┐
│ 🌾 Panadería  │ Pedidos                              ( + Nuevo pedido )│
│    Efrata    ├───────────────────────────────────────────────────────┤
│              │ [Pendientes]  Entregados  Cancelados                  │
│ ▸ Pedidos    │                                                       │
│   Ventas     │ ┌─────────────────┐ ┌─────────────────┐ ┌───────────┐ │
│   Inventario │ │ ⚠ Atrasado      │ │ María Rojas     │ │ Luis      │ │
│   Gastos     │ │ Ana Mora        │ │ sáb 7 nov 15:00 │ │ Vargas    │ │
│   Reporte    │ │ lun 2 nov 10:00 │ │ Total ₡30 000   │ │ dom 8 nov │ │
│              │ │ Total ₡6 000    │ │ Saldo ₡20 000   │ │ Faltan 3… │ │
│              │ └─────────────────┘ └─────────────────┘ └───────────┘ │
└──────────────┴───────────────────────────────────────────────────────┘
```

- **Menú lateral** en lugar de la barra inferior. El botón (+) pasa al encabezado de cada sección.
- Las tarjetas se acomodan en columnas. Las pantallas y el contenido son los mismos que en celular.
