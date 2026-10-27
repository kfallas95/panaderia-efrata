// Ícono SVG propio, incrustado en la página para que tome el color del texto (T-4.4).
// Los SVG viven en assets/ dentro del proyecto (R2, D-014).

import { h } from '../dom.js';

const cache = new Map();

function loadSvg(path) {
  if (!cache.has(path)) {
    cache.set(path, fetch(path).then((response) => (response.ok ? response.text() : '')).catch(() => ''));
  }
  return cache.get(path);
}

/**
 * @param {string} path por ejemplo 'assets/icons/orders.svg'
 * @param {string} [className]
 * @returns {HTMLSpanElement} se llena cuando el SVG termina de cargar
 */
export function Icon(path, className = 'icon') {
  const holder = h('span', { class: className, 'aria-hidden': 'true' });
  loadSvg(path).then((svg) => {
    holder.innerHTML = svg;
  });
  return holder;
}
