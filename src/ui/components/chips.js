// Filtro con chips (Gastos: Todos · Insumos · Servicios) (T-4.4, D-047).

import { h } from '../dom.js';

/** @param {Array<{ label: string, href: string, active: boolean }>} items */
export function Chips(items, ariaLabel) {
  return h('nav', { class: 'chips', 'aria-label': ariaLabel },
    items.map((item) => h('a', {
      class: item.active ? 'chip chip-active' : 'chip',
      href: item.href,
      'aria-current': item.active ? 'true' : null,
      text: item.label,
    })),
  );
}
