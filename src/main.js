// Punto de entrada de la aplicación (T-0.1, R4).
// Arranque: reloj (con fecha simulada, D-057) → base de datos → store (D-059)
// → servicios de aplicación → interfaz.

import { openDatabase } from './infrastructure/db.js';
import { createRepositories } from './infrastructure/repositories.js';
import { IndexedDbTransactionRunner } from './infrastructure/transactionRunner.js';
import { SystemClock } from './infrastructure/clock.js';
import { idGenerator } from './infrastructure/idGenerator.js';
import { createStore, hydrateStore } from './state/store.js';
import { createProductService } from './application/productService.js';
import { createProductionService } from './application/productionService.js';
import { createStockOutService } from './application/stockOutService.js';
import { startApp } from './ui/app.js';

const app = document.getElementById('app');
const clock = new SystemClock(window.location.search);
const store = createStore();

async function start() {
  const db = await openDatabase();
  const repositories = createRepositories(db);
  const runner = new IndexedDbTransactionRunner(db);
  await hydrateStore(store, repositories);

  const deps = { store, repositories, runner, clock, idGenerator };
  const services = {
    products: createProductService(deps),
    production: createProductionService(deps),
    stockOuts: createStockOutService(deps),
  };
  startApp({ root: app, store, clock, services });
}

start().catch((error) => {
  // Sin IndexedDB la app no puede operar (docs/design.md §5.4).
  app.textContent = error.message;
});
