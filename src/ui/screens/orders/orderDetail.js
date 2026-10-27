// Detalle del pedido (wireframe §2, T-8.3). REQ-F-15, REQ-F-16, REQ-F-26 · D-071, D-111.
// En la Fase 8 solo tiene Editar y Eliminar; Entregar y Cancelar llegan en la Fase 9.

import { h } from '../../dom.js';
import { MoneyText } from '../../components/moneyText.js';
import { ScreenTitle, FormMessage } from '../../components/formParts.js';
import { confirmDialog } from '../../components/confirmDialog.js';
import { OrderStatus, ORDER_STATUS_LABELS } from '../../../domain/types.js';
import { selectOrderSummary, selectProductsById } from '../../../state/selectors.js';
import { customerLine, deliveryLine, OverdueTag, ShortfallList, AmountRows } from './orderParts.js';

function LineRow(quantity, name, unitPrice) {
  return h('li', { class: 'order-line' },
    h('span', { class: 'order-line-name', text: `${quantity} × ${name}` }),
    MoneyText(unitPrice, 'text-muted'),
    MoneyText(quantity * unitPrice),
  );
}

export function renderOrderDetail(container, { id }, ctx) {
  const state = ctx.store.getState();
  const order = state.data.orders.find((o) => o.id === id);
  if (!order) {
    ctx.navigate('#/orders');
    return;
  }
  const productsById = selectProductsById(state);
  const summary = selectOrderSummary(state, order, ctx.clock.nowParts());
  const isPending = order.status === OrderStatus.PENDING;
  const message = FormMessage();

  const lines = h('ul', { class: 'order-line-list' },
    order.items.map((i) => LineRow(i.quantity, productsById.get(i.productId)?.name ?? '', i.unitPrice)),
    order.customItems.map((c) => LineRow(c.quantity, c.description, c.unitPrice)),
  );

  const card = h('div', { class: summary.overdue ? 'card card-overdue' : 'card' },
    summary.overdue ? OverdueTag() : null,
    h('h3', { class: 'order-customer', text: customerLine(order) }),
    h('p', { class: 'text-muted', text: deliveryLine(order) }),
    h('p', { text: `Estado: ${ORDER_STATUS_LABELS[order.status]}` }),
    lines,
    AmountRows(order, summary),
    order.notes ? h('p', { class: 'order-notes', text: `Notas: ${order.notes}` }) : null,
    ShortfallList(summary.shortfalls, productsById),
  );

  container.append(ScreenTitle('Pedido', '#/orders'), card, message.element);
  if (!isPending) return; // Entregados y Cancelados son de solo lectura (D-071).

  const removeButton = h('button', { type: 'button', class: 'btn btn-danger-outline', text: 'Eliminar' });
  removeButton.addEventListener('click', async () => {
    const text = `¿Eliminar el pedido de ${order.customerName}?`;
    if (!(await confirmDialog({ message: text, confirmLabel: 'Eliminar', danger: true }))) return;
    const result = await ctx.services.orders.remove(id);
    if (result.ok) ctx.navigate('#/orders');
    else message.set(result.errors.form);
  });

  container.append(h('div', { class: 'actions' },
    h('a', { class: 'btn', href: `#/orders/${id}/edit`, text: 'Editar' }),
    removeButton,
  ));
}
