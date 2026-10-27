// Servicio de ventas (T-7.1). REQ-F-12 a REQ-F-14, REQ-F-22, REQ-F-23 · INV-12, INV-13 ·
// D-016, D-017, D-031, D-069, D-080, D-106, D-107.

import { MSG } from '../domain/messages.js';
import { parseMoney } from '../domain/money.js';
import { parseProductQuantity } from '../domain/quantity.js';
import { isValidDate } from '../domain/dates.js';
import { availableToSell } from '../domain/stock.js';
import {
  isBlank,
  validatePositive,
  validateNotFutureDate,
  checkSaleStock,
} from '../domain/validators.js';
import { upsertEntity, removeEntity } from '../state/store.js';
import { success, failure } from './result.js';

/**
 * @param {{ store, repositories, clock, idGenerator }} deps
 */
export function createSaleService({ store, repositories, clock, idGenerator }) {
  const data = () => store.getState().data;
  const productById = (id) => data().products.find((p) => p.id === id) ?? null;

  return {
    /**
     * Crea o edita una venta. Las líneas totalmente vacías se ignoran.
     * Errores: date, form y por línea `line-{i}-product`, `line-{i}-quantity`, `line-{i}-price`.
     * @param {{ id?: string, date: string, lines: Array<{ productId: string, quantityText: string, priceText: string }> }} input
     */
    async save({ id = null, date, lines }) {
      const existing = id ? data().sales.find((s) => s.id === id) : null;
      const previousIds = new Set((existing?.items ?? []).map((i) => i.productId));
      const errors = {};

      if (isBlank(date) || !isValidDate(date)) errors.date = MSG.REQUIRED;
      else {
        const dateError = validateNotFutureDate(date, clock.today());
        if (dateError) errors.date = dateError;
      }

      const items = [];
      const firstLineOf = new Map();
      lines.forEach((line, i) => {
        const empty = isBlank(line.productId) && isBlank(line.quantityText) && isBlank(line.priceText);
        if (empty) return;
        const product = productById(line.productId);
        const usable = product && (product.isActive || previousIds.has(product.id));
        if (!usable) errors[`line-${i}-product`] = MSG.REQUIRED;

        const quantity = parseProductQuantity(line.quantityText);
        const quantityError = quantity.ok ? validatePositive(quantity.value) : quantity.error;
        if (quantityError) errors[`line-${i}-quantity`] = quantityError;

        const price = parseMoney(line.priceText);
        const priceError = price.ok ? validatePositive(price.value) : price.error;
        if (priceError) errors[`line-${i}-price`] = priceError;

        if (usable && !quantityError && !priceError) {
          items.push({ productId: product.id, quantity: quantity.value, unitPrice: price.value });
          if (!firstLineOf.has(product.id)) firstLineOf.set(product.id, i);
        }
      });

      if (Object.keys(errors).length) return failure(errors);
      if (items.length === 0) return failure({ form: MSG.AT_LEAST_ONE_PRODUCT });

      // Líneas repetidas: se suman en la primera, que conserva su precio (D-069).
      const merged = [];
      for (const item of items) {
        const found = merged.find((m) => m.productId === item.productId);
        if (found) found.quantity += item.quantity;
        else merged.push({ ...item });
      }

      // Si una línea no alcanza, no se guarda nada (D-031). Al editar se compara el aumento neto.
      const stockErrors = checkSaleStock(
        merged,
        existing?.items ?? [],
        (productId) => availableToSell(productId, data()),
        (productId) => productById(productId)?.name ?? '',
      );
      if (stockErrors.length) {
        return failure(Object.fromEntries(stockErrors.map((e) => [`line-${firstLineOf.get(e.productId)}-quantity`, e.message])));
      }

      const sale = {
        id: existing?.id ?? idGenerator.newId(),
        date,
        items: merged,
        ...(existing?.customItems ? { customItems: existing.customItems } : {}),
        orderId: existing?.orderId ?? null,
      };
      try {
        await repositories.sales.put(sale);
      } catch {
        return failure({ form: MSG.SAVE_FAILED });
      }
      store.setState((state) => upsertEntity(state, 'sales', sale));
      return success(sale);
    },

    /** Elimina una venta; sus unidades vuelven a la existencia (REQ-F-14, D-017). */
    async remove(id) {
      try {
        await repositories.sales.delete(id);
      } catch {
        return failure({ form: MSG.SAVE_FAILED });
      }
      store.setState((state) => removeEntity(state, 'sales', id));
      return success();
    },
  };
}
