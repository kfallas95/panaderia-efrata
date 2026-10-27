// Producción de varios productos (wireframe §8) y editar una producción (D-097).
// REQ-F-03, REQ-F-04, REQ-F-23 · D-076.

import { h } from '../../dom.js';
import { FieldError } from '../../components/fieldError.js';
import { QuantityInput } from '../../components/quantityInput.js';
import { EmptyState } from '../../components/emptyState.js';
import { ScreenTitle, DateInput, FormMessage, SubmitButton } from '../../components/formParts.js';

export function renderProductionForm(container, _params, ctx) {
  const today = ctx.clock.today();
  const products = ctx.store.getState().data.products
    .filter((p) => p.isActive)
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));

  container.append(ScreenTitle('Producción', '#/inventory/products'));
  if (products.length === 0) {
    container.append(EmptyState({
      illustration: 'bread',
      text: 'Aún no tienes productos',
      action: h('a', { class: 'btn btn-primary', href: '#/inventory/products/new', text: 'Nuevo producto' }),
    }));
    return;
  }

  const date = FieldError({ label: 'Fecha', control: DateInput(today, today) });
  const rows = products.map((product) => {
    const input = QuantityInput({ kind: 'product' });
    return { product, input, field: FieldError({ label: product.name, control: input.element, optional: false }) };
  });
  const message = FormMessage();

  const form = h('form', { class: 'form', novalidate: true },
    date.element,
    h('p', { class: 'text-muted', text: 'Escribe cuántas unidades hiciste de cada producto.' }),
    rows.map((r) => r.field.element),
    message.element,
    SubmitButton(),
  );
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const result = await ctx.services.production.registerBatch({
      date: date.control.value,
      entries: rows.map((r) => ({ productId: r.product.id, quantityText: r.input.element.value })),
    });
    date.setError(result.errors?.date);
    rows.forEach((r) => r.field.setError(result.errors?.[r.product.id]));
    message.set(result.errors?.form);
    if (result.ok) ctx.navigate('#/inventory/products');
  });
  container.append(form);
}

export function renderProductionEdit(container, { id }, ctx) {
  const { data } = ctx.store.getState();
  const production = data.productions.find((p) => p.id === id);
  if (!production) {
    ctx.navigate('#/inventory/products');
    return;
  }
  const product = data.products.find((p) => p.id === production.productId);
  const backHref = `#/inventory/products/${production.productId}`;
  const today = ctx.clock.today();

  const date = FieldError({ label: 'Fecha', control: DateInput(production.date, today) });
  const quantityInput = QuantityInput({ kind: 'product', value: production.quantity });
  const quantity = FieldError({ label: `Cantidad de ${product?.name ?? ''}`, control: quantityInput.element });
  const message = FormMessage();

  const form = h('form', { class: 'form', novalidate: true }, date.element, quantity.element, message.element, SubmitButton());
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const result = await ctx.services.production.update(id, { date: date.control.value, quantityText: quantityInput.element.value });
    date.setError(result.errors?.date);
    quantity.setError(result.errors?.quantity);
    message.set(result.errors?.form);
    if (result.ok) ctx.navigate(backHref);
  });
  container.append(ScreenTitle('Editar producción', backHref), form);
}
