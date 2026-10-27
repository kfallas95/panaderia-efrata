// Punto de entrada de la aplicación (T-0.1, R4).
// Fase 2: abre la base de datos al cargar la página. El store, el router y las
// pantallas se agregan en las fases 3 y 4 de docs/tasks.md.

import { openDatabase } from './infrastructure/db.js';

const app = document.getElementById('app');

openDatabase().catch((error) => {
  // Sin IndexedDB la app no puede operar (docs/design.md §5.4).
  app.textContent = error.message;
});
