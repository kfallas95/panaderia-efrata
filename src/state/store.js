// Store en memoria (T-3.1). D-059 · docs/design.md §5.1 y §5.2.
//
// IndexedDB es la fuente de verdad; el store es una copia en memoria que se
// carga al arrancar (hydrateStore) y que la capa de aplicación actualiza después
// de cada transacción confirmada. Los valores derivados no viven aquí: se
// calculan con los selectores (D-036).
//
// El estado se trata como inmutable: cada cambio crea objetos y listas nuevos,
// así los selectores detectan los cambios comparando referencias.

/** Colecciones del contrato de datos (docs/data-contract.json). */
export const COLLECTIONS = Object.freeze([
  'products',
  'supplies',
  'productions',
  'stockOuts',
  'stockCounts',
  'expenses',
  'sales',
  'orders',
]);

/** Estado inicial: colecciones vacías y estado de la interfaz. */
export function createInitialState() {
  return {
    data: Object.fromEntries(COLLECTIONS.map((name) => [name, []])),
    ui: { ready: false },
  };
}

/**
 * @param {object} [initialState]
 * @returns {{
 *   getState: () => object,
 *   setState: (update: object | ((state: object) => object)) => void,
 *   subscribe: (listener: (state: object, previous: object) => void) => () => void
 * }}
 */
export function createStore(initialState = createInitialState()) {
  let state = initialState;
  const listeners = new Set();

  return {
    getState: () => state,

    /** Recibe un objeto parcial (se mezcla en el primer nivel) o una función estado → estado nuevo. */
    setState(update) {
      const previous = state;
      state = typeof update === 'function' ? update(state) : { ...state, ...update };
      if (state === previous) return;
      for (const listener of [...listeners]) listener(state, previous);
    },

    /** Devuelve una función para dejar de escuchar. */
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/**
 * Carga las 8 colecciones desde los repositorios. Solo lee: no modifica IndexedDB.
 * @param {ReturnType<typeof createStore>} store
 * @param {Record<string, {getAll: () => Promise<Array>}>} repositories
 */
export async function hydrateStore(store, repositories) {
  const lists = await Promise.all(COLLECTIONS.map((name) => repositories[name].getAll()));
  const data = Object.fromEntries(COLLECTIONS.map((name, index) => [name, lists[index]]));
  store.setState((state) => ({ ...state, data, ui: { ...state.ui, ready: true } }));
}

// ---------- Cambios puros sobre el estado (los usa la capa de aplicación) ----------

/** Agrega o reemplaza una entidad de una colección (por id). */
export function upsertEntity(state, collection, entity) {
  const list = state.data[collection];
  const index = list.findIndex((item) => item.id === entity.id);
  const next = index === -1 ? [...list, entity] : list.map((item, i) => (i === index ? entity : item));
  return { ...state, data: { ...state.data, [collection]: next } };
}

/** Quita una entidad de una colección (por id). */
export function removeEntity(state, collection, id) {
  const list = state.data[collection];
  return { ...state, data: { ...state.data, [collection]: list.filter((item) => item.id !== id) } };
}
