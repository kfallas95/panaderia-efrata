// Pantalla Gastos (wireframe §9). Fase 4: título y estado vacío; el contenido llega en la Fase 6.

import { h } from '../../dom.js';
import { EmptyState } from '../../components/emptyState.js';

export function renderExpensesScreen(container) {
  container.append(
    h('h1', { text: 'Gastos' }),
    EmptyState({ illustration: 'bread', text: 'Aún no tienes gastos' }),
  );
}
