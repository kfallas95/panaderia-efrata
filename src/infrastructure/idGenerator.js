// Generador de identificadores (T-2.5).
// crypto.randomUUID() funciona en localhost y 127.0.0.1 (contexto seguro).

export const idGenerator = Object.freeze({
  /** @returns {string} UUID nuevo */
  newId: () => crypto.randomUUID(),
});
