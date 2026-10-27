// Punto de entrada de la aplicación (T-0.1, R4).
// Fase 3: abre la base de datos y carga el store en memoria (D-059).
// El router y las pantallas se agregan en la Fase 4 de docs/tasks.md.

import { openDatabase } from './infrastructure/db.js';
import { createRepositories } from './infrastructure/repositories.js';
import { createStore, hydrateStore } from './state/store.js';

const app = document.getElementById('app');
const store = createStore();

async function start() {
  const db = await openDatabase();
  const repositories = createRepositories(db);
  await hydrateStore(store, repositories);
}

start().catch((error) => {
  // Sin IndexedDB la app no puede operar (docs/design.md §5.4).
  app.textContent = error.message;
});
