// Reglas de validación puras (T-1.8).
// REQ-F-02 a REQ-F-05, REQ-F-12, REQ-F-13, REQ-F-20 a REQ-F-24, REQ-F-27 ·
// INV-01 a INV-06 · D-034, D-069, D-073, D-074, D-076.
//
// Cada función devuelve null si el dato es válido, o el texto del error.
// El dominio no lee el reloj: "hoy" y "ahora" llegan como parámetro.

import {
  MSG,
  notAvailable,
  notInStock,
  productInPendingOrders,
  supplyShort,
} from './messages.js';
import { formatSupplyQuantity } from './quantity.js';
import { OrderStatus, ExpenseCategory } from './types.js';
import { toClockMinutes, nowToClockMinutes, isFutureDate } from './dates.js';

// ---------- Campos obligatorios y números (REQ-F-20, REQ-F-21) ----------

/** true si el valor está vacío o solo tiene espacios. */
export function isBlank(value) {
  return value === null || value === undefined || String(value).trim() === '';
}

/** "Este campo es obligatorio" si está vacío o solo tiene espacios. */
export function validateRequired(value) {
  return isBlank(value) ? MSG.REQUIRED : null;
}

/** Precios, montos y cantidades: deben ser > 0. */
export function validatePositive(value) {
  return value > 0 ? null : MSG.POSITIVE;
}

/** Conteo físico: admite 0, no negativos (REQ-F-08, REQ-F-21). */
export function validateCountQuantity(value) {
  return value >= 0 ? null : MSG.NOT_NEGATIVE;
}

// ---------- Duplicados (REQ-F-22, D-034) ----------

