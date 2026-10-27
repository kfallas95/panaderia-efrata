// Asignación de existencias a pedidos pendientes (T-1.6).
// D-050, D-053, D-063, D-065 · REQ-F-15, REQ-F-17, REQ-F-26 · design.md §6.
//
// Prioridad:
//   1. Pedidos en plazo (ahora < entrega + 2 h), del más próximo al más lejano.
//   2. Pedidos que superaron ese margen, con el mismo orden.
//   En empate de entrega gana el registrado antes (createdAt).
// Las comparaciones se hacen al minuto: a las 17:00 un pedido de las 15:00 ya
// perdió la prioridad, y a las 15:00 ya está "Atrasado".

import { OrderStatus } from './types.js';
import { toClockMinutes, nowToClockMinutes, isoToClockMinutes } from './dates.js';

export const GRACE_MINUTES = 120;

const deliveryMinutes = (order) => toClockMinutes(order.deliveryDate, order.deliveryTime);

/** true si la entrega de un pedido pendiente ya llegó o pasó: etiqueta "Atrasado" (REQ-F-26). */
export function isOverdue(order, now) {
  return order.status === OrderStatus.PENDING && nowToClockMinutes(now) >= deliveryMinutes(order);
}

/** true si el pedido todavía conserva la prioridad: ahora < entrega + 2 h (D-063, D-065). */
export function isWithinGrace(order, now) {
  return nowToClockMinutes(now) < deliveryMinutes(order) + GRACE_MINUTES;
}

/** Ordena pedidos según la prioridad de asignación. No modifica la lista recibida. */
export function sortByPriority(orders, now) {
  return [...orders].sort((a, b) => {
    const graceA = isWithinGrace(a, now) ? 0 : 1;
    const graceB = isWithinGrace(b, now) ? 0 : 1;
    if (graceA !== graceB) return graceA - graceB;
    const byDelivery = deliveryMinutes(a) - deliveryMinutes(b);
    if (byDelivery !== 0) return byDelivery;
    return isoToClockMinutes(a.createdAt) - isoToClockMinutes(b.createdAt)
      || a.createdAt.localeCompare(b.createdAt);
  });
}

/**
 * Reparte la existencia de cada producto entre los pedidos pendientes.
 * @param {Array} orders todos los pedidos (solo se usan los PENDING)
 * @param {(productId: string) => number} stockOf existencia de un producto
 * @param {{date: string, time: string}} now
 * @returns {Map<string, Map<string, {required: number, covered: number, missing: number}>>}
 *          pedido → producto → cantidades
 */
export function allocateStock(orders, stockOf, now) {
  const pending = sortByPriority(orders.filter((o) => o.status === OrderStatus.PENDING), now);
  const result = new Map(pending.map((o) => [o.id, new Map()]));
  const remaining = new Map();

  for (const order of pending) {
    for (const item of order.items) {
      if (!remaining.has(item.productId)) {
        remaining.set(item.productId, Math.max(0, stockOf(item.productId)));
      }
      const left = remaining.get(item.productId);
      const covered = Math.min(left, item.quantity);
      remaining.set(item.productId, left - covered);
      result.get(order.id).set(item.productId, {
        required: item.quantity,
        covered,
        missing: item.quantity - covered,
      });
    }
  }
  return result;
}

/** Faltantes de un pedido: [{ productId, missing }] solo de los productos con faltante. */
export function orderShortfalls(orderId, allocation) {
  const lines = allocation.get(orderId);
  if (!lines) return [];
  return [...lines.entries()]
    .filter(([, line]) => line.missing > 0)
    .map(([productId, line]) => ({ productId, missing: line.missing }));
}
