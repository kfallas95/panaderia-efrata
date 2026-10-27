// Repositorios sobre IndexedDB (T-2.2).
// Puerto Repository<T>: getAll, getById, add, put, delete — todos asíncronos
// (docs/design.md §2.2 · D-018, R8).
// Los métodos de escritura aceptan una transacción `tx` opcional para participar
// en una operación todo o nada (transactionRunner.js, D-056). Sin `tx`, cada
// escritura usa su propia transacción y se resuelve cuando queda guardada.

/** Convierte una petición de IndexedDB en promesa. */
function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Promesa que se resuelve cuando la transacción termina de guardar. */
function transactionDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    // onerror llega primero con el error de la petición; tx.error se llena después.
    tx.onerror = (event) => reject(event.target.error ?? tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('Transacción cancelada'));
  });
}

export class IndexedDbRepository {
  /**
   * @param {IDBDatabase} db
   * @param {string} storeName
   */
  constructor(db, storeName) {
    this.db = db;
    this.storeName = storeName;
  }

  async getAll() {
    const tx = this.db.transaction(this.storeName, 'readonly');
    return requestToPromise(tx.objectStore(this.storeName).getAll());
  }

  async getById(id) {
    const tx = this.db.transaction(this.storeName, 'readonly');
    const result = await requestToPromise(tx.objectStore(this.storeName).get(id));
    return result ?? null;
  }

  /** Agrega un registro nuevo; falla si el id ya existe. */
  add(entity, tx) {
    return this.write((store) => store.add(entity), tx);
  }

  /** Crea o reemplaza un registro. */
  put(entity, tx) {
    return this.write((store) => store.put(entity), tx);
  }

  delete(id, tx) {
    return this.write((store) => store.delete(id), tx);
  }

  /** @private */
  async write(operation, externalTx) {
    if (externalTx) {
      await requestToPromise(operation(externalTx.objectStore(this.storeName)));
      return;
    }
    const tx = this.db.transaction(this.storeName, 'readwrite');
    const done = transactionDone(tx);
    operation(tx.objectStore(this.storeName));
    await done;
  }
}

/**
 * Repositorio de conteos físicos: solo lectura y alta.
 * Los conteos no se editan ni se eliminan (INV-23, D-024).
 */
export class AppendOnlyRepository {
  constructor(db, storeName) {
    this.inner = new IndexedDbRepository(db, storeName);
  }

  getAll() {
    return this.inner.getAll();
  }

  getById(id) {
    return this.inner.getById(id);
  }

  add(entity, tx) {
    return this.inner.add(entity, tx);
  }
}

/** Un repositorio por tabla. */
export function createRepositories(db) {
  return {
    products: new IndexedDbRepository(db, 'products'),
    supplies: new IndexedDbRepository(db, 'supplies'),
    productions: new IndexedDbRepository(db, 'productions'),
    stockOuts: new IndexedDbRepository(db, 'stockOuts'),
    stockCounts: new AppendOnlyRepository(db, 'stockCounts'),
    expenses: new IndexedDbRepository(db, 'expenses'),
    sales: new IndexedDbRepository(db, 'sales'),
    orders: new IndexedDbRepository(db, 'orders'),
  };
}
