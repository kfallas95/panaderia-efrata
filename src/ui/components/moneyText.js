// Monto en colones: ₡1 250,50; los negativos en rojo con el signo antes del símbolo (T-4.4, D-084).

import { h } from '../dom.js';
import { formatMoney } from '../../domain/money.js';

export function MoneyText(cents, className = '') {
  const classes = ['money', cents < 0 ? 'money-negative' : '', className].filter(Boolean).join(' ');
  return h('span', { class: classes, text: formatMoney(cents) });
}
