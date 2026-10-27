# system_prompt.md — Reglas de contexto para agentes de IA

> Proyecto **Panadería Efrata** · Requisito del curso RC-03 · Versión 1.3 (2026-10-27: comentarios en español, D-120) · 2026-10-27
> Estas reglas son **obligatorias** para cualquier agente de IA que lea, genere o modifique código o documentación en este repositorio.
> Completadas en el paso 5 con la estructura de módulos y las convenciones de archivos de `docs/design.md` §4 (D-013, D-061).

---

## 1. Fuentes de verdad (leer antes de actuar)

Orden de autoridad:

1. `docs/propuesta.md` — alcance aprobado por el autor. Las decisiones posteriores de `CLAUDE.md` §9 lo precisan y, si difieren, prevalecen (C-01).
2. `CLAUDE.md` — lenguaje ubicuo, invariantes, decisiones (D-xxx) y preguntas abiertas (Q-xx).
3. `docs/requirements.md` — requerimientos EARS.
4. `docs/data-contract.json` — contrato de datos.
5. `docs/wireframe.md` — pantallas, textos y mensajes visibles.
6. `docs/design.md` — arquitectura y módulos.
7. `docs/tasks.md` — plan de implementación por fases.

Si dos fuentes se contradicen, **no elijas**: detente y repórtalo al autor.

## 2. Stack tecnológico permitido (cerrado)

| Permitido | Prohibido |
|---|---|
| HTML, CSS y **JavaScript** con **módulos ES nativos** | Frameworks de UI (React, Vue, Angular, Svelte…) y librerías de componentes |
| **IndexedDB** del navegador, solo a través de repositorios | LocalStorage o sessionStorage para datos del negocio; backend, servidores o bases de datos externas |
| Servidor local de desarrollo (Live Server) | Herramientas de build o empaquetado (Vite, Webpack, npm scripts, TypeScript compilado) |
| Recursos guardados dentro del repositorio (SVG propios, fuentes locales) | Servicios externos en tiempo de ejecución: APIs, CDN y fuentes o imágenes remotas |
| Verificación manual | Agregar pruebas automatizadas o dependencias sin aprobación del autor |

Cualquier dependencia nueva requiere una decisión registrada en `CLAUDE.md` §9 **antes** de usarla.

## 3. Convenciones de código

- **Idioma:**
  - Código, nombres y contrato de datos en **inglés**.
  - Comentarios técnicos en **español**, igual que la documentación (D-120).
  - Textos visibles para el usuario en **español**.
- **Nombres:**
  - Entidades en `PascalCase`.
  - Funciones y variables en `camelCase`.
  - Constantes y enumeraciones en `UPPER_SNAKE_CASE`.
- **Lenguaje ubicuo:**
  - Usa exactamente los términos de `CLAUDE.md` §3 (`Product`, `Supply`, `Expense`, `Sale`, `SaleItem`, `Order`, `CatalogOrderItem`, `CustomOrderItem`, `SupplyUnit`…).
  - No inventes sinónimos (no `Item`, `Ingredient` ni `Purchase` si no están definidos).
- **Capas (R8):**
  - UI → Estado → Aplicación → Dominio ← Infraestructura.
  - El dominio no accede a IndexedDB, al DOM ni a la fecha del sistema.
  - El acceso a datos se hace solo mediante repositorios asíncronos.
- **Valores derivados:** nunca se guardan. Por ejemplo `availableToSell`, `reservedQuantity`, `totalSold` y `profit`.
- **Moneda:** colones (₡) guardados como **céntimos enteros** (₡1 250,50 → 125050); la UI muestra 2 decimales (D-025).
- **Cantidades de insumo:** milésimas enteras (2,5 kg → 2500); la UI muestra hasta 3 decimales (D-075).
- **Validación:**
  - Reglas puras en el dominio.
  - Errores de usuario (vacíos, valores ≤ 0, duplicados, inventario insuficiente) con mensaje visible en español junto al campo o la acción.
- **Números de entrada:**
  - Coma o punto como separador decimal; sin separadores de miles.
  - Máximo 2 decimales en montos, 0 en productos y 3 en insumos (D-058).
- **Persistencia:**
  - IndexedDB `panaderiaEfrata`; el esquema está en `docs/design.md` §5.4.
  - Las operaciones que tocan varios stores van en una sola transacción, todo o nada (D-056).
  - Cambiar el esquema exige subir la versión y migrar en `onupgradeneeded`, sin borrar datos.
- **Tiempo:**
  - Toda lectura de fecha u hora pasa por el puerto `Clock`, que admite la fecha simulada de D-057.
  - Nunca uses `new Date()` fuera de `infrastructure/clock.js`.
  - El dominio no lee el reloj: recibe `now` o `today` como parámetro.
- **Estructura de carpetas (D-061):**

  ```
  index.html · styles.css · assets/{illustrations,icons}/ · docs/
  src/main.js
  src/domain/          reglas puras (sin DOM, sin IndexedDB, sin reloj del sistema)
  src/application/     servicios por entidad ({entidad}Service.js)
  src/infrastructure/  db.js, repositories.js, transactionRunner.js, clock.js, idGenerator.js
  src/state/           store.js, selectors.js
  src/ui/              app.js, router.js, dom.js, components/, screens/{orders,sales,inventory,expenses,report}/
  ```

- **Archivos y módulos:**
  - Archivos en `camelCase.js`, con un módulo por responsabilidad.
  - Solo exportaciones con nombre; no se usa `export default`.
  - Las pantallas exportan `render{Nombre}Screen(container, params)`.
  - Los textos de error viven en `src/domain/messages.js`.
- **Rutas:** router por hash (`#/orders`, `#/sales/new`…) según `docs/design.md` §3.1 (D-055).
- **Recursos:** los SVG se guardan en `assets/` y se usan con la paleta "Horno cálido" definida como variables CSS en `styles.css` (D-014).

## 4. Prohibición de parches fuera de la especificación

1. **No implementes nada que no esté en la especificación aprobada.** Esto incluye funcionalidades, campos, pantallas, validaciones y textos.
2. **No corrijas en silencio.** Si encuentras un error o un vacío en la especificación, detente, descríbelo y propón opciones al autor.
3. **Primero la especificación, después el código.** Todo cambio de comportamiento sigue este orden:
   1. Registrar la decisión en `CLAUDE.md` §9.
   2. Actualizar los documentos afectados.
   3. Implementar.
4. **Unchanged Behavior:** cada cambio debe dejar igual todo lo que ya funcionaba. Antes de cerrar una fase, repite la verificación de las fases anteriores afectadas.
5. **Alcance mínimo:** modifica solo los archivos que la tarea requiere. No hagas refactorizaciones, renombres ni reformateos no solicitados.
6. **Una fase a la vez:** no avances a la siguiente fase de `docs/tasks.md` sin la aprobación explícita del autor.
7. **No inventes datos:** lo que no esté definido se marca **PENDIENTE** y se pregunta.
