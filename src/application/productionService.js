// Servicio de producción (T-5.2). REQ-F-03, REQ-F-04, REQ-F-23 · D-076, D-097.

import { MSG } from '../domain/messages.js';
import { parseProductQuantity } from '../domain/quantity.js';
import { isValidDate } from '../domain/dates.js';
import { stockOnHand } from '../domain/stock.js';
import {
  isBlank,
  validatePositive,
  validateNotFutureDate,
  validateProductionBatch,
  checkProductionChange,
} from '../domain/validators.js';
import { upsertEntity, removeEntity } from '../state/store.js';
import { success, failure, collectErrors } from './result.js';

function validateDate(date, today) {
  if (isBlank(date) || !isValidDate(date)) return MSG.REQUIRED;
  return validateNotFutureDate(date, today);
}

function readQuantity(text) {
  const parsed = parseProductQuantity(text);
  if (!parsed.ok) return { error: parsed.error };
  const error = validatePositive(parsed.value);
  return error ? { error } : { value: parsed.value };
}

/**
 * @param {{ store, repositories, runner, clock, idGenerator }} deps
 */
export function createProductionService({ store, repositories, runner, clock, idGenerator }) {
  const data = () => store.getState().data;
  const productName = (id) => data().products.find((p) => p.id === id)?.name ?? '';

  return {
    /**
     * Registra producción de varios productos; las casillas vacías se ignoran (D-076).
     * @param {{ date: string, entries: Array<{ productId: string, quantityText: string }> }} input
     * @returns errores por campo: date, form o el id del producto
     */
    async registerBatch({ date, entries }) {
      const batchError = validateProductionBatch(entries.map((e) => e.quantityText));
      if (batchError) return failure({ form: batchError });

      const filled = entries.filter((e) => !isBlank(e.quantityText));
      const quantities = filled.map((e) => [e.productId, readQuantity(e.quantityText)]);
      const errors = collectErrors([
        ['date', validateDate(date, clock.today())],
        ...quantities.map(([productId, q]) => [productId, q.error]),
      ]);
      if (errors) return failure(errors);

      const productions = quantities.map(([productId, q]) => ({
        id: idGenerator.newId(),
        productId,
        quantity: q.value,
        date,
      }));
      try {
        await runner.run(['productions'], async (tx) => {
          for (const production of productions) await repositories.productions.add(production, tx);
        });
      } catch {
        return failure({ form: MSG.SAVE_FAILED });
      }
      store.setState((state) => productions.reduce((s, p) => upsertEntity(s, 'productions', p), state));
      return success(productions);
    },

    /** Edita fecha y cantidad sin dejar la existencia en negativo (REQ-F-04). */
    async update(id, { date, quantityText }) {
      const current = data().productions.find((p) => p.id === id);
      const quantity = readQuantity(quantityText);
      const errors = collectErrors([
        ['date', validateDate(date, clock.today())],
        ['quantity', quantity.error ?? checkProductionChange(
          stockOnHand(current.productId, data()), current.quantity, quantity.value, productName(current.productId),
        )],
      ]);
      if (errors) return failure(errors);

      const updated = { ...current, date, quantity: quantity.value };
      try {
        await repositories.productions.put(updated);
      } catch {
        return failure({ form: MSG.SAVE_FAILED });
      }
      store.setState((state) => upsertEntity(state, 'productions', updated));
      return success(updated);
    },

    /** Elimina sin dejar la existencia en negativo (REQ-F-04). */
    async remove(id) {
      const current = data().productions.find((p) => p.id === id);
      const error = checkProductionChange(
        stockOnHand(current.productId, data()), current.quantity, 0, productName(current.productId),
      );
      if (error) return failure({ form: error });
      try {
        await repositories.productions.delete(id);
      } catch {
        return failure({ form: MSG.SAVE_FAILED });
      }
      store.setState((state) => removeEntity(state, 'productions', id));
      return success();
    },
  };
}
