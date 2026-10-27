// Servicio de salidas de inventario (T-5.3). REQ-F-05 · D-020, D-098.

import { MSG } from '../domain/messages.js';
import { parseProductQuantity } from '../domain/quantity.js';
import { isValidDate } from '../domain/dates.js';
import { availableToSell } from '../domain/stock.js';
import { StockOutReason } from '../domain/types.js';
import {
  isBlank,
  validateRequired,
  validatePositive,
  validateNotFutureDate,
  checkStockOut,
} from '../domain/validators.js';
import { upsertEntity, removeEntity } from '../state/store.js';
import { success, failure, collectErrors } from './result.js';

/**
 * @param {{ store, repositories, clock, idGenerator }} deps
 */
export function createStockOutService({ store, repositories, clock, idGenerator }) {
  const data = () => store.getState().data;

  return {
    /**
     * @param {{ productId: string, quantityText: string, reason: string, date: string }} input
     */
    async register({ productId, quantityText, reason, date }) {
      const product = data().products.find((p) => p.id === productId && p.isActive);
      const parsed = parseProductQuantity(quantityText);
      let quantityError = parsed.ok ? validatePositive(parsed.value) : parsed.error;
      if (!quantityError && product) {
        quantityError = checkStockOut(parsed.value, availableToSell(productId, data()), product.name);
      }
      const errors = collectErrors([
        ['productId', product ? null : MSG.REQUIRED],
        ['quantity', quantityError],
        ['reason', Object.values(StockOutReason).includes(reason) ? null : MSG.REQUIRED],
        ['date', isBlank(date) || !isValidDate(date) ? validateRequired('') : validateNotFutureDate(date, clock.today())],
      ]);
      if (errors) return failure(errors);

      const stockOut = { id: idGenerator.newId(), productId, quantity: parsed.value, reason, date };
      try {
        await repositories.stockOuts.add(stockOut);
      } catch {
        return failure({ form: MSG.SAVE_FAILED });
      }
      store.setState((state) => upsertEntity(state, 'stockOuts', stockOut));
      return success(stockOut);
    },

    /** Elimina una salida; la existencia vuelve a subir (D-098). */
    async remove(id) {
      try {
        await repositories.stockOuts.delete(id);
      } catch {
        return failure({ form: MSG.SAVE_FAILED });
      }
      store.setState((state) => removeEntity(state, 'stockOuts', id));
      return success();
    },
  };
}
