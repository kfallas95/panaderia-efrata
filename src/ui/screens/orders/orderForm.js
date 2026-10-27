// Nuevo / editar pedido (wireframe §3, T-8.3). REQ-F-15, REQ-F-16, REQ-F-20 a REQ-F-24, REQ-F-27, REQ-F-28 ·
// INV-13, INV-15, INV-24 · D-026, D-069, D-073, D-110.

import { h } from '../../dom.js';
import { FieldError } from '../../components/fieldError.js';
import { MoneyInput } from '../../components/moneyInput.js';
import { QuantityInput } from '../../components/quantityInput.js';
import { ScreenTitle, FormMessage, SubmitButton } from '../../components/formParts.js';
import { formatMoney, parseMoney } from '../../../domain/money.js';
import { parseProductQuantity } from '../../../domain/quantity.js';
import { availableToSell } from '../../../domain/stock.js';
import { OrderStatus } from '../../../domain/types.js';
import { formatPhone } from '../../../domain/validators.js';

/** Precio del catálogo como texto editable: 150000 → "1500,00". */
const priceText = (cents) => formatMoney(cents).replace('₡', '').replace(/ /g, '');

/** @param {{ id?: string }} params */
export function renderOrderForm(container, { id = null }, ctx) {
  const { data } = ctx.store.getState();
  const order = id ? data.orders.find((o) => o.id === id) : null;
  if (id && (!order || order.status !== OrderStatus.PENDING)) {
    ctx.navigate(order ? `#/orders/${id}` : '#/orders');
    return;
  }
  const previousIds = new Set((order?.items ?? []).map((i) => i.productId));
  const products = data.products
    .filter((p) => p.isActive || previousIds.has(p.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const productById = (pid) => products.find((p) => p.id === pid);

  const customer = FieldError({ label: 'Cliente', control: h('input', { type: 'text', autocomplete: 'off', value: order?.customerName ?? '' }) });
  const phone = FieldError({
    label: 'Teléfono',
    control: h('input', { type: 'tel', inputmode: 'numeric', autocomplete: 'off', placeholder: '8888-0000', value: order ? formatPhone(order.customerPhone) : '' }),
  });
  const deliveryDate = FieldError({ label: 'Fecha de entrega', control: h('input', { type: 'date', value: order?.deliveryDate ?? '' }) });
  const deliveryTime = FieldError({ label: 'Hora de entrega', control: h('input', { type: 'time', value: order?.deliveryTime ?? '' }) });
  const advance = MoneyInput({ value: order?.advanceAmount ?? null });
  const advanceField = FieldError({ label: 'Adelanto (₡)', control: advance.element, optional: true });
  const notesField = FieldError({ label: 'Notas', control: h('textarea', { rows: 3, text: order?.notes ?? '' }), optional: true });

  const linesBox = h('div', { class: 'lines' });
  const customBox = h('div', { class: 'lines' });
  const totalText = h('strong', { text: formatMoney(0) });
  const message = FormMessage();
  const lines = [];
  const customLines = [];

  const lineAmount = (line) => {
    const q = parseProductQuantity(line.quantity.element.value);
    const p = parseMoney(line.price.element.value);
    return q.ok && p.ok && q.value > 0 && p.value > 0 ? q.value * p.value : 0;
  };
  const updateTotal = () => {
    const total = [...lines, ...customLines].reduce((sum, line) => sum + lineAmount(line), 0);
    totalText.textContent = formatMoney(total);
  };

  /** Quita una línea de su lista y del formulario. */
  const removable = (list, line, element) => {
    const button = h('button', { type: 'button', class: 'btn btn-small', 'aria-label': 'Quitar', text: '✕' });
    button.addEventListener('click', () => {
      list.splice(list.indexOf(line), 1);
      element.remove();
      updateTotal();
    });
    return button;
  };

  function addLine(item = null) {
    const select = h('select', {},
      h('option', { value: '', text: 'Elige un producto' }),
      products.map((p) => h('option', { value: p.id, text: p.name, selected: p.id === item?.productId })),
    );
    const quantity = QuantityInput({ kind: 'product', value: item?.quantity ?? null });
    const price = MoneyInput({ value: item?.unitPrice ?? null });
    const available = h('p', { class: 'text-muted line-hint' });
    const productField = FieldError({ label: 'Producto', control: select });
    const quantityField = FieldError({ label: 'Cantidad', control: quantity.element });
    const priceField = FieldError({ label: 'Precio (₡)', control: price.element });
    const line = { select, quantity, price, productField, quantityField, priceField };

    const showAvailable = () => {
      const product = productById(select.value);
      // Al editar, lo que este pedido ya apartaba también cuenta como disponible.
      const own = (order?.items ?? []).filter((i) => i.productId === select.value).reduce((s, i) => s + i.quantity, 0);
      available.textContent = product ? `Disponible para vender: ${availableToSell(product.id, data) + own}` : '';
    };
    select.addEventListener('change', () => {
      const product = productById(select.value);
      if (product) price.element.value = priceText(product.price);
      showAvailable();
      updateTotal();
    });
    quantity.element.addEventListener('input', updateTotal);
    price.element.addEventListener('input', updateTotal);

    const element = h('div', { class: 'card line' });
    element.append(
      h('div', { class: 'line-head' }, productField.element, removable(lines, line, element)),
      available,
      h('div', { class: 'field-pair' }, quantityField.element, priceField.element),
    );
    lines.push(line);
    linesBox.append(element);
    showAvailable();
  }

  function addCustomLine(item = null) {
    const description = h('input', { type: 'text', autocomplete: 'off', value: item?.description ?? '' });
    const quantity = QuantityInput({ kind: 'product', value: item?.quantity ?? null });
    const price = MoneyInput({ value: item?.unitPrice ?? null });
    const descriptionField = FieldError({ label: 'Descripción', control: description });
    const quantityField = FieldError({ label: 'Cantidad', control: quantity.element });
    const priceField = FieldError({ label: 'Precio (₡)', control: price.element });
    const line = { description, quantity, price, descriptionField, quantityField, priceField };
    quantity.element.addEventListener('input', updateTotal);
    price.element.addEventListener('input', updateTotal);

    const element = h('div', { class: 'card line' });
    element.append(
      h('div', { class: 'line-head' }, descriptionField.element, removable(customLines, line, element)),
      h('div', { class: 'field-pair' }, quantityField.element, priceField.element),
    );
    customLines.push(line);
    customBox.append(element);
  }

  (order?.items ?? []).forEach((item) => addLine(item));
  (order?.customItems ?? []).forEach((item) => addCustomLine(item));
  if (!order) addLine();
  updateTotal();

  const addButton = h('button', { type: 'button', class: 'btn', text: '+ Producto del catálogo' });
  addButton.addEventListener('click', () => addLine());
  const addCustomButton = h('button', { type: 'button', class: 'btn', text: '+ Artículo personalizado' });
  addCustomButton.addEventListener('click', () => addCustomLine());

  const form = h('form', { class: 'form', novalidate: true },
    customer.element,
    phone.element,
    h('div', { class: 'field-pair' }, deliveryDate.element, deliveryTime.element),
    h('h2', { class: 'form-section', text: 'Productos' }), linesBox, addButton,
    h('h2', { class: 'form-section', text: 'Personalizados' }), customBox, addCustomButton,
    h('p', { class: 'form-total' }, 'Total ', totalText),
    advanceField.element,
    notesField.element,
    message.element,
    SubmitButton());

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const result = await ctx.services.orders.save({
      id,
      customerName: customer.control.value,
      phoneText: phone.control.value,
      deliveryDate: deliveryDate.control.value,
      deliveryTime: deliveryTime.control.value,
      lines: lines.map((l) => ({ productId: l.select.value, quantityText: l.quantity.element.value, priceText: l.price.element.value })),
      customLines: customLines.map((l) => ({ description: l.description.value, quantityText: l.quantity.element.value, priceText: l.price.element.value })),
      advanceText: advance.element.value,
      notes: notesField.control.value,
    });
    const errors = result.errors ?? {};
    customer.setError(errors.customerName);
    phone.setError(errors.customerPhone);
    deliveryDate.setError(errors.deliveryDate);
    deliveryTime.setError(errors.deliveryTime);
    advanceField.setError(errors.advance);
    lines.forEach((l, i) => {
      l.productField.setError(errors[`line-${i}-product`]);
      l.quantityField.setError(errors[`line-${i}-quantity`]);
      l.priceField.setError(errors[`line-${i}-price`]);
    });
    customLines.forEach((l, i) => {
      l.descriptionField.setError(errors[`custom-${i}-description`]);
      l.quantityField.setError(errors[`custom-${i}-quantity`]);
      l.priceField.setError(errors[`custom-${i}-price`]);
    });
    message.set(errors.form);
    if (result.ok) ctx.navigate(order ? `#/orders/${id}` : '#/orders');
  });

  container.append(ScreenTitle(order ? 'Editar pedido' : 'Nuevo pedido', order ? `#/orders/${id}` : '#/orders'), form);
}
