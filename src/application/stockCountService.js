// Servicio de conteo físico (T-6.2). REQ-F-08 · INV-09, INV-25 · D-024, D-041, D-075.
// Los conteos no se editan ni se eliminan (INV-23).

import { MSG } from '../domain/messages.js';
import { parseSupplyQuantity } from '../domain/quantity.js';
import { supplyQuantity } from '../domain/stock.js';
import { validateCountQuantity } from '../domain/validators.js';
import { upsertEntity } from '../state/store.js';
import { success, failure, collectErrors } from './result.js';

/**
 * @param {{ store, repositories, clock, idGenerator }} deps
 */
export function createStockCountService({ store, repositories, clock, idGenerator }) {
  const data = () => store.getState().data;

  return {
    /** @param {{ supplyId: string, quantityText: string }} input cantidad real en la unidad del insumo */
    async register({ supplyId, quantityText }) {
      const supply = data().supplies.find((s) => s.id === supplyId && s.isActive);
      const parsed = parseSupplyQuantity(quantityText);
      const errors = collectErrors([
        ['supplyId', supply ? null : MSG.REQUIRED],
        ['quantity', parsed.ok ? validateCountQuantity(parsed.value) : parsed.error],
      ]);
      if (errors) return failure(errors);

      const count = {
        id: idGenerator.newId(),
        supplyId,
        countedAt: clock.nowIso(),
        previousQuantity: supplyQuantity(supplyId, data()),
        newQuantity: parsed.value,
      };
      try {
        await repositories.stockCounts.add(count);
      } catch {
        return failure({ form: MSG.SAVE_FAILED });
      }
      store.setState((state) => upsertEntity(state, 'stockCounts', count));
      return success(count);
    },
  };
}
