// Pantalla Inventario (wireframe §6). REQ-F-06, REQ-F-25 · D-047, D-048, D-090.
// Pestaña Productos: existencias y "Desactivados". La pestaña Insumos llega en la Fase 6.

import { h } from '../../dom.js';
import { Tabs } from '../../components/tabs.js';
import { EmptyState } from '../../components/emptyState.js';
import { CollapsibleSection } from '../../components/collapsibleSection.js';
import { MoneyText } from '../../components/moneyText.js';
import { StockLine } from '../../components/stockLine.js';
import { selectProductStock } from '../../../state/selectors.js';

const byName = (a, b) => a.product.name.localeCompare(b.product.name, 'es');

function ProductCard(row) {
  return h('a', { class: 'card card-link', href: `#/inventory/products/${row.product.id}` },
    h('div', { class: 'card-row' },
      h('h3', { text: row.product.name }),
      MoneyText(row.product.price),
    ),
    StockLine(row),
  );
}

function InactiveRow(row, ctx) {
  const button = h('button', { type: 'button', class: 'btn', text: 'Reactivar' });
  button.addEventListener('click', async () => {
    const result = await ctx.services.products.reactivate(row.product.id);
    if (result.ok) ctx.refresh();
  });
  return h('div', { class: 'inactive-row' },
    h('a', { href: `#/inventory/products/${row.product.id}`, text: row.product.name }),
    button,
  );
}

function renderProductsTab(container, ctx) {
  const rows = selectProductStock(ctx.store.getState()).slice().sort(byName);
  const active = rows.filter((r) => r.product.isActive);
  const inactive = rows.filter((r) => !r.product.isActive);

  if (active.length === 0) {
    container.append(EmptyState({
      illustration: 'bread',
      text: 'Aún no tienes productos',
      action: h('a', { class: 'btn btn-primary', href: '#/inventory/products/new', text: 'Nuevo producto' }),
    }));
  } else {
    container.append(h('div', { class: 'card-list' }, active.map(ProductCard)));
  }

  container.append(CollapsibleSection(
    { title: `Desactivados (${inactive.length})` },
    inactive.length
      ? inactive.map((row) => InactiveRow(row, ctx))
      : h('p', { class: 'text-muted', text: 'No hay productos desactivados' }),
  ));
}

/** @param {{ tab: 'products' | 'supplies' }} params */
export function renderInventoryScreen(container, { tab }, ctx) {
  container.append(
    h('h1', { text: 'Inventario' }),
    Tabs([
      { label: 'Productos', href: '#/inventory/products', active: tab === 'products' },
      { label: 'Insumos', href: '#/inventory/supplies', active: tab === 'supplies' },
    ], 'Inventario'),
  );
  if (tab === 'products') renderProductsTab(container, ctx);
  else container.append(EmptyState({ illustration: 'bread', text: 'Aún no tienes insumos' }));
}
