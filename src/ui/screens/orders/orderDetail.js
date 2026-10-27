// Detalle del pedido (wireframe §2, T-8.3, T-9.1 a T-9.3).
// REQ-F-15 a REQ-F-18, REQ-F-26 · D-066, D-071, D-111, D-114.

import { h } from '../../dom.js';
import { MoneyText } from '../../components/moneyText.js';
import { ScreenTitle, FormMessage } from '../../components/formParts.js';
import { confirmDialog } from '../../components/confirmDialog.js';
import { formatMoney } from '../../../domain/money.js';
import { OrderStatus, ORDER_STATUS_LABELS } from '../../../domain/types.js';
import { selectOrderSummary, selectProductsById } from '../../../state/selectors.js';
import { customerLine, deliveryLine, closedLine, OverdueTag, ShortfallList, AmountRows } from './orderParts.js';

function LineRow(quantity, name, unitPrice) {
  return h('li', { class: 'order-line' },
    h('span', { class: 'order-line-name', text: `${quantity} × ${name}` }),
    MoneyText(unitPrice, 'text-muted'),
    MoneyText(quantity * unitPrice),
  );
}

/**
 * Ventana para cancelar con la nota opcional sobre el adelanto (REQ-F-18, D-114).
 * @returns {Promise<{ note: string } | null>} null si el dueño elige Volver
 */
function cancelDialog(customerName) {
  return new Promise((resolve) => {
    const note = h('textarea', { id: 'nota-cancelacion', rows: 3 });
    const confirm = h('button', { type: 'button', class: 'btn btn-danger', text: 'Cancelar pedido' });
    const back = h('button', { type: 'button', class: 'btn', text: 'Volver' });
    const dialog = h('dialog', { class: 'confirm-dialog' },
      h('p', { text: `¿Cancelar el pedido de ${customerName}?` }),
      h('div', { class: 'field' },
        h('label', { for: 'nota-cancelacion' }, 'Nota sobre el adelanto', h('span', { class: 'text-muted', text: ' (opcional)' })),
        note),
      h('div', { class: 'dialog-actions' }, back, confirm),
    );
    const close = (answer) => {
      dialog.close();
      dialog.remove();
      resolve(answer);
    };
    confirm.addEventListener('click', () => close({ note: note.value }));
    back.addEventListener('click', () => close(null));
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      close(null);
    });
    document.body.append(dialog);
    dialog.showModal();
    back.focus();
  });
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

  const closedText = order.status === OrderStatus.DELIVERED ? closedLine('Entregado', order.closedAt)
    : order.status === OrderStatus.CANCELLED ? closedLine('Cancelado', order.closedAt)
      : null;

  const card = h('div', { class: summary.overdue ? 'card card-overdue' : 'card' },
    summary.overdue ? OverdueTag() : null,
    h('h3', { class: 'order-customer', text: customerLine(order) }),
    h('p', { class: 'text-muted', text: deliveryLine(order) }),
    h('p', { text: `Estado: ${ORDER_STATUS_LABELS[order.status]}` }),
    closedText ? h('p', { class: 'text-muted', text: closedText }) : null,
    lines,
    AmountRows(order, summary),
    order.notes ? h('p', { class: 'order-notes', text: `Notas: ${order.notes}` }) : null,
    order.cancellationNote ? h('p', { class: 'order-notes', text: `Nota de cancelación: ${order.cancellationNote}` }) : null,
    ShortfallList(summary.shortfalls, productsById),
  );

  container.append(ScreenTitle('Pedido', '#/orders'), card);
  if (!isPending) return; // Entregados y Cancelados son de solo lectura (D-071).

  // Entregar: bloqueo por faltantes debajo del botón o confirmación (REQ-F-17, D-066, D-114).
  const deliverButton = h('button', { type: 'button', class: 'btn btn-primary btn-block', text: 'Entregar' });
  deliverButton.addEventListener('click', async () => {
    message.set(null);
    const blockers = ctx.services.orders.deliveryBlockers(id);
    if (blockers.length) {
      message.set(blockers.join('\n'));
      return;
    }
    const text = `¿Marcar como entregado el pedido de ${order.customerName}? Se registrará una venta de ${formatMoney(summary.total)}`;
    if (!(await confirmDialog({ message: text, confirmLabel: 'Entregar' }))) return;
    const result = await ctx.services.orders.deliver(id);
    if (result.ok) ctx.refresh();
    else message.set(result.errors.form);
  });

  const cancelButton = h('button', { type: 'button', class: 'btn', text: 'Cancelar' });
  cancelButton.addEventListener('click', async () => {
    const answer = await cancelDialog(order.customerName);
    if (!answer) return;
    const result = await ctx.services.orders.cancel(id, answer.note);
    if (result.ok) ctx.refresh();
    else message.set(result.errors.form);
  });

  const removeButton = h('button', { type: 'button', class: 'btn btn-danger-outline', text: 'Eliminar' });
  removeButton.addEventListener('click', async () => {
    const text = `¿Eliminar el pedido de ${order.customerName}?`;
    if (!(await confirmDialog({ message: text, confirmLabel: 'Eliminar', danger: true }))) return;
    const result = await ctx.services.orders.remove(id);
    if (result.ok) ctx.navigate('#/orders');
    else message.set(result.errors.form);
  });

  container.append(
    h('div', { class: 'deliver-zone' }, deliverButton, message.element),
    h('div', { class: 'actions' },
      h('a', { class: 'btn', href: `#/orders/${id}/edit`, text: 'Editar' }),
      cancelButton,
      removeButton,
    ),
  );
}
