// Pantalla Pedidos (wireframe §1). Fase 4: título y estado vacío; el contenido llega en la Fase 8.

import { h } from '../../dom.js';
import { EmptyState } from '../../components/emptyState.js';

export function renderOrdersScreen(container) {
  container.append(
    h('h1', { text: 'Pedidos' }),
    EmptyState({ illustration: 'croissant', text: 'Aún no tienes pedidos pendientes' }),
  );
}
