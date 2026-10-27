// Nuevo / editar producto (T-5.1). REQ-F-01, REQ-F-20 a REQ-F-22, REQ-F-28.

import { h } from '../../dom.js';
import { FieldError } from '../../components/fieldError.js';
import { MoneyInput } from '../../components/moneyInput.js';
import { ScreenTitle, FormMessage, SubmitButton } from '../../components/formParts.js';

/** @param {{ id?: string }} params */
export function renderProductForm(container, { id = null }, ctx) {
  const product = id ? ctx.store.getState().data.products.find((p) => p.id === id) : null;
  const backHref = product ? `#/inventory/products/${id}` : '#/inventory/products';

  const name = FieldError({ label: 'Nombre', control: h('input', { type: 'text', value: product?.name ?? '', autocomplete: 'off' }) });
  const priceInput = MoneyInput({ value: product?.price ?? null });
  const price = FieldError({ label: 'Precio (₡)', control: priceInput.element });
  const message = FormMessage();

  const form = h('form', { class: 'form', novalidate: true }, name.element, price.element, message.element, SubmitButton());
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const result = await ctx.services.products.save({ id, name: name.control.value, priceText: priceInput.element.value });
    name.setError(result.errors?.name);
    price.setError(result.errors?.price);
    message.set(result.errors?.form);
    if (result.ok) ctx.navigate(product ? backHref : '#/inventory/products');
  });

  container.append(ScreenTitle(product ? 'Editar producto' : 'Nuevo producto', backHref), form);
}
