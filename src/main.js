// Punto de entrada de la aplicación (T-0.1, R4).
// Arranque: reloj (con fecha simulada, D-057) → base de datos → store (D-059) → interfaz (Fase 4).

import { openDatabase } from './infrastructure/db.js';
import { createRepositories } from './infrastructure/repositories.js';
import { SystemClock } from './infrastructure/clock.js';
import { createStore, hydrateStore } from './state/store.js';
import { startApp } from './ui/app.js';

const app = document.getElementById('app');
const clock = new SystemClock(window.location.search);
const store = createStore();

async function start() {
  const db = await openDatabase();
  const repositories = createRepositories(db);
  await hydrateStore(store, repositories);
  startApp({ root: app, store, clock });
}

start().catch((error) => {
  // Sin IndexedDB la app no puede operar (docs/design.md §5.4).
  app.textContent = error.message;
});
