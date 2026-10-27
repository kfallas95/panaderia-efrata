// Servicio de pedidos (T-8.1). REQ-F-15, REQ-F-16, REQ-F-20 a REQ-F-24, REQ-F-27 ·
// INV-06, INV-13 a INV-15, INV-27 · D-026, D-043, D-053, D-069, D-073, D-110.
//
// Un pedido aparta sus productos aunque la existencia no alcance (REQ-F-15):
// aquí no se valida existencia. Lo que falta se calcula con la asignación por
// prioridad (selectAllocation) y se muestra en la tarjeta y el detalle.

import { MSG } from '../domain/messages.js';
import { parseMoney } from '../domain/money.js';
import { parseProductQuantity } from '../domain/quantity.js';
import { isValidDate, isValidTime } from '../domain/dates.js';
import { orderTotal } from '../domain/totals.js';
import { OrderStatus } from '../domain/types.js';
import {
  isBlank,
  validatePositive,
  validateDeliveryNotPast,
  validateAdvance,
  parsePhone,
  mergeLines,
} from '../domain/validators.js';
import { upsertEntity, removeEntity } from '../state/store.js';
import { success, failure } from './result.js';

/** Lee cantidad y precio de una línea; agrega los errores con el prefijo indicado. */
function readAmounts(line, prefix, errors) {
  const quantity = parseProductQuantity(line.quantityText);
  const quantityError = quantity.ok ? validatePositive(quantity.value) : quantity.error;
  if (quantityError) errors[`${prefix}-quantity`] = quantityError;

  const price = parseMoney(line.priceText);
  const priceError = price.ok ? validatePositive(price.value) : price.error;
  if (priceError) errors[`${prefix}-price`] = priceError;

  return quantityError || priceError ? null : { quantity: quantity.value, unitPrice: price.value };
}

/**
 * @param {{ store, repositories, clock, idGenerator }} deps
 */
export function createOrderService({ store, repositories, clock, idGenerator }) {
  const data = () => store.getState().data;
  const find = (id) => data().orders.find((o) => o.id === id) ?? null;
  const productById = (id) => data().products.find((p) => p.id === id) ?? null;

  return {
    /**
     * Crea o edita un pedido PENDING. Las líneas totalmente vacías se ignoran.
     * Errores: customerName, customerPhone, deliveryDate, deliveryTime, advance, form,
     * `line-{i}-product|quantity|price` y `custom-{i}-description|quantity|price`.
     * @param {{
     *   id?: string, customerName: string, phoneText: string, deliveryDate: string, deliveryTime: string,
     *   lines: Array<{ productId: string, quantityText: string, priceText: string }>,
     *   customLines: Array<{ description: string, quantityText: string, priceText: string }>,
     *   advanceText: string, notes: string
     * }} input
     */
    async save({ id = null, customerName, phoneText, deliveryDate, deliveryTime, lines, customLines, advanceText, notes }) {
      const existing = id ? find(id) : null;
      if (id && (!existing || existing.status !== OrderStatus.PENDING)) {
        return failure({ form: MSG.SAVE_FAILED });
      }
      const previousIds = new Set((existing?.items ?? []).map((i) => i.productId));
      const errors = {};

      if (isBlank(customerName)) errors.customerName = MSG.REQUIRED;

      const phone = parsePhone(phoneText);
      if (!phone.ok) errors.customerPhone = phone.error;

      const dateOk = !isBlank(deliveryDate) && isValidDate(deliveryDate);
      const timeOk = !isBlank(deliveryTime) && isValidTime(deliveryTime);
      if (!dateOk) errors.deliveryDate = MSG.REQUIRED;
      if (!timeOk) errors.deliveryTime = MSG.REQUIRED;
      // La entrega se valida solo al crear o al cambiarla (D-073).
      const deliveryChanged = !existing
        || existing.deliveryDate !== deliveryDate
        || existing.deliveryTime !== deliveryTime;
      if (dateOk && timeOk && deliveryChanged) {
        const pastError = validateDeliveryNotPast(deliveryDate, deliveryTime, clock.nowParts());
        if (pastError) errors.deliveryDate = pastError;
      }

      // Líneas del catálogo.
      const items = [];
      lines.forEach((line, i) => {
        if (isBlank(line.productId) && isBlank(line.quantityText) && isBlank(line.priceText)) return;
        const product = productById(line.productId);
        const usable = product && (product.isActive || previousIds.has(product.id));
        if (!usable) errors[`line-${i}-product`] = MSG.REQUIRED;
        const amounts = readAmounts(line, `line-${i}`, errors);
        if (usable && amounts) items.push({ productId: product.id, ...amounts });
      });

      // Artículos personalizados (INV-15).
      const customItems = [];
      customLines.forEach((line, i) => {
        if (isBlank(line.description) && isBlank(line.quantityText) && isBlank(line.priceText)) return;
        if (isBlank(line.description)) errors[`custom-${i}-description`] = MSG.REQUIRED;
        const amounts = readAmounts(line, `custom-${i}`, errors);
        if (!isBlank(line.description) && amounts) {
          customItems.push({ description: line.description.trim().replace(/\s+/g, ' '), ...amounts });
        }
      });

      // Adelanto opcional (D-026); si se escribe, > 0.
      let advanceAmount = null;
      if (!isBlank(advanceText)) {
        const advance = parseMoney(advanceText);
        const advanceError = advance.ok ? validatePositive(advance.value) : advance.error;
        if (advanceError) errors.advance = advanceError;
        else advanceAmount = advance.value;
      }

      // Producto repetido: se suma en la primera línea, que conserva su precio (INV-06, D-069).
      const merged = mergeLines(items);

      // El adelanto se compara con el total cuando todas las líneas son válidas; así este
      // error se muestra junto con los de cliente, teléfono y entrega (REQ-F-27).
      const hasLines = merged.length > 0 || customItems.length > 0;
      const lineErrors = Object.keys(errors).some((key) => key.startsWith('line-') || key.startsWith('custom-'));
      if (!errors.advance && hasLines && !lineErrors) {
        const advanceError = validateAdvance(advanceAmount, orderTotal({ items: merged, customItems }));
        if (advanceError) errors.advance = advanceError;
      }

      if (Object.keys(errors).length) return failure(errors);
      if (!hasLines) return failure({ form: MSG.AT_LEAST_ONE_PRODUCT });

      const order = {
        id: existing?.id ?? idGenerator.newId(),
        createdAt: existing?.createdAt ?? clock.nowIso(),
        closedAt: null,
        customerName: customerName.trim().replace(/\s+/g, ' '),
        customerPhone: phone.value,
        deliveryDate,
        deliveryTime,
        notes: isBlank(notes) ? null : notes.trim(),
        advanceAmount,
        status: OrderStatus.PENDING,
        items: merged,
        customItems,
        cancellationNote: null,
        saleId: null,
      };
      try {
        await repositories.orders.put(order);
      } catch {
        return failure({ form: MSG.SAVE_FAILED });
      }
      store.setState((state) => upsertEntity(state, 'orders', order));
      return success(order);
    },

    /** Elimina un pedido PENDING y libera lo apartado (REQ-F-16). */
    async remove(id) {
      const order = find(id);
      if (!order || order.status !== OrderStatus.PENDING) return failure({ form: MSG.SAVE_FAILED });
      try {
        await repositories.orders.delete(id);
      } catch {
        return failure({ form: MSG.SAVE_FAILED });
      }
      store.setState((state) => removeEntity(state, 'orders', id));
      return success();
    },
  };
}
