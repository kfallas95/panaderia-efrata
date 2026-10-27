// Existencia · Apartado · Disponible · "Faltan X por producir" (REQ-F-06, D-077).

import { h } from '../dom.js';
import { missingInInventory } from '../../domain/messages.js';

/** @param {{ stockOnHand: number, reserved: number, available: number, shortfall: number }} row */
export function StockLine(row) {
  return h('div', { class: 'stock-line' },
    h('p', { class: 'text-muted', text: `Existencia ${row.stockOnHand} · Apartado ${row.reserved}` }),
    h('p', { class: 'stock-available', text: `Disponible para vender ${row.available}` }),
    row.shortfall > 0 ? h('p', { class: 'shortfall', text: missingInInventory(row.shortfall) }) : null,
  );
}
