// Campo de cantidad: enteros para productos y hasta 3 decimales para insumos (T-4.4, D-038, D-075).

import { h } from '../dom.js';
import { parseProductQuantity, parseSupplyQuantity, formatSupplyQuantity } from '../../domain/quantity.js';

/**
 * @param {{ kind: 'product' | 'supply', value?: number|null }} options
 *        value: unidades (producto) o milésimas (insumo)
 */
export function QuantityInput({ kind, value = null }) {
  const isProduct = kind === 'product';
  const initial = value === null ? '' : isProduct ? String(value) : formatSupplyQuantity(value).replace(/ /g, '');
  const element = h('input', {
    type: 'text',
    inputmode: isProduct ? 'numeric' : 'decimal',
    autocomplete: 'off',
    value: initial,
  });
  return {
    element,
    read: () => (isProduct ? parseProductQuantity(element.value) : parseSupplyQuantity(element.value)),
  };
}