/** Nombre normalizado: sin mayúsculas ni espacios extra. "  Pan  Casero " → "pan casero". */
export function normalizeName(name) {
  return String(name ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('es');
}

/**
 * Error si otro elemento de la lista ya tiene el mismo nombre.
 * @param {'product' | 'supply'} kind
 * @param {string|null} excludeId id del elemento que se está editando
 */
export function validateUniqueName(name, list, kind, excludeId = null) {
  const key = normalizeName(name);
  const taken = list.some((item) => item.id !== excludeId && normalizeName(item.name) === key);
  if (!taken) return null;
  return kind === 'product' ? MSG.DUPLICATE_PRODUCT : MSG.DUPLICATE_SUPPLY;
}

/**
 * Une líneas del mismo producto sumando la cantidad (INV-06, D-069).
 * La línea que ya existía conserva su precio.
 */
export function mergeLines(items) {
  const merged = new Map();
  for (const item of items) {
    const existing = merged.get(item.productId);
    if (existing) existing.quantity += item.quantity;
    else merged.set(item.productId, { ...item });
  }
  return [...merged.values()];
}

// ---------- Fechas (REQ-F-23, D-073) ----------

/** Ventas, gastos, producción y salidas: la fecha no puede ser futura. */
export function validateNotFutureDate(date, today) {
  return isFutureDate(date, today) ? MSG.FUTURE_DATE : null;
}

/**
 * Entrega del pedido: no puede estar en el pasado. Se valida solo al crear el
 * pedido o al cambiar su fecha u hora de entrega (D-073).
 */
export function validateDeliveryNotPast(deliveryDate, deliveryTime, now) {
  return toClockMinutes(deliveryDate, deliveryTime) < nowToClockMinutes(now) ? MSG.PAST_DELIVERY : null;
}

// ---------- Pedido (REQ-F-24, REQ-F-27) ----------

/**
 * Teléfono de 8 dígitos, con o sin guion (8888-0000 o 88880000).
 * @returns {{ok: true, value: string} | {ok: false, error: string}} value sin guion
 */
export function parsePhone(text) {
  const raw = String(text ?? '').trim();
  if (raw === '') return { ok: false, error: MSG.REQUIRED };
  if (!/^\d{4}-?\d{4}$/.test(raw)) return { ok: false, error: MSG.PHONE };
  return { ok: true, value: raw.replace('-', '') };
}

/** Muestra un teléfono guardado: "88880000" → "8888-0000". */
export function formatPhone(digits) {
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
}

/** El adelanto (opcional) no puede superar el total del pedido. */
export function validateAdvance(advanceAmount, total) {
  if (advanceAmount === null || advanceAmount === undefined) return null;
  return advanceAmount > total ? MSG.ADVANCE_OVER_TOTAL : null;
}

// ---------- Inventario (INV-01, REQ-F-04, REQ-F-05, REQ-F-12, REQ-F-13) ----------

/**
 * Venta nueva o editada: el aumento neto de cada producto no puede superar lo
 * disponible para vender. Devuelve [{ productId, message }] (vacío si todo alcanza).
 * @param {Array} newItems líneas nuevas (ya unidas con mergeLines)
 * @param {Array} previousItems líneas anteriores al editar; [] al crear
 * @param {(productId: string) => number} availableOf disponible para vender actual
 * @param {(productId: string) => string} nameOf nombre del producto
 */
export function checkSaleStock(newItems, previousItems, availableOf, nameOf) {
  const previous = new Map(mergeLines(previousItems).map((i) => [i.productId, i.quantity]));
  const errors = [];
  for (const item of mergeLines(newItems)) {
    const increase = item.quantity - (previous.get(item.productId) ?? 0);
    const available = availableOf(item.productId);
    if (increase > available) {
      errors.push({ productId: item.productId, message: notAvailable(available, nameOf(item.productId)) });
    }
  }
  return errors;
}

/** Salida de inventario: no puede superar lo disponible para vender (REQ-F-05). */
export function checkStockOut(quantity, available, productName) {
  return quantity > available ? notAvailable(available, productName) : null;
}

/**
 * Editar o eliminar una producción: la existencia resultante no puede quedar
 * negativa (REQ-F-04). Al eliminar, newQuantity = 0.
 */
export function checkProductionChange(currentStock, oldQuantity, newQuantity, productName) {
  return currentStock - oldQuantity + newQuantity < 0 ? notInStock(currentStock, productName) : null;
}

/**
 * Editar o eliminar un gasto de Insumos: la cantidad del insumo no puede quedar
 * negativa. Verificación defensiva: con las reglas actuales no se dispara (REQ-F-11).
 * @param {number} currentQuantity milésimas actuales
 * @param {number} delta cambio en milésimas (negativo si baja)
 */
export function checkSupplyAdjustment(currentQuantity, delta, unitLabel, supplyName) {
  return currentQuantity + delta < 0
    ? supplyShort(formatSupplyQuantity(currentQuantity), unitLabel, supplyName)
    : null;
}

/** Formulario de producción de varios productos: al menos una cantidad (D-076). */
export function validateProductionBatch(quantityTexts) {
  return quantityTexts.every(isBlank) ? MSG.AT_LEAST_ONE_QUANTITY : null;
}

// ---------- Desactivar o eliminar (REQ-F-02, D-023, D-074) ----------

/** true si el producto está en algún pedido pendiente. */
export function isInPendingOrders(productId, orders) {
  return orders.some(
    (o) => o.status === OrderStatus.PENDING && o.items.some((i) => i.productId === productId),
  );
}

/** Error si el producto está en pedidos pendientes (se evalúa antes que el historial). */
export function validateProductRemoval(productId, productName, orders) {
  return isInPendingOrders(productId, orders) ? productInPendingOrders(productName) : null;
}

/** true si el producto tiene historial: producción, salidas, ventas o pedidos. */
export function productHasHistory(productId, data) {
  return data.productions.some((p) => p.productId === productId)
    || data.stockOuts.some((s) => s.productId === productId)
    || data.sales.some((sale) => sale.items.some((i) => i.productId === productId))
    || data.orders.some((o) => o.items.some((i) => i.productId === productId));
}

/** true si el insumo tiene historial: compras o conteos. */
export function supplyHasHistory(supplyId, data) {
  return data.expenses.some((e) => e.category === ExpenseCategory.SUPPLIES && e.supplyId === supplyId)
    || data.stockCounts.some((c) => c.supplyId === supplyId);
}
