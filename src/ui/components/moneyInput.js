// Campo de monto en colones: acepta coma o punto y devuelve céntimos (T-4.4, D-058).

import { h } from '../dom.js';
import { parseMoney, formatMoney } from '../../domain/money.js';

/**
 * @param {{ value?: number|null, placeholder?: string }} [options] value en céntimos
 * @returns {{ element: HTMLInputElement, read: () => ReturnType<typeof parseMoney> }}
 */
export function MoneyInput({ value = null, placeholder = '1250,50' } = {}) {
  const initial = value === null ? '' : formatMoney(value).replace('₡', '').replace(/ /g, '');
  const element = h('input', { type: 'text', inputmode: 'decimal', autocomplete: 'off', placeholder, value: initial });
  return { element, read: () => parseMoney(element.value) };
}
