// Nueva / editar venta (wireframe §5). REQ-F-12 a REQ-F-14, REQ-F-20 a REQ-F-23, REQ-F-28 ·
// INV-13 · D-031, D-069, D-072, D-106, D-107, D-114.

import { h } from '../../dom.js';
import { FieldError } from '../../components/fieldError.js';
import { MoneyInput } from '../../components/moneyInput.js';
import { QuantityInput } from '../../components/quantityInput.js';
import { ScreenTitle, DateInput, FormMessage, SubmitButton } from '../../components/formParts.js';
import { confirmDialog } from '../../components/confirmDialog.js';
import { formatMoney, parseMoney } from '../../../domain/money.js';
import { parseProductQuantity } from '../../../domain/quantity.js';
import { formatDayMonth } from '../../../domain/dates.js';
import { availableToSell } from '../../../domain/stock.js';
import { selectSaleTotal } from '../../../state/selectors.js';

/** @param {{ id?: string }} params */
export function renderSaleForm(container, { id = null }, ctx) {
  const { data } = ctx.store.getState();
  const sale = id ? data.sales.find((s) => s.id === id) : null;
  if (id && !sale) {
    ctx.navigate('#/sales');
    return;
  }
  const today = ctx.clock.today();
  // Venta de un pedido entregado: líneas bloqueadas, solo se edita la fecha (D-072, D-114).
  const order = sale?.orderId ? data.orders.find((o) => o.id === sale.orderId) : null;
  const locked = Boolean(sale?.orderId);
  const previousIds = new Set((sale?.items ?? []).map((i) => i.productId));
  const products = data.products
    .filter((p) => p.isActive || previousIds.has(p.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const productById = (pid) => products.find((p) => p.id === pid);

  const date = FieldError({ label: 'Fecha', control: DateInput(sale?.date ?? today, today) });
  const linesBox = h('div', { class: 'lines' });
  const totalText = h('strong', { text: formatMoney(0) });
  const message = FormMessage();
  const lines = [];

  const updateTotal = () => {
    if (locked) {
      totalText.textContent = formatMoney(selectSaleTotal(sale));
      return;
    }
    const total = lines.reduce((sum, line) => {
      const q = parseProductQuantity(line.quantity.element.value);
      const p = parseMoney(line.price.element.value);
      return q.ok && p.ok && q.value > 0 && p.value > 0 ? sum + q.value * p.value : sum;
    }, 0);
    totalText.textContent = formatMoney(total);
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
    const removeButton = locked ? null : h('button', { type: 'button', class: 'btn btn-small', 'aria-label': 'Quitar producto', text: '✕' });
    if (locked) [select, quantity.element, price.element].forEach((control) => { control.disabled = true; });

    const line = { select, quantity, price, productField, quantityField, priceField };
    const showAvailable = () => {
      const product = productById(select.value);
      // Al editar, lo que ya estaba en esta venta también se puede usar.
      const own = (sale?.items ?? []).filter((i) => i.productId === select.value).reduce((s, i) => s + i.quantity, 0);
      available.textContent = product ? `Disponible para vender: ${availableToSell(product.id, data) + own}` : '';
    };
    select.addEventListener('change', () => {
      const product = productById(select.value);
      if (product) price.element.value = formatMoney(product.price).replace('₡', '').replace(/ /g, '');
      showAvailable();
      updateTotal();
    });
    quantity.element.addEventListener('input', updateTotal);
    price.element.addEventListener('input', updateTotal);
    const element = h('div', { class: 'card line' },
      h('div', { class: 'line-head' }, productField.element, removeButton),
      available,
      h('div', { class: 'field-pair' }, quantityField.element, priceField.element),
    );
    removeButton?.addEventListener('click', () => {
      lines.splice(lines.indexOf(line), 1);
      element.remove();
      updateTotal();
    });
    line.element = element;
    lines.push(line);
    linesBox.append(element);
    if (!locked) showAvailable();
  }

  /** Artículo personalizado de una venta de pedido: solo lectura (INV-15, D-114). */
  function addCustomLine(item) {
    const controls = [
      FieldError({ label: 'Descripción', control: h('input', { type: 'text', value: item.description, disabled: true }) }),
      FieldError({ label: 'Cantidad', control: QuantityInput({ kind: 'product', value: item.quantity }).element }),
      FieldError({ label: 'Precio (₡)', control: MoneyInput({ value: item.unitPrice }).element }),
    ];
    controls.forEach((field) => { field.control.disabled = true; });
    linesBox.append(h('div', { class: 'card line' },
      controls[0].element,
      h('div', { class: 'field-pair' }, controls[1].element, controls[2].element)));
  }

  (sale?.items ?? []).forEach((item) => addLine(item));
  if (locked) (sale.customItems ?? []).forEach((item) => addCustomLine(item));
  if (lines.length === 0 && !locked) addLine();
  updateTotal();

  const addButton = h('button', { type: 'button', class: 'btn', text: '+ Producto' });
  addButton.addEventListener('click', () => addLine());

  const form = h('form', { class: 'form', novalidate: true },
    order ? h('p', { class: 'tag', text: `Pedido de ${order.customerName}` }) : null,
    date.element, linesBox, locked ? null : addButton,
    h('p', { class: 'form-total' }, 'Total ', totalText),
    message.element, SubmitButton());
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const result = await ctx.services.sales.save({
      id,
      date: date.control.value,
      lines: lines.map((l) => ({ productId: l.select.value, quantityText: l.quantity.element.value, priceText: l.price.element.value })),
    });
    const errors = result.errors ?? {};
    date.setError(errors.date);
    lines.forEach((l, i) => {
      l.productField.setError(errors[`line-${i}-product`]);
      l.quantityField.setError(errors[`line-${i}-quantity`]);
      l.priceField.setError(errors[`line-${i}-price`]);
    });
    message.set(errors.form);
    if (result.ok) ctx.navigate('#/sales');
  });

  container.append(ScreenTitle(sale ? 'Editar venta' : 'Nueva venta', '#/sales'), form);

  if (sale) {
    const remove = h('button', { type: 'button', class: 'btn btn-danger-outline btn-block', text: 'Eliminar venta' });
    remove.addEventListener('click', async () => {
      const text = `¿Eliminar la venta de ${formatMoney(selectSaleTotal(sale))} del ${formatDayMonth(sale.date)}?`
        + (order ? ` El pedido de ${order.customerName} volverá a Pendiente` : '');
      if (!(await confirmDialog({ message: text, confirmLabel: 'Eliminar', danger: true }))) return;
      const result = await ctx.services.sales.remove(id);
      if (result.ok) ctx.navigate('#/sales');
      else message.set(result.errors.form);
    });
    container.append(h('div', { class: 'form danger-zone' }, remove));
  }
}
