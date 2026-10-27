# Panadería Efrata

Aplicación web para que el dueño de la Panadería Efrata controle sus **pedidos**, **ventas**, **inventario** y **gastos**, y vea un **reporte** de ganancia por día o por mes. Funciona en el navegador, sin servidor ni inicio de sesión, y guarda los datos en el propio navegador.

El proyecto se construyó con *Spec Driven Development*: primero la especificación (`docs/`), luego el código por fases, y cada fase la verificó y aprobó el autor antes de pasar a la siguiente.

## Qué hace

| Sección | Funciones principales |
|---|---|
| **Pedidos** | Pedidos de clientes con productos del catálogo y artículos personalizados, adelanto y saldo. Aparta productos aunque no alcancen y muestra "Faltan X {producto} por producir" según la prioridad de entrega. Marca "Atrasado" al pasar la hora de entrega. Entregar crea la venta; cancelar libera lo apartado. |
| **Ventas** | Ventas por día. No permite vender más de lo disponible ni usar lo apartado por pedidos. |
| **Inventario** | Productos terminados (producción, salidas, existencia, apartado y disponible) e insumos (compras y conteo físico). |
| **Gastos** | Gastos de Insumos (suman al inventario del insumo) y de Servicios. |
| **Reporte** | Total vendido, gastos por categoría y ganancia de un día o de un mes. |

## Tecnología

- HTML, CSS y JavaScript con **módulos ES nativos**, sin frameworks ni herramientas de build.
- **IndexedDB** del navegador como base de datos (`panaderiaEfrata`, 8 tablas).
- Arquitectura en capas: interfaz → estado → aplicación → dominio, con repositorios para el acceso a datos.
- Montos en colones guardados como céntimos enteros (`125050` = ₡1 250,50).
- Diseño *mobile-first* con la paleta "Horno cálido" e ilustraciones SVG propias.
- No usa servicios externos ni internet para funcionar.

## Cómo ejecutar

Los módulos ES no cargan si se abre `index.html` con doble clic (`file://`); hace falta un servidor local.

1. Abrir la carpeta del proyecto en **Visual Studio Code**.
2. Instalar la extensión **Live Server**, si no está instalada.
3. Clic derecho sobre `index.html` → **Open with Live Server**.
4. La aplicación abre en **Pedidos**.

Los datos quedan guardados en el navegador. Para empezar de cero: herramientas de desarrollo (F12) → **Application** → **IndexedDB** → eliminar `panaderiaEfrata`.

## Fecha simulada (para probar)

Para probar entregas, atrasos y reportes sin esperar días, se puede indicar la fecha y la hora en la dirección, **antes del `#`**:

```
http://127.0.0.1:5500/index.html?today=2026-11-07&time=14:59#/orders
```

- `today=AAAA-MM-DD` es la fecha; `time=HH:MM` es la hora (opcional; si falta, se usa la hora real).
- El reloj simulado **avanza** desde esa hora como un reloj normal.
- Una banda amarilla indica que la fecha es simulada; "Volver a la fecha real" la quita.

## Requisitos del curso

| Requisito | Dónde se cumple |
|---|---|
| **RC-01** Al menos 2 entidades relacionadas y persistencia real | 8 entidades relacionadas (por ejemplo, `Product` con `Sale`, `Order`, `Production` y `StockOut`; `Supply` con `Expense` y `StockCount`) guardadas en IndexedDB. Ver `docs/data-contract.json`. |
| **RC-02** Al menos 3 reglas complejas en EARS | 6 reglas WHEN / IF / THEN SHALL, completas en inglés: REQ-F-02, 09, 12, 14, 15 y 17 en `docs/requirements.md`. |
| **RC-03** Archivo de reglas en la raíz | `system_prompt.md`. |
| **RC-04** Manejo de errores del usuario | Vacíos, ceros, negativos, duplicados, fechas, teléfono, adelanto y números mal escritos, con el mensaje en rojo junto al campo y sin perder lo escrito (REQ-F-20 a REQ-F-24, REQ-F-27 y REQ-F-28). Cada fase de `docs/tasks.md` indica su comportamiento sin cambios. |

## Estructura del repositorio

```
├── index.html            Página única de la aplicación
├── styles.css            Estilos (mobile-first)
├── system_prompt.md      Reglas para agentes de IA (RC-03)
├── CLAUDE.md             Memoria del proyecto: lenguaje, invariantes y decisiones
├── assets/
│   ├── icons/            Íconos de las 5 secciones
│   └── illustrations/    Espiga, pan y croissant
├── docs/                 Especificación (ver "Documentación")
└── src/
    ├── main.js           Arranque: reloj, base de datos, store, servicios e interfaz
    ├── domain/           Reglas del negocio puras: existencias, prioridad, totales, validaciones
    ├── application/      Servicios por caso de uso (pedidos, ventas, gastos…)
    ├── state/            Store en memoria y selectores calculados
    ├── infrastructure/   IndexedDB, repositorios, transacciones y reloj
    └── ui/               Router, componentes y pantallas
```

## Documentación

| Archivo | Contenido |
|---|---|
| [`docs/propuesta.md`](docs/propuesta.md) | Alcance aprobado del proyecto |
| [`CLAUDE.md`](CLAUDE.md) | Lenguaje ubicuo, invariantes y registro de decisiones (D-xxx) |
| [`system_prompt.md`](system_prompt.md) | Reglas de contexto para agentes de IA |
| [`docs/requirements.md`](docs/requirements.md) | Requerimientos en EARS |
| [`docs/data-contract.json`](docs/data-contract.json) | Contrato de datos (JSON Schema) |
| [`docs/wireframe.md`](docs/wireframe.md) | Pantallas, textos y mensajes |
| [`docs/design.md`](docs/design.md) | Arquitectura, módulos y trazabilidad |
| [`docs/tasks.md`](docs/tasks.md) | Plan por fases y matriz de verificación final |
