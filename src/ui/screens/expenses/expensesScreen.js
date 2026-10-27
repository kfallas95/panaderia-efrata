// Pantalla Gastos (wireframe §9). REQ-F-09 a REQ-F-11 · D-047, D-090.
// Filtro con chips y gastos agrupados por día (más reciente primero) con su total.

import { h } from '../../dom.js';
import { Chips } from '../../components/chips.js';
import { EmptyState } from '../../components/emptyState.js';
import { MoneyText } from '../../components/moneyText.js';
import { formatDateLabel } from '../../../domain/dates.js';
import { formatSupplyQuantity } from '../../../domain/quantity.js';
import { ExpenseCategory, EXPENSE_CATEGORY_LABELS, SUPPLY_UNIT_LABELS } from '../../../domain/types.js';

const FILTERS = [
  { key: '', label: 'Todos' },
  { key: ExpenseCategory.SUPPLIES, label: EXPENSE_CATEGORY_LABELS.SUPPLIES },
  { key: ExpenseCategory.SERVICES, label: EXPENSE_CATEGORY_LABELS.SERVICES },
];

function ExpenseRow(expense, suppliesById) {
  const supply = suppliesById.get(expense.supplyId);
  const detail = expense.category === ExpenseCategory.SUPPLIES && supply
    ? `${formatSupplyQuantity(expense.quantity)} ${SUPPLY_UNIT_LABELS[supply.unit]} de ${supply.name} · ${expense.time}`
    : expense.time;
  return h('a', { class: 'expense-row', href: `#/expenses/${expense.id}/edit` },
    h('div', {},
      h('p', { text: `${EXPENSE_CATEGORY_LABELS[expense.category]} · ${expense.description}` }),
      h('p', { class: 'text-muted', text: detail }),
    ),
    MoneyText(expense.amount),
  );
}

export function renderExpensesScreen(container, { category = '' }, ctx) {
  const { data } = ctx.store.getState();
  container.append(
    h('h1', { text: 'Gastos' }),
    Chips(FILTERS.map((f) => ({
      label: f.label,
      href: f.key ? `#/expenses?category=${f.key}` : '#/expenses',
      active: f.key === category,
    })), 'Filtrar gastos'),
  );

  if (data.expenses.length === 0) {
    container.append(EmptyState({
      illustration: 'bread',
      text: 'Aún no tienes gastos',
      action: h('a', { class: 'btn btn-primary', href: '#/expenses/new', text: 'Nuevo gasto' }),
    }));
    return;
  }

  const visible = data.expenses
    .filter((e) => !category || e.category === category)
    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
  if (visible.length === 0) {
    container.append(h('p', { class: 'text-muted', text: 'No hay gastos en esta categoría' }));
    return;
  }

  const suppliesById = new Map(data.supplies.map((s) => [s.id, s]));
  const today = ctx.clock.today();
  const days = new Map();
  for (const expense of visible) {
    if (!days.has(expense.date)) days.set(expense.date, []);
    days.get(expense.date).push(expense);
  }
  for (const [date, expenses] of days) {
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    container.append(
      h('div', { class: 'day-header' },
        h('h2', { text: date === today ? `Hoy · ${formatDateLabel(date)}` : formatDateLabel(date) }),
        MoneyText(total),
      ),
      h('div', { class: 'card day-card' }, expenses.map((e) => ExpenseRow(e, suppliesById))),
    );
  }
}
