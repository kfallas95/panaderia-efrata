// Cantidades (T-1.3).
// Productos: unidades enteras (D-038). Insumos: hasta 3 decimales, guardados en
// milésimas enteras de su unidad (D-075): 2,5 kg → 2500.

import { parseScaledNumber } from './money.js';

/** Lee una cantidad de producto: '5' → 5 · '1,5' → "Escribe un número entero" (D-083). */
export function parseProductQuantity(text) {
  return parseScaledNumber(text, 0);
}

/** Lee una cantidad de insumo en milésimas: '2,5' → 2500 · '2,3755' → error. */
export function parseSupplyQuantity(text) {
  return parseScaledNumber(text, 3);
}

/**
 * Muestra milésimas de insumo sin ceros sobrantes: 5500 → "5,5" · 2375 → "2,375" · 30000 → "30".
 * @param {number} thousandths
 */
export function formatSupplyQuantity(thousandths) {
  const sign = thousandths < 0 ? '−' : '';
  const absolute = Math.abs(Math.trunc(thousandths));
  const whole = String(Math.floor(absolute / 1000)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const fraction = String(absolute % 1000).padStart(3, '0').replace(/0+$/, '');
  return fraction ? `${sign}${whole},${fraction}` : `${sign}${whole}`;
}
