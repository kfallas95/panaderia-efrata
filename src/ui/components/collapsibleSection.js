// Sección plegable, por ejemplo "Desactivados (N)" (T-4.4, REQ-F-25).

import { h } from '../dom.js';

export function CollapsibleSection({ title, open = false }, ...children) {
  return h('details', { class: 'collapsible', open }, h('summary', { text: title }), ...children);
}
