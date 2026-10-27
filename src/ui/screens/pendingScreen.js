// Pantallas de formulario y detalle que todavía no tienen contenido.
// Muestran su título y un enlace para volver a la sección (wireframe: "← Nuevo pedido").
// Cada una se reemplaza en la fase que la implementa (docs/tasks.md).

import { h } from '../dom.js';

export const PENDING_TITLES = Object.freeze({
  orderNew: 'Nuevo pedido',
  orderEdit: 'Editar pedido',
  orderDetail: 'Pedido',
});

/** @param {{ title: string, backHref: string }} params */
export function renderPendingScreen(container, { title, backHref }) {
  container.append(
    h('h1', { class: 'screen-title' },
      h('a', { class: 'back-link', href: backHref, 'aria-label': 'Volver', text: '←' }),
      ` ${title}`,
    ),
  );
}
