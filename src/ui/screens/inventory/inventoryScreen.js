// Pantalla Inventario (wireframe §6 y §7). REQ-F-06, REQ-F-07, REQ-F-25 · D-047, D-048, D-090.
// Pestañas Productos e Insumos, cada una con su sección "Desactivados".

import { h } from '../../dom.js';
import { Tabs } from '../../components/tabs.js';
import { EmptyState } from '../../components/emptyState.js';
import { CollapsibleSection } from '../../components/collapsibleSection.js';
import { MoneyText } from '../../components/moneyText.js';
import { StockLine } from '../../components/stockLine.js';
import { selectProductStock, selectSupplyStock } from '../../../state/selectors.js';
import { formatSupplyQuantity } from '../../../domain/quantity.js';
import { SUPPLY_UNIT_LABELS } from '../../../domain/types.js';
import { formatDayMonth } from '../../../domain/dates.js';

/** "1 nov · 18:00" a partir de countedAt. */
export function formatCountMoment(countedAt) {
  return `${formatDayMonth(countedAt.slice(0, 10))} · ${countedAt.slice(11, 16)}`;
}

/** Sección "Desactivados (N)" con el botón Reactivar en cada elemento (REQ-F-25). */
function InactiveSection(rows, { hrefOf, nameOf, reactivate, emptyText }, ctx) {
  return CollapsibleSection(
    { title: `Desactivados (${rows.length})` },
    rows.length
      ? rows.map((row) => {
        const button = h('button', { type: 'button', class: 'btn', text: 'Reactivar' });
        button.addEventListener('click', async () => {
          const result = await reactivate(row);
          if (result.ok) ctx.refresh();
        });
        return h('div', { class: 'inactive-row' }, h('a', { href: hrefOf(row), text: nameOf(row) }), button);
      })
      : h('p', { class: 'text-muted', text: emptyText }),
  );
}

// ---------- Productos ----------

function ProductCard(row) {
  return h('a', { class: 'card card-link', href: `#/inventory/products/${row.product.id}` },
    h('div', { class: 'card-row' },
      h('h3', { text: row.product.name }),
      MoneyText(row.product.price),
    ),
    StockLine(row),
  );
}

function renderProductsTab(container, ctx) {
  const rows = selectProductStock(ctx.store.getState()).slice()
    .sort((a, b) => a.product.name.localeCompare(b.product.name, 'es'));
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

  container.append(InactiveSection(inactive, {
    hrefOf: (row) => `#/inventory/products/${row.product.id}`,
    nameOf: (row) => row.product.name,
    reactivate: (row) => ctx.services.products.reactivate(row.product.id),
    emptyText: 'No hay productos desactivados',
  }, ctx));
}

// ---------- Insumos ----------

function SupplyCard(row) {
  const unit = SUPPLY_UNIT_LABELS[row.supply.unit];
  return h('a', { class: 'card card-link', href: `#/inventory/supplies/${row.supply.id}` },
    h('div', { class: 'card-row' },
      h('h3', { text: row.supply.name }),
      h('span', { class: 'stock-available', text: `${formatSupplyQuantity(row.quantity)} ${unit}` }),
    ),
    h('p', {
      class: 'text-muted',
      text: row.lastCount ? `Último conteo: ${formatCountMoment(row.lastCount.countedAt)}` : 'Sin conteos',
    }),
  );
}

function renderSuppliesTab(container, ctx) {
  const rows = selectSupplyStock(ctx.store.getState()).slice()
    .sort((a, b) => a.supply.name.localeCompare(b.supply.name, 'es'));
  const active = rows.filter((r) => r.supply.isActive);
  const inactive = rows.filter((r) => !r.supply.isActive);

  if (active.length === 0) {
    container.append(EmptyState({
      illustration: 'bread',
      text: 'Aún no tienes insumos',
      action: h('a', { class: 'btn btn-primary', href: '#/inventory/supplies/new', text: 'Nuevo insumo' }),
    }));
  } else {
    container.append(h('div', { class: 'card-list' }, active.map(SupplyCard)));
  }

  container.append(InactiveSection(inactive, {
    hrefOf: (row) => `#/inventory/supplies/${row.supply.id}`,
    nameOf: (row) => row.supply.name,
    reactivate: (row) => ctx.services.supplies.reactivate(row.supply.id),
    emptyText: 'No hay insumos desactivados',
  }, ctx));
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
  else renderSuppliesTab(container, ctx);
}
