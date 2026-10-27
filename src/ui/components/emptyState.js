// Estado vacío: ilustración decorativa + texto + acción opcional (T-4.4, D-014, D-090).

import { h } from '../dom.js';

export const ILLUSTRATIONS = Object.freeze({
  croissant: 'assets/illustrations/croissant.svg',
  bread: 'assets/illustrations/bread.svg',
});

/**
 * @param {{ illustration: 'croissant' | 'bread', text: string, action?: Node }} options
 *        `action` es el botón de la fase que lo implemente; en la Fase 4 no se usa.
 */
export function EmptyState({ illustration, text, action = null }) {
  return h('div', { class: 'empty-state' },
    h('img', { src: ILLUSTRATIONS[illustration], alt: '', width: 140, height: 93 }),
    h('p', { text }),
    action,
  );
}
