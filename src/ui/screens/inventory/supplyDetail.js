// Detalle del insumo (wireframe §7). REQ-F-02, REQ-F-08, REQ-F-25 · D-024, D-103.

import { h } from '../../dom.js';
import { MoneyText } from '../../components/moneyText.js';
import { ScreenTitle, FormMessage } from '../../components/formParts.js';
import { confirmDialog } from '../../components/confirmDialog.js';
import { selectSupplyStock } from '../../../state/selectors.js';
import { formatSupplyQuantity } from '../../../domain/quantity.js';
import { formatDateLabel } from '../../../domain/dates.js';
import { SUPPLY_UNIT_LABELS, ExpenseCategory } from '../../../domain/types.js';
import { formatCountMoment } from './inventoryScreen.js';

export function renderSupplyDetail(container, { id }, ctx) {
  const state = ctx.store.getState();
  const row = selectSupplyStock(state).find((r) => r.supply.id === id);
  if (!row) {
    ctx.navigate('#/inventory/supplies');
    return;
  }
  const { supply } = row;
  const unit = SUPPLY_UNIT_LABELS[supply.unit];
  const qty = (value) => `${formatSupplyQuantity(value)} ${unit}`;
  const message = FormMessage();

  const removeButton = h('button', { type: 'button', class: 'btn btn-danger-outline', text: 'Eliminar' });
  removeButton.addEventListener('click', async () => {
    const plan = ctx.services.supplies.removalPlan(id);
    if (!(await confirmDialog({ message: plan.message, confirmLabel: plan.mode === 'deactivate' ? 'Desactivar' : 'Eliminar', danger: true }))) return;
    const result = await ctx.services.supplies.remove(id);
    if (result.ok) ctx.navigate('#/inventory/supplies');
    else message.set(result.errors.form);
  });
  const reactivateButton = h('button', { type: 'button', class: 'btn', text: 'Reactivar' });
  reactivateButton.addEventListener('click', async () => {
    const result = await ctx.services.supplies.reactivate(id);
    if (result.ok) ctx.refresh();
  });

  const actions = supply.isActive
    ? h('div', { class: 'actions' },
      h('a', { class: 'btn', href: `#/inventory/count?supply=${encodeURIComponent(id)}`, text: 'Conteo físico' }),
      h('a', { class: 'btn', href: `#/inventory/supplies/${id}/edit`, text: 'Editar' }),
      removeButton)
    : h('div', { class: 'actions' }, h('span', { class: 'badge', text: 'Desactivado' }), reactivateButton);

  const counts = state.data.stockCounts
    .filter((c) => c.supplyId === id)
    .map((c) => ({
      key: c.countedAt,
      title: `Conteo: ${qty(c.previousQuantity)} → ${qty(c.newQuantity)}`,
      when: `${formatDateLabel(c.countedAt.slice(0, 10))} · ${c.countedAt.slice(11, 16)}`,
      amount: null,
    }));
  const purchases = state.data.expenses
    .filter((e) => e.category === ExpenseCategory.SUPPLIES && e.supplyId === id)
    .map((e) => ({
      key: `${e.date}T${e.time}`,
      title: `Compra +${qty(e.quantity)} · ${e.description}`,
      when: `${formatDateLabel(e.date)} · ${e.time}`,
      amount: e.amount,
    }));
  const items = [...counts, ...purchases]
    .sort((a, b) => b.key.slice(0, 16).localeCompare(a.key.slice(0, 16)))
    .map((entry) => h('li', { class: 'history-item' },
      h('div', {}, h('p', { text: entry.title }), h('p', { class: 'text-muted', text: entry.when })),
      entry.amount === null ? null : MoneyText(entry.amount),
    ));

  container.append(
    ScreenTitle(supply.name, '#/inventory/supplies'),
    h('div', { class: 'card' },
      h('div', { class: 'card-row' }, h('span', { class: 'text-muted', text: 'Cantidad' }), h('span', { class: 'stock-available', text: qty(row.quantity) })),
      h('p', { class: 'text-muted', text: row.lastCount ? `Último conteo: ${formatCountMoment(row.lastCount.countedAt)}` : 'Sin conteos' }),
    ),
    actions,
    message.element,
    h('h2', { text: 'Historial' }),
    items.length ? h('ul', { class: 'history' }, items) : h('p', { class: 'text-muted', text: 'Sin movimientos' }),
  );
}
