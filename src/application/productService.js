// Servicio de productos (T-5.1). REQ-F-01, REQ-F-02, REQ-F-25 · D-023, D-034, D-074, D-099.

import { MSG } from '../domain/messages.js';
import { parseMoney } from '../domain/money.js';
import {
  validateRequired,
  validatePositive,
  validateUniqueName,
  validateProductRemoval,
  productHasHistory,
} from '../domain/validators.js';
import { upsertEntity, removeEntity } from '../state/store.js';
import { success, failure, collectErrors } from './result.js';

/**
 * @param {{ store, repositories, idGenerator }} deps
 */
export function createProductService({ store, repositories, idGenerator }) {
  const data = () => store.getState().data;
  const find = (id) => data().products.find((p) => p.id === id) ?? null;

  async function persist(product) {
    await repositories.products.put(product);
    store.setState((state) => upsertEntity(state, 'products', product));
    return product;
  }

  return {
    /**
     * Crea o edita un producto.
     * @param {{ id?: string, name: string, priceText: string }} input
     */
    async save({ id = null, name, priceText }) {
      const price = parseMoney(priceText);
      const errors = collectErrors([
        ['name', validateRequired(name) ?? validateUniqueName(name, data().products, 'product', id)],
        ['price', price.ok ? validatePositive(price.value) : price.error],
      ]);
      if (errors) return failure(errors);

      const existing = id ? find(id) : null;
      const product = {
        id: existing?.id ?? idGenerator.newId(),
        name: name.trim().replace(/\s+/g, ' '),
        price: price.value,
        isActive: existing ? existing.isActive : true,
      };
      try {
        return success(await persist(product));
      } catch {
        return failure({ form: MSG.SAVE_FAILED });
      }
    },

    /**
     * Qué pasará al eliminar: bloqueado por pedidos pendientes, desactivar o eliminar.
     * @returns {{ blocked: string } | { mode: 'deactivate' | 'delete', message: string }}
     */
    removalPlan(id) {
      const product = find(id);
      const blocked = validateProductRemoval(id, product.name, data().orders);
      if (blocked) return { blocked };
      return productHasHistory(id, data())
        ? { mode: 'deactivate', message: `${product.name} tiene historial; se desactivará y no aparecerá en nuevas ventas ni pedidos` }
        : { mode: 'delete', message: `¿Eliminar ${product.name}?` };
    },

    /** Elimina o desactiva según removalPlan (se vuelve a evaluar al ejecutar). */
    async remove(id) {
      const plan = this.removalPlan(id);
      if (plan.blocked) return failure({ form: plan.blocked });
      try {
        if (plan.mode === 'deactivate') {
          await persist({ ...find(id), isActive: false });
        } else {
          await repositories.products.delete(id);
          store.setState((state) => removeEntity(state, 'products', id));
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
