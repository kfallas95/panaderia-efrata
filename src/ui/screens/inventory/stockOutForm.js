// Salida de inventario (wireframe §8). REQ-F-05, REQ-F-23 · D-020.

import { h } from '../../dom.js';
import { FieldError } from '../../components/fieldError.js';
import { QuantityInput } from '../../components/quantityInput.js';
import { EmptyState } from '../../components/emptyState.js';
import { ScreenTitle, DateInput, FormMessage, SubmitButton } from '../../components/formParts.js';
import { StockOutReason, STOCK_OUT_REASON_LABELS } from '../../../domain/types.js';

export function renderStockOutForm(container, { productId = '' }, ctx) {
  const today = ctx.clock.today();
  const products = ctx.store.getState().data.products
    .filter((p) => p.isActive)
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));

  container.append(ScreenTitle('Salida', '#/inventory/products'));
  if (products.length === 0) {
    container.append(EmptyState({ illustration: 'bread', text: 'Aún no tienes productos' }));
    return;
  }

  const select = h('select', {},
    h('option', { value: '', text: 'Elige un producto' }),
    products.map((p) => h('option', { value: p.id, text: p.name, selected: p.id === productId })),
  );
  const product = FieldError({ label: 'Producto', control: select });
  const quantityInput = QuantityInput({ kind: 'product' });
  const quantity = FieldError({ label: 'Cantidad', control: quantityInput.element });

  const reasonGroup = h('fieldset', { class: 'radio-group' },
    h('legend', { text: 'Motivo' }),
    Object.values(StockOutReason).map((reason, index) => h('label', { class: 'radio' },
      h('input', { type: 'radio', name: 'reason', value: reason, checked: index === 0 }),
      ` ${STOCK_OUT_REASON_LABELS[reason]}`,
    )),
  );
  const date = FieldError({ label: 'Fecha', control: DateInput(today, today) });
  const message = FormMessage();

  const form = h('form', { class: 'form', novalidate: true },
    product.element, quantity.element, reasonGroup, date.element, message.element, SubmitButton());
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const result = await ctx.services.stockOuts.register({
      productId: select.value,
      quantityText: quantityInput.element.value,
      reason: form.querySelector('input[name="reason"]:checked')?.value ?? '',
      date: date.control.value,
    });
    product.setError(result.errors?.productId);
    quantity.setError(result.errors?.quantity);
    date.setError(result.errors?.date);
    message.set(result.errors?.form ?? result.errors?.reason);
    if (result.ok) ctx.navigate(`#/inventory/products/${select.value}`);
  });
  container.append(form);
}
