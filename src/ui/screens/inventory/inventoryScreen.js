// Pantalla Inventario (wireframe §6 y §7). Fase 4: título y estado vacío;
// las pestañas Productos e Insumos y su contenido llegan en las fases 5 y 6.

import { h } from '../../dom.js';
import { EmptyState } from '../../components/emptyState.js';

/** @param {{ tab: 'products' | 'supplies' }} params */
export function renderInventoryScreen(container, { tab }) {
  container.append(
    h('h1', { text: 'Inventario' }),
    EmptyState({
      illustration: 'bread',
      text: tab === 'supplies' ? 'Aún no tienes insumos' : 'Aún no tienes productos',
    }),
  );
}
