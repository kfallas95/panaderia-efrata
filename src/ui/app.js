// Aplicación: une el marco, el router y las pantallas (T-4.1 a T-4.5).
// La UI solo lee el store y los selectores, y llama servicios (design §2.1).

import { replaceChildren } from './dom.js';
import { startRouter } from './router.js';
import { AppShell } from './components/appShell.js';
import { FabButton } from './components/fabButton.js';
import { SimulatedDateBanner } from './components/simulatedDateBanner.js';
import { sectionByKey, LIST_ROUTES } from './sections.js';
import { renderOrdersScreen } from './screens/orders/ordersScreen.js';
import { renderSalesScreen } from './screens/sales/salesScreen.js';
import { renderInventoryScreen } from './screens/inventory/inventoryScreen.js';
import { renderExpensesScreen } from './screens/expenses/expensesScreen.js';
import { renderReportScreen } from './screens/report/reportScreen.js';
import { renderPendingScreen, PENDING_TITLES } from './screens/pendingScreen.js';

const SCREENS = {
  orders: (container) => renderOrdersScreen(container),
  sales: (container) => renderSalesScreen(container),
  inventoryProducts: (container) => renderInventoryScreen(container, { tab: 'products' }),
  inventorySupplies: (container) => renderInventoryScreen(container, { tab: 'supplies' }),
  expenses: (container) => renderExpensesScreen(container),
  report: (container) => renderReportScreen(container),
};

/** Dirección actual sin ?today ni ?time (para "Volver a la fecha real"). */
function realDateUrl(location) {
  return `${location.pathname}${location.hash}`;
}

/**
 * @param {{ root: HTMLElement, store: object, clock: object }} deps
 */
export function startApp({ root, store, clock }) {
  const shell = AppShell();
  replaceChildren(root, shell.element);

  const render = (route) => {
    const section = sectionByKey(route.section);
    shell.setActiveSection(section.key);

    replaceChildren(shell.banner, clock.isSimulated
      ? SimulatedDateBanner(clock.nowParts(), realDateUrl(window.location))
      : null);

    const isList = LIST_ROUTES.includes(route.name);
    replaceChildren(shell.actionSlot, isList && section.action ? FabButton(section.action, 'header') : null);
    replaceChildren(shell.fabSlot, isList && section.action ? FabButton(section.action, 'floating') : null);

    shell.main.replaceChildren();
    const screen = SCREENS[route.name];
    if (screen) screen(shell.main, { route, store, clock });
    else renderPendingScreen(shell.main, { title: PENDING_TITLES[route.name], backHref: section.href });
    window.scrollTo(0, 0);
  };

  return startRouter(render);
}
