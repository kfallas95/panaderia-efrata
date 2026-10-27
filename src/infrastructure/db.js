// Base de datos IndexedDB (T-2.1).
// Esquema: docs/design.md §5.4 · D-004, D-060, D-070.
// Si en el futuro cambia el esquema se sube DB_VERSION y se migra en
// onupgradeneeded, sin borrar datos (system_prompt.md §3).

import { MSG } from '../domain/messages.js';

export const DB_NAME = 'panaderiaEfrata';
export const DB_VERSION = 1;

/** Tablas (object stores) e índices de la versión 1. */
export const STORES = Object.freeze({
  products: [],
  supplies: [],
  productions: ['productId', 'date'],
  stockOuts: ['productId', 'date'],
  stockCounts: ['supplyId', 'countedAt'],
  expenses: ['supplyId', 'date'],
  sales: ['date', 'orderId'],
  orders: ['status', 'deliveryDate'],
});

export const STORE_NAMES = Object.freeze(Object.keys(STORES));

/** Error cuando el navegador no permite usar IndexedDB (por ejemplo, permisos bloqueados). */
export class StorageUnavailableError extends Error {
  constructor(cause) {
    super(MSG.STORAGE_UNAVAILABLE);
    this.name = 'StorageUnavailableError';
    this.cause = cause;
  }
}

/** Crea las tablas que falten. Nunca borra tablas ni datos existentes. */
function upgrade(db) {
  for (const [storeName, indexes] of Object.entries(STORES)) {
    if (db.objectStoreNames.contains(storeName)) continue;
    const store = db.createObjectStore(storeName, { keyPath: 'id' });
    for (const field of indexes) store.createIndex(field, field, { unique: false });
  }
}

/**
 * Abre (y si hace falta crea) la base de datos.
 * @param {IDBFactory} [factory] por defecto, el indexedDB del navegador
 * @returns {Promise<IDBDatabase>}
 */
export function openDatabase(factory = globalThis.indexedDB) {
  return new Promise((resolve, reject) => {
    if (!factory) {
      reject(new StorageUnavailableError());
      return;
    }
    let request;
    try {
      request = factory.open(DB_NAME, DB_VERSION);
    } catch (error) {
      reject(new StorageUnavailableError(error));
      return;
    }
    request.onupgradeneeded = () => upgrade(request.result);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new StorageUnavailableError(request.error));
    request.onblocked = () => reject(new StorageUnavailableError(new Error('blocked')));
  });
}
