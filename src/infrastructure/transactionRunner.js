// Operaciones todo o nada sobre varias tablas (T-2.3, D-056).
// Ejemplo: entregar un pedido guarda la venta y cambia el pedido en la misma
// transacción; si algo falla, no queda nada a medias (docs/design.md §5.5).
//
// Importante: dentro de `work` solo se deben esperar (await) operaciones de los
// repositorios con la `tx` recibida. Esperar otra cosa (por ejemplo un fetch o un
// setTimeout) hace que IndexedDB cierre la transacción antes de tiempo.

export class IndexedDbTransactionRunner {
  /** @param {IDBDatabase} db */
  constructor(db) {
    this.db = db;
  }

  /**
   * @template T
   * @param {string[]} storeNames tablas que participan
   * @param {(tx: IDBTransaction) => Promise<T>} work
   * @returns {Promise<T>} se resuelve cuando todo quedó guardado
   */
  run(storeNames, work) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeNames, 'readwrite');
      let result;
      let failure = null;

      tx.oncomplete = () => resolve(result);
      tx.onabort = () => reject(failure ?? tx.error ?? new Error('Transacción cancelada'));
      tx.onerror = (event) => event.preventDefault();

      Promise.resolve()
        .then(() => work(tx))
        .then(
          (value) => {
            result = value;
          },
          (error) => {
            failure = error;
            try {
              tx.abort();
            } catch {
              reject(error);
            }
          },
        );
    });
  }
}
