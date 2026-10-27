// Piezas compartidas por la lista y el detalle de pedidos (T-8.2, T-8.3).
// REQ-F-15 (faltantes en dorado), REQ-F-26 ("Atrasado" en rojo), REQ-F-27 · D-049, D-077.

import { h } from '../../dom.js';
import { MoneyText } from '../../components/moneyText.js';
import { missingInOrder } from '../../../domain/messages.js';
import { formatWeekdayDayMonth } from '../../../domain/dates.js';
import { formatPhone } from '../../../domain/validators.js';

/** "María Rojas · 8888-0000". */
export const customerLine = (order) => `${order.customerName} · ${formatPhone(order.customerPhone)}`;

/** "Entrega: sáb 7 nov · 15:00". */
export const deliveryLine = (order) =>
  `Entrega: ${formatWeekdayDayMonth(order.deliveryDate)} · ${order.deliveryTime}`;

/** Etiqueta roja "Atrasado" (REQ-F-26). */
export function OverdueTag() {
  return h('p', { class: 'overdue-tag', text: '⚠ Atrasado' });
}

/** "Faltan X {producto} por producir" en dorado, una por producto (REQ-F-15). */
export function ShortfallList(shortfalls, productsById) {
  return shortfalls.map((s) => h('p', {
    class: 'shortfall',
    text: missingInOrder(s.missing, productsById.get(s.productId)?.name ?? ''),
  }));
}

/** Filas Total · Adelanto (si hay) · Saldo. */
export function AmountRows(order, summary) {
  const row = (label, cents) => h('div', { class: 'amount-row' }, h('span', { text: label }), MoneyText(cents));
  return h('div', { class: 'amount-rows' },
    row('Total', summary.total),
    order.advanceAmount ? row('Adelanto', order.advanceAmount) : null,
    row('Saldo', summary.balance),
  );
}
