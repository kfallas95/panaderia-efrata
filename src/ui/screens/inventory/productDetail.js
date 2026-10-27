// Detalle del producto (wireframe §6). REQ-F-02, REQ-F-04, REQ-F-05, REQ-F-06, REQ-F-25 · D-097, D-098, D-099.

import { h } from '../../dom.js';
import { MoneyText } from '../../components/moneyText.js';
import { StockLine } from '../../components/stockLine.js';
import { ScreenTitle, FormMessage } from '../../components/formParts.js';
import { confirmDialog } from '../../components/confirmDialog.js';
import { selectProductStockById } from '../../../state/selectors.js';
import { formatDateLabel, formatDayMonth } from '../../../domain/dates.js';
import { STOCK_OUT_REASON_LABELS } from '../../../domain/types.js';

/** Movimientos del producto, del más reciente al más antiguo. */
function history(productId, data) {
  const productions = data.productions
    .filter((p) => p.productId === productId)
    .map((p) => ({ kind: 'production', date: p.date, record: p, text: `Producción +${p.quantity}` }));
  const stockOuts = data.stockOuts
    .filter((s) => s.productId === productId)
    .map((s) => ({ kind: 'stockOut', date: s.date, record: s, text: `Salida −${s.quantity} · ${STOCK_OUT_REASON_LABELS[s.reason]}` }));
  const sales = data.sales.flatMap((sale) => sale.items
    .filter((i) => i.productId === productId)
    .map((i) => ({ kind: 'sale', date: sale.date, record: sale, text: `Venta −${i.quantity}` })));
  return [...productions, ...stockOuts, ...sales].sort((a, b) => b.date.localeCompare(a.date));
}

export function renderProductDetail(container, { id }, ctx) {
  const state = ctx.store.getState();
  const row = selectProductStockById(state, id);
  if (!row) {
    ctx.navigate('#/inventory/products');
    return;
  }
  const { product } = row;
  const message = FormMessage();

  const run = async (action) => {
    const result = await action();
    if (result.ok) ctx.refresh();
    else message.set(result.errors.form ?? Object.values(result.errors)[0]);
    return result;
  };

  const removeButton = h('button', { type: 'button', class: 'btn btn-danger-outline', text: 'Eliminar' });
  removeButton.addEventListener('click', async () => {
    const plan = ctx.services.products.removalPlan(id);
    if (plan.blocked) {
      message.set(plan.blocked);
      return;
    }
    if (!(await confirmDialog({ message: plan.message, confirmLabel: plan.mode === 'deactivate' ? 'Desactivar' : 'Eliminar', danger: true }))) return;
    const result = await ctx.services.products.remove(id);
    if (result.ok) ctx.navigate('#/inventory/products');
    else message.set(result.errors.form);
  });

  const reactivateButton = h('button', { type: 'button', class: 'btn', text: 'Reactivar' });
  reactivateButton.addEventListener('click', () => run(() => ctx.services.products.reactivate(id)));

  const actions = product.isActive
    ? h('div', { class: 'actions' },
      h('a', { class: 'btn', href: `#/inventory/products/${id}/edit`, text: 'Editar' }),
      h('a', { class: 'btn', href: '#/inventory/production', text: 'Producción' }),
      h('a', { class: 'btn', href: `#/inventory/stock-out?product=${encodeURIComponent(id)}`, text: 'Salida' }),
      removeButton)
    : h('div', { class: 'actions' }, h('span', { class: 'badge', text: 'Desactivado' }), reactivateButton);

  const items = history(id, state.data).map((entry) => {
    const buttons = [];
    if (entry.kind === 'production') {
      buttons.push(h('a', { class: 'btn btn-small', href: `#/inventory/production/${entry.record.id}/edit`, text: 'Editar' }));
      const del = h('button', { type: 'button', class: 'btn btn-small', text: 'Eliminar' });
      del.addEventListener('click', async () => {
        const text = `¿Eliminar la producción de ${entry.record.quantity} ${product.name} del ${formatDayMonth(entry.date)}?`;
        if (await confirmDialog({ message: text, confirmLabel: 'Eliminar', danger: true })) {
          run(() => ctx.services.production.remove(entry.record.id));
        }
      });
      buttons.push(del);
    }
    if (entry.kind === 'stockOut') {
      const del = h('button', { type: 'button', class: 'btn btn-small', text: 'Eliminar' });
      del.addEventListener('click', async () => {
        const text = `¿Eliminar la salida de ${entry.record.quantity} ${product.name} del ${formatDayMonth(entry.date)}?`;
        if (await confirmDialog({ message: text, confirmLabel: 'Eliminar', danger: true })) {
          run(() => ctx.services.stockOuts.remove(entry.record.id));
        }
      });
      buttons.push(del);
    }
    return h('li', { class: 'history-item' },
      h('div', {}, h('p', { text: entry.text }), h('p', { class: 'text-muted', text: formatDateLabel(entry.date) })),
      h('div', { class: 'history-actions' }, buttons),
    );
  });

  container.append(
    ScreenTitle(product.name, '#/inventory/products'),
    h('div', { class: 'card' },
      h('div', { class: 'card-row' }, h('span', { class: 'text-muted', text: 'Precio' }), MoneyText(product.price)),
      StockLine(row),
    ),
    actions,
    message.element,
    h('h2', { text: 'Historial' }),
    items.length ? h('ul', { class: 'history' }, items) : h('p', { class: 'text-muted', text: 'Sin movimientos' }),
  );
}
