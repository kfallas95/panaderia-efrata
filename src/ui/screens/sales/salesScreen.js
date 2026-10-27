// Pantalla Ventas (wireframe §4). Fase 4: título y estado vacío; el contenido llega en la Fase 7.

import { h } from '../../dom.js';
import { EmptyState } from '../../components/emptyState.js';

export function renderSalesScreen(container) {
  container.append(
    h('h1', { text: 'Ventas' }),
    EmptyState({ illustration: 'croissant', text: 'Aún no tienes ventas' }),
  );
}
