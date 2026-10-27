// Nuevo / editar gasto (wireframe §9). REQ-F-09 a REQ-F-11, REQ-F-20 a REQ-F-23, REQ-F-28 · D-040, D-041, D-103.

import { h } from '../../dom.js';
import { FieldError } from '../../components/fieldError.js';
import { MoneyInput } from '../../components/moneyInput.js';
import { QuantityInput } from '../../components/quantityInput.js';
import { ScreenTitle, DateInput, FormMessage, SubmitButton } from '../../components/formParts.js';
import { confirmDialog } from '../../components/confirmDialog.js';
import { formatMoney } from '../../../domain/money.js';
import { ExpenseCategory, EXPENSE_CATEGORY_LABELS, SUPPLY_UNIT_LABELS } from '../../../domain/types.js';

/** @param {{ id?: string }} params */
export function renderExpenseForm(container, { id = null }, ctx) {
  const { data } = ctx.store.getState();
  const expense = id ? data.expenses.find((e) => e.id === id) : null;
  if (id && !expense) {
    ctx.navigate('#/expenses');
    return;
  }
  const today = ctx.clock.today();
  const now = ctx.clock.nowParts();
  const supplies = data.supplies
    .filter((s) => s.isActive || s.id === expense?.supplyId)
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));

  const categoryGroup = h('fieldset', { class: 'radio-group' },
    h('legend', { text: 'Categoría' }),
    Object.values(ExpenseCategory).map((category) => h('label', { class: 'radio' },
      h('input', { type: 'radio', name: 'category', value: category, checked: (expense?.category ?? ExpenseCategory.SUPPLIES) === category }),
      ` ${EXPENSE_CATEGORY_LABELS[category]}`,
    )),
  );
  const description = FieldError({ label: 'Descripción', control: h('input', { type: 'text', value: expense?.description ?? '', autocomplete: 'off' }) });
  const select = h('select', {},
    h('option', { value: '', text: 'Elige un insumo' }),
    supplies.map((s) => h('option', { value: s.id, text: s.name, selected: s.id === expense?.supplyId })),
  );
  const supply = FieldError({ label: 'Insumo', control: select });
  const quantityInput = QuantityInput({ kind: 'supply', value: expense?.quantity ?? null });
  const quantity = FieldError({ label: 'Cantidad', control: quantityInput.element });
  const amountInput = MoneyInput({ value: expense?.amount ?? null });
  const amount = FieldError({ label: 'Monto (₡)', control: amountInput.element });
  const date = FieldError({ label: 'Fecha', control: DateInput(expense?.date ?? today, today) });
  const time = FieldError({ label: 'Hora', control: h('input', { type: 'time', value: expense?.time ?? now.time }) });
  const message = FormMessage();

  const suppliesBlock = h('div', {}, supply.element, quantity.element);
  const category = () => categoryGroup.querySelector('input[name="category"]:checked')?.value ?? '';
  const updateCategory = () => {
    suppliesBlock.hidden = category() !== ExpenseCategory.SUPPLIES;
    const chosen = supplies.find((s) => s.id === select.value);
    quantity.element.querySelector('label').textContent = chosen ? `Cantidad (${SUPPLY_UNIT_LABELS[chosen.unit]})` : 'Cantidad';
  };
  categoryGroup.addEventListener('change', updateCategory);
  select.addEventListener('change', updateCategory);
  updateCategory();

  const form = h('form', { class: 'form', novalidate: true },
    categoryGroup, description.element, suppliesBlock, amount.element,
    h('div', { class: 'field-pair' }, date.element, time.element),
    message.element, SubmitButton());
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const result = await ctx.services.expenses.save({
      id,
      category: category(),
      description: description.control.value,
      supplyId: select.value,
      quantityText: quantityInput.element.value,
      amountText: amountInput.element.value,
      date: date.control.value,
      time: time.control.value,
    });
    description.setError(result.errors?.description);
    supply.setError(result.errors?.supplyId);
    quantity.setError(result.errors?.quantity);
    amount.setError(result.errors?.amount);
    date.setError(result.errors?.date);
    time.setError(result.errors?.time);
    message.set(result.errors?.form ?? result.errors?.category);
    if (result.ok) ctx.navigate('#/expenses');
  });

  container.append(ScreenTitle(expense ? 'Editar gasto' : 'Nuevo gasto', '#/expenses'), form);

  if (expense) {
    const remove = h('button', { type: 'button', class: 'btn btn-danger-outline btn-block', text: 'Eliminar gasto' });
    remove.addEventListener('click', async () => {
      const text = `¿Eliminar el gasto ${expense.description} (${formatMoney(expense.amount)})?`;
      if (!(await confirmDialog({ message: text, confirmLabel: 'Eliminar', danger: true }))) return;
      const result = await ctx.services.expenses.remove(id);
      if (result.ok) ctx.navigate('#/expenses');
      else message.set(result.errors.form);
    });
    container.append(h('div', { class: 'form danger-zone' }, remove));
  }
}
