// Existencias calculadas, nunca guardadas (T-1.5, D-036).
// design.md §6 · INV-01, INV-14, D-037, D-051, D-075, D-077.
//
// `data` es una copia de solo lectura de las colecciones:
// { productions, stockOuts, sales, orders, stockCounts, expenses }.

import { OrderStatus, ExpenseCategory } from './types.js';
import { isoToClockMinutes, toClockMinutes } from './dates.js';

const sumBy = (list, pick) => list.reduce((total, item) => total + pick(item), 0);

/** Existencia de un producto = Σ producción − Σ vendido − Σ salidas. */
export function stockOnHand(productId, data) {
  const produced = sumBy(data.productions.filter((p) => p.productId === productId), (p) => p.quantity);
  const sold = sumBy(data.sales, (sale) =>
    sumBy(sale.items.filter((item) => item.productId === productId), (item) => item.quantity),
  );
  const out = sumBy(data.stockOuts.filter((s) => s.productId === productId), (s) => s.quantity);
  return produced - sold - out;
}

/** Apartado = Σ cantidades del producto en pedidos PENDING (INV-14). */
export function reservedQuantity(productId, orders) {
  return sumBy(orders.filter((o) => o.status === OrderStatus.PENDING), (order) =>
    sumBy(order.items.filter((item) => item.productId === productId), (item) => item.quantity),
  );
}

/** Disponible para vender = máx(0, existencia − apartado); nunca negativo (D-051). */
export function availableToSell(productId, data) {
  return Math.max(0, stockOnHand(productId, data) - reservedQuantity(productId, data.orders));
}

/** Faltante del producto en Inventario = máx(0, apartado − existencia) (D-077). */
export function productShortfall(productId, data) {
  return Math.max(0, reservedQuantity(productId, data.orders) - stockOnHand(productId, data));
}

/** Momento de una compra de insumo en minutos de reloj (fecha + hora del gasto). */
const purchaseMinutes = (expense) => toClockMinutes(expense.date, expense.time);

/** Último conteo físico de un insumo, o null si no tiene. */
export function lastStockCount(supplyId, stockCounts) {
  return stockCounts
    .filter((c) => c.supplyId === supplyId)
    .reduce((latest, c) => (latest === null || isoToClockMinutes(c.countedAt) > isoToClockMinutes(latest.countedAt) ? c : latest), null);
}

/**
 * Cantidad de un insumo, en milésimas (D-037, D-075).
 * Sin conteos: Σ compras. Con conteos: último conteo + Σ compras cuyo minuto es
 * estrictamente posterior al minuto del conteo.
 */
export function supplyQuantity(supplyId, data) {
  const purchases = data.expenses.filter(
    (e) => e.category === ExpenseCategory.SUPPLIES && e.supplyId === supplyId,
  );
  const count = lastStockCount(supplyId, data.stockCounts);
  if (count === null) return sumBy(purchases, (e) => e.quantity);

  const countMinutes = isoToClockMinutes(count.countedAt);
  return count.newQuantity + sumBy(
    purchases.filter((e) => purchaseMinutes(e) > countMinutes),
    (e) => e.quantity,
  );
}
