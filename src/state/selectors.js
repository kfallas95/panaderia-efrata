// Selectores: valores derivados y memorizados (T-3.2). D-036 · docs/design.md §5.1 y §6.
//
// Solo usan funciones del dominio y nunca guardan nada. Cada selector recuerda su
// último resultado y lo recalcula únicamente cuando cambian las listas de las
// que depende (comparación por referencia, porque el store es inmutable).

import {
  stockOnHand,
  reservedQuantity,
  availableToSell,
  productShortfall,
  supplyQuantity,
  lastStockCount,
} from '../domain/stock.js';
import { allocateStock, orderShortfalls, isOverdue } from '../domain/orderAllocation.js';
import { saleTotal, orderTotal, orderBalance } from '../domain/totals.js';
import { buildReport } from '../domain/report.js';
import { ReportPeriod } from '../domain/types.js';

/**
 * Crea un selector que recalcula solo si cambia alguna dependencia.
 * @param {(...args: any[]) => any[]} getDeps dependencias a comparar
 * @param {(...deps: any[]) => any} compute cálculo a partir de las dependencias
 */
function memoize(getDeps, compute) {
  let lastDeps = null;
  let lastResult;
  return (...args) => {
    const deps = getDeps(...args);
    const same = lastDeps !== null
      && deps.length === lastDeps.length
      && deps.every((dep, i) => Object.is(dep, lastDeps[i]));
    if (!same) {
      lastResult = compute(...deps);
      lastDeps = deps;
    }
    return lastResult;
  };
}

// ---------- Catálogos ----------

/** Producto por id. */
export const selectProductsById = memoize(
  (state) => [state.data.products],
  (products) => new Map(products.map((p) => [p.id, p])),
);

/** Insumo por id. */
export const selectSuppliesById = memoize(
  (state) => [state.data.supplies],
  (supplies) => new Map(supplies.map((s) => [s.id, s])),
);

// ---------- Inventario de productos (REQ-F-06) ----------

/**
 * Existencias de todos los productos:
 * [{ product, stockOnHand, reserved, available, shortfall }].
 */
export const selectProductStock = memoize(
  (state) => [state.data],
  (data) => data.products.map((product) => ({
    product,
    stockOnHand: stockOnHand(product.id, data),
    reserved: reservedQuantity(product.id, data.orders),
    available: availableToSell(product.id, data),
    shortfall: productShortfall(product.id, data),
  })),
);

/** Existencias de un producto, o null si no existe. */
export function selectProductStockById(state, productId) {
  return selectProductStock(state).find((row) => row.product.id === productId) ?? null;
}

// ---------- Inventario de insumos (REQ-F-07, REQ-F-08) ----------

/** Cantidad de cada insumo en milésimas: [{ supply, quantity, lastCount }]. */
export const selectSupplyStock = memoize(
  (state) => [state.data.supplies, state.data.stockCounts, state.data.expenses],
  (supplies, stockCounts, expenses) => supplies.map((supply) => ({
    supply,
    quantity: supplyQuantity(supply.id, { stockCounts, expenses }),
    lastCount: lastStockCount(supply.id, stockCounts),
  })),
);

// ---------- Pedidos (REQ-F-15, REQ-F-17, REQ-F-26) ----------

/**
 * Asignación de existencias a pedidos pendientes según la prioridad (D-050, D-053, D-063).
 * Depende de la hora: `now` = { date, time }.
 */
export const selectAllocation = memoize(
  (state, now) => [state.data, now.date, now.time],
  (data, date, time) => allocateStock(data.orders, (productId) => stockOnHand(productId, data), { date, time }),
);

/** Faltantes de un pedido: [{ productId, missing }]. */
export function selectOrderShortfalls(state, orderId, now) {
  return orderShortfalls(orderId, selectAllocation(state, now));
}

/** Datos calculados de un pedido para su tarjeta y su detalle. */
export function selectOrderSummary(state, order, now) {
  return {
    total: orderTotal(order),
    balance: orderBalance(order),
    overdue: isOverdue(order, now),
    shortfalls: selectOrderShortfalls(state, order.id, now),
  };
}

// ---------- Ventas y reporte (REQ-F-12, REQ-F-19) ----------

/** Total de una venta. */
export function selectSaleTotal(sale) {
  return saleTotal(sale);
}

/** Reporte de un período: { type: 'DAY', date } o { type: 'MONTH', month }. */
export const selectReport = memoize(
  (state, period) => [state.data.sales, state.data.expenses, period.type, period.date ?? period.month],
  (sales, expenses, type, key) => buildReport(
    { sales, expenses },
    type === ReportPeriod.DAY ? { type, date: key } : { type, month: key },
  ),
);
