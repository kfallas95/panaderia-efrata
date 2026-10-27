// Pantalla Reporte (wireframe §10). Fase 4: solo el título; el contenido llega en la Fase 10.

import { h } from '../../dom.js';

export function renderReportScreen(container) {
  container.append(h('h1', { text: 'Reporte' }));
}
