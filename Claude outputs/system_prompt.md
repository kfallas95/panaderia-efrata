# system_prompt.md — Reglas de contexto para agentes de IA

> Proyecto **Panadería Efrata** · Requisito del curso RC-03 · Versión 0.1 (borrador para aprobación) · 2026-10-26
> Estas reglas son **obligatorias** para cualquier agente de IA que lea, genere o modifique código o documentación en este repositorio.
> Se completan en el paso 5 (diseño), con la estructura de módulos y las convenciones de archivos (D-013).

---

## 1. Fuentes de verdad (leer antes de actuar)

Orden de autoridad:

1. `docs/propuesta.md` — alcance aprobado por el autor.
2. `CLAUDE.md` — lenguaje ubicuo, invariantes, decisiones (D-xxx) y preguntas abiertas (Q-xx).
3. `docs/requirements.md` — requerimientos EARS.
4. `docs/data-contract.json` — contrato de datos.
5. `docs/design.md` — arquitectura y módulos.
6. `docs/tasks.md` — plan de implementación por fases.

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
  - Código, nombres, comentarios técnicos y contrato de datos en **inglés**.
  - Textos visibles para el usuario en **español**.
- **Nombres:**
  - Entidades en `PascalCase`.
  - Funciones y variables en `camelCase`.
  - Constantes y enumeraciones en `UPPER_SNAKE_CASE`.
- **Lenguaje ubicuo:**
  - Usa exactamente los términos de `CLAUDE.md` §3 (`Product`, `Supply`, `Expense`, `Sale`, `Order`…).
  - No inventes sinónimos (no `Item`, `Ingredient` ni `Purchase` si no están definidos).
- **Capas (R8):**
  - UI → Estado → Aplicación → Dominio ← Infraestructura.
  - El dominio no accede a IndexedDB, al DOM ni a la fecha del sistema.
  - El acceso a datos se hace solo mediante repositorios asíncronos.
- **Valores derivados:** nunca se guardan. Por ejemplo `availableToSell`, `reservedQuantity`, `totalSold` y `profit`.
- **Moneda:** colones (₡). La representación interna se define en el contrato de datos (Q-06).
- **Validación:**
  - Reglas puras en el dominio.
  - Errores de usuario (vacíos, valores ≤ 0, duplicados, inventario insuficiente) con mensaje visible en español junto al campo o la acción.
- **Pendiente (paso 5):** estructura de carpetas, nombres de archivos y patrones de módulos.

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
