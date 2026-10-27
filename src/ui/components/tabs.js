// Pestañas de navegación (Pedidos, Inventario) (T-4.4).

import { h } from '../dom.js';

/** @param {Array<{ label: string, href: string, active: boolean }>} items */
export function Tabs(items, ariaLabel) {
  return h('nav', { class: 'tabs', 'aria-label': ariaLabel },
    items.map((item) => h('a', {
      class: item.active ? 'tab tab-active' : 'tab',
      href: item.href,
      'aria-current': item.active ? 'page' : null,
      text: item.label,
    })),
  );
}
