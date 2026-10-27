// Pantalla Pedidos (wireframe §1, T-8.2). REQ-F-15, REQ-F-16, REQ-F-26 · D-046, D-047, D-071, D-111.
// Pendientes: entrega más próxima primero. Entregados y Cancelados: más reciente primero (closedAt).

import { h } from '../../dom.js';
import { Tabs } from '../../components/tabs.js';
import { EmptyState } from '../../components/emptyState.js';
import { OrderStatus } from '../../../domain/types.js';
import { toClockMinutes } from '../../../domain/dates.js';
import { selectOrderSummary, selectProductsById } from '../../../state/selectors.js';
import { customerLine, deliveryLine, OverdueTag, ShortfallList, AmountRows } from './orderParts.js';

const TABS = Object.freeze({
  pending: { status: OrderStatus.PENDING, label: 'Pendientes', href: '#/orders', empty: 'Aún no tienes pedidos pendientes' },
  delivered: { status: OrderStatus.DELIVERED, label: 'Entregados', href: '#/orders?tab=delivered', empty: 'Aún no tienes pedidos entregados' },
  cancelled: { status: OrderStatus.CANCELLED, label: 'Cancelados', href: '#/orders?tab=cancelled', empty: 'Aún no tienes pedidos cancelados' },
});

/** "10 × Pan casero · 1 × Queque de chocolate personalizado". */
function describeLines(order, productsById) {
  return [
    ...order.items.map((i) => `${i.quantity} × ${productsById.get(i.productId)?.name ?? ''}`),
    ...order.customItems.map((c) => `${c.quantity} × ${c.description}`),
  ].join(' · ');
}

function OrderCard(order, summary, productsById) {
  return h('a', { class: summary.overdue ? 'card card-link card-overdue' : 'card card-link', href: `#/orders/${order.id}` },
    summary.overdue ? OverdueTag() : null,
    h('h3', { class: 'order-customer', text: customerLine(order) }),
    h('p', { class: 'text-muted', text: deliveryLine(order) }),
    h('p', { class: 'order-lines', text: describeLines(order, productsById) }),
    AmountRows(order, summary),
    ShortfallList(summary.shortfalls, productsById),
  );
}

function sortOrders(orders, status) {
  if (status === OrderStatus.PENDING) {
    return orders.slice().sort((a, b) =>
      toClockMinutes(a.deliveryDate, a.deliveryTime) - toClockMinutes(b.deliveryDate, b.deliveryTime)
      || a.createdAt.localeCompare(b.createdAt));
  }
  return orders.slice().sort((a, b) => (b.closedAt ?? '').localeCompare(a.closedAt ?? ''));
}

/** @param {{ tab: string }} params tab = pending | delivered | cancelled */
export function renderOrdersScreen(container, { tab }, ctx) {
  const key = TABS[tab] ? tab : 'pending';
  const current = TABS[key];
  const state = ctx.store.getState();
  const now = ctx.clock.nowParts();
  const productsById = selectProductsById(state);

  container.append(
    h('h1', { text: 'Pedidos' }),
    Tabs(Object.entries(TABS).map(([k, t]) => ({ label: t.label, href: t.href, active: k === key })), 'Pedidos'),
  );

  const orders = sortOrders(state.data.orders.filter((o) => o.status === current.status), current.status);
  if (orders.length === 0) {
    container.append(EmptyState({
      illustration: 'croissant',
      text: current.empty,
      action: key === 'pending' ? h('a', { class: 'btn btn-primary', href: '#/orders/new', text: 'Nuevo pedido' }) : null,
    }));
    return;
  }
  container.append(h('div', { class: 'card-list order-list' },
    orders.map((order) => OrderCard(order, selectOrderSummary(state, order, now), productsById))));
}
