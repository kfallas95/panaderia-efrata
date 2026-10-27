// Pantalla Ventas (wireframe §4). REQ-F-12 a REQ-F-14 · D-047, D-090.
// Ventas agrupadas por día (más reciente primero) con el total del día.

import { h } from '../../dom.js';
import { EmptyState } from '../../components/emptyState.js';
import { MoneyText } from '../../components/moneyText.js';
import { formatDateLabel } from '../../../domain/dates.js';
import { selectSaleTotal } from '../../../state/selectors.js';

function describeLines(sale, productsById) {
  const lines = sale.items.map((i) => `${i.quantity} × ${productsById.get(i.productId)?.name ?? ''}`);
  const custom = (sale.customItems ?? []).map((c) => `${c.quantity} × ${c.description}`);
  return [...lines, ...custom].join(' · ');
}

function SaleRow(sale, data, productsById) {
  const order = sale.orderId ? data.orders.find((o) => o.id === sale.orderId) : null;
  return h('a', { class: 'expense-row', href: `#/sales/${sale.id}/edit` },
    h('div', {},
      order ? h('p', { class: 'tag', text: `Pedido de ${order.customerName}` }) : null,
      h('p', { text: describeLines(sale, productsById) }),
    ),
    MoneyText(selectSaleTotal(sale)),
  );
}

export function renderSalesScreen(container, _params, ctx) {
  const { data } = ctx.store.getState();
  container.append(h('h1', { text: 'Ventas' }));

  if (data.sales.length === 0) {
    container.append(EmptyState({
      illustration: 'croissant',
      text: 'Aún no tienes ventas',
      action: h('a', { class: 'btn btn-primary', href: '#/sales/new', text: 'Nueva venta' }),
    }));
    return;
  }

  const productsById = new Map(data.products.map((p) => [p.id, p]));
  const today = ctx.clock.today();
  const days = new Map();
  for (const sale of [...data.sales].sort((a, b) => b.date.localeCompare(a.date))) {
    if (!days.has(sale.date)) days.set(sale.date, []);
    days.get(sale.date).push(sale);
  }
  for (const [date, sales] of days) {
    const total = sales.reduce((sum, s) => sum + selectSaleTotal(s), 0);
    container.append(
      h('div', { class: 'day-header' },
        h('h2', { text: date === today ? `Hoy · ${formatDateLabel(date)}` : formatDateLabel(date) }),
        MoneyText(total),
      ),
      h('div', { class: 'card day-card' }, sales.map((s) => SaleRow(s, data, productsById))),
    );
  }
}
