// Resultado común de los servicios de aplicación (design §5.2).
// ok: true  → { ok: true, value }
// ok: false → { ok: false, errors: { campo: mensaje } }; no se guardó nada.

export const success = (value = null) => ({ ok: true, value });
export const failure = (errors) => ({ ok: false, errors });

/** Junta errores; devuelve null si no hay ninguno. */
export function collectErrors(entries) {
  const errors = Object.fromEntries(entries.filter(([, message]) => message));
  return Object.keys(errors).length ? errors : null;
}
