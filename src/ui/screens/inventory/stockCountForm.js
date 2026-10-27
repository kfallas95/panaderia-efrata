// Conteo físico (wireframe §8). REQ-F-08 · INV-09 · D-024.

import { h } from '../../dom.js';
import { FieldError } from '../../components/fieldError.js';
import { QuantityInput } from '../../components/quantityInput.js';
import { EmptyState } from '../../components/emptyState.js';
import { ScreenTitle, FormMessage, SubmitButton } from '../../components/formParts.js';
import { selectSupplyStock } from '../../../state/selectors.js';
import { formatSupplyQuantity } from '../../../domain/quantity.js';
import { SUPPLY_UNIT_LABELS } from '../../../domain/types.js';

export function renderStockCountForm(container, { supplyId = '' }, ctx) {
  const rows = selectSupplyStock(ctx.store.getState())
    .filter((r) => r.supply.isActive)
    .sort((a, b) => a.supply.name.localeCompare(b.supply.name, 'es'));

  container.append(ScreenTitle('Conteo físico', '#/inventory/supplies'));
  if (rows.length === 0) {
    container.append(EmptyState({
      illustration: 'bread',
      text: 'Aún no tienes insumos',
      action: h('a', { class: 'btn btn-primary', href: '#/inventory/supplies/new', text: 'Nuevo insumo' }),
    }));
    return;
  }

  const select = h('select', {},
    h('option', { value: '', text: 'Elige un insumo' }),
    rows.map((r) => h('option', { value: r.supply.id, text: r.supply.name, selected: r.supply.id === supplyId })),
  );
  const supply = FieldError({ label: 'Insumo', control: select });
  const registered = h('p', { class: 'text-muted' });
  const quantityInput = QuantityInput({ kind: 'supply' });
  const quantity = FieldError({ label: 'Cantidad real', control: quantityInput.element });
  const message = FormMessage();

  const updateRegistered = () => {
    const row = rows.find((r) => r.supply.id === select.value);
    registered.textContent = row
      ? `Registrado: ${formatSupplyQuantity(row.quantity)} ${SUPPLY_UNIT_LABELS[row.supply.unit]}`
      : '';
    quantity.element.querySelector('label').textContent = row
      ? `Cantidad real (${SUPPLY_UNIT_LABELS[row.supply.unit]})`
      : 'Cantidad real';
  };
  select.addEventListener('change', updateRegistered);
  updateRegistered();

  const form = h('form', { class: 'form', novalidate: true },
    supply.element, registered, quantity.element, message.element, SubmitButton());
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const result = await ctx.services.stockCounts.register({ supplyId: select.value, quantityText: quantityInput.element.value });
    supply.setError(result.errors?.supplyId);
    quantity.setError(result.errors?.quantity);
    message.set(result.errors?.form);
    if (result.ok) ctx.navigate(`#/inventory/supplies/${select.value}`);
  });
  container.append(form);
}
