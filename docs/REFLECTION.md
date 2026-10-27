# Reflexión — Panadería Efrata

| | |
|---|---|
| **Autor** | Kevin — UCenfotec |
| **Fecha** | 2026-10-27 |
| **Proyecto** | https://github.com/kfallas95/panaderia-efrata · https://kfallas95.github.io/panaderia-efrata/ |

> Reemplaza la retrospectiva del paso 6. Los niveles de satisfacción y las respuestas son míos.

---

## A. Matriz de alineación de intención (visión vs. realidad)

| Dimensión de la app | Visión inicial en mi mente | Nivel de satisfacción | Justificación sobre el resultado |
|---|---|---|---|
| **Lógica de negocio** | Una app para que el dueño de la panadería controle **gastos, ventas, inventario y pedidos**, con la misma importancia, en colones. Catálogo con precio fijo editable por venta. Dos inventarios: productos terminados (existencia, apartado y disponible para vender) e insumos (las compras suman y el conteo físico reemplaza la cantidad, sin recetas). Pedidos de clientes que apartan unidades, muestran "Faltan X por producir" y al entregarse crean la venta. Un reporte por día o mes con la ganancia. Nada puede quedar en negativo. | **Muy Satisfecho** | Yo creo que sí. Llevo rato pensando en algo así para el negocio de mi papá, entonces creo que fue cerca de lo que me imaginé. La visión no era demasiado ambiciosa, pero sí era más complicada de lo que parecía. La regla "el pedido aparta aunque no alcance" abrió preguntas que yo no había pensado: qué pedido se cubre primero, qué pasa si el cliente llega tarde y qué pasa si la entrega se marca con faltantes. Eso terminó en la prioridad por fecha de entrega con 2 horas de margen y la etiqueta "Atrasado". También aparecieron reglas que no estaban en mi idea inicial y que hoy considero necesarias: las salidas de productos no vendidos (Reutilizado / Regalado), desactivar en lugar de borrar lo que tiene historial y deshacer una entrega eliminando su venta. |
| **Experiencia de usuario (UI/UX)** | Una app con identidad de panadería: paleta **"Horno cálido"** (crema, café y dorado trigo), títulos con tipografía serif, tarjetas redondeadas e **ilustraciones SVG propias** en el encabezado, las pantallas vacías y los íconos de sección. Pensada primero para celular. | **Muy Satisfecho** | El resultado es muy cercano a lo que imaginé, pero la IA sí me ayudó en esa parte de colores e ilustraciones (espiga, pan, croissant y los 5 íconos). También se agregaron cosas que facilitan el uso: los errores en rojo junto a cada campo sin borrar lo escrito, los faltantes en dorado, "Atrasado" en rojo y las confirmaciones antes de eliminar, entregar o cancelar. |
| **Persistencia de datos** | Guardar los datos **en el navegador**, sin backend ni inicio de sesión, para un solo usuario. Del menú que permitía el curso (LocalStorage, IndexedDB o una base de datos ligera) elegí **IndexedDB**. | **Muy Satisfecho** | La verdad sí siento que es un mundo que necesito recorrer más; hay demasiado que ver con el tema de la base de datos. Siento que ayuda mucho y fue un cambio con respecto al laboratorio anterior, en el que solo usé LocalStorage. |

---

## B. Cuestionario de reflexión de cierre

### 1. Autonomía de la IA: ¿en qué momentos la IA tomó decisiones "por su cuenta" sin habérselo solicitado? ¿Fueron aciertos o fallos de arquitectura?

Desde el inicio le pedí a la IA que no inventara nada y que yo autorizaría cada paso. Por eso casi todo lo que no estaba definido llegó como PROPUESTA para que yo lo aprobara. Pero al final sí realizó partes que yo no le pedí, como por ejemplo cambiar de idioma cuando yo no lo pedí y permitir usar unidades o productos en otro pedido. Sí me ayudó con los números enteros y los céntimos para que no hubiera errores.

### 2. Calidad de especificación: analizando tu `requirements.md` inicial, ¿dónde fuiste ambiguo y causaste "alucinaciones" o parches frágiles por parte de la IA?

Sí tuve varias, y la IA me las consultó para que no quedaran vacíos. Por ejemplo, no especifiqué qué pasaba con los productos no vendidos, ni las prioridades entre pedidos, como qué pasaba si hacían dos pedidos al mismo tiempo.

### 3. Rol de Head Chef: ¿te sientes 100% dueño y responsable del código fuente generado o existen componentes que consideras "caja negra"?

Sí, totalmente. Ningún paso avanzó sin mi autorización. Cada fase fue presentada y puesta a prueba para estar seguro de que todo estaba bien.

### 4. Satisfacción del cliente: si el docente fuera un cliente real que pagó por este software, ¿qué tan alineado está el producto final con la visión original?

La verdad siento que está muy completo, y si yo fuera el cliente quedaría bastante contento con el trabajo que se realizó.
