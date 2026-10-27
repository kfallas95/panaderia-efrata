// Servicio de insumos (T-6.1). REQ-F-02, REQ-F-07, REQ-F-25 · D-023, D-039, D-102, D-103.

import { MSG } from '../domain/messages.js';
import { SupplyUnit } from '../domain/types.js';
import { validateRequired, validateUniqueName, supplyHasHistory } from '../domain/validators.js';
import { upsertEntity, removeEntity } from '../state/store.js';
import { success, failure, collectErrors } from './result.js';

/**
 * @param {{ store, repositories, idGenerator }} deps
 */
export function createSupplyService({ store, repositories, idGenerator }) {
  const data = () => store.getState().data;
  const find = (id) => data().supplies.find((s) => s.id === id) ?? null;

  async function persist(supply) {
    await repositories.supplies.put(supply);
    store.setState((state) => upsertEntity(state, 'supplies', supply));
    return supply;
  }

  return {
    /** true si la unidad ya no se puede cambiar (D-102). */
    isUnitLocked(id) {
      return Boolean(id) && supplyHasHistory(id, data());
    },

    /**
     * Crea o edita un insumo.
     * @param {{ id?: string, name: string, unit: string }} input
     */
    async save({ id = null, name, unit }) {
      const existing = id ? find(id) : null;
      let unitError = Object.values(SupplyUnit).includes(unit) ? null : MSG.REQUIRED;
      if (!unitError && existing && unit !== existing.unit && this.isUnitLocked(id)) unitError = MSG.UNIT_LOCKED;

      const errors = collectErrors([
        ['name', validateRequired(name) ?? validateUniqueName(name, data().supplies, 'supply', id)],
        ['unit', unitError],
      ]);
      if (errors) return failure(errors);

      const supply = {
        id: existing?.id ?? idGenerator.newId(),
        name: name.trim().replace(/\s+/g, ' '),
        unit,
        isActive: existing ? existing.isActive : true,
      };
      try {
        return success(await persist(supply));
      } catch {
        return failure({ form: MSG.SAVE_FAILED });
      }
    },

    /** @returns {{ mode: 'deactivate' | 'delete', message: string }} */
    removalPlan(id) {
      const supply = find(id);
      return supplyHasHistory(id, data())
        ? { mode: 'deactivate', message: `${supply.name} tiene historial; se desactivará y no aparecerá en nuevos gastos ni conteos` }
        : { mode: 'delete', message: `¿Eliminar ${supply.name}?` };
    },

    async remove(id) {
      const plan = this.removalPlan(id);
      try {
        if (plan.mode === 'deactivate') {
          await persist({ ...find(id), isActive: false });
        } else {
          await repositories.supplies.delete(id);
          store.setState((state) => removeEntity(state, 'supplies', id));
        }
        return success(plan.mode);
      } catch {
        return failure({ form: MSG.SAVE_FAILED });
      }
    },

    async reactivate(id) {
      try {
        return success(await persist({ ...find(id), isActive: true }));
      } catch {
        return failure({ form: MSG.SAVE_FAILED });
      }
    },
  };
}
