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
import { renderProductForm } from './screens/inventory/productForm.js';
import { renderProductDetail } from './screens/inventory/productDetail.js';
import { renderProductionForm, renderProductionEdit } from './screens/inventory/productionForm.js';
import { renderStockOutForm } from './screens/inventory/stockOutForm.js';
import { renderSupplyForm } from './screens/inventory/supplyForm.js';
import { renderSupplyDetail } from './screens/inventory/supplyDetail.js';
import { renderStockCountForm } from './screens/inventory/stockCountForm.js';
import { renderExpenseForm } from './screens/expenses/expenseForm.js';
import { renderExpensesScreen } from './screens/expenses/expensesScreen.js';
import { renderReportScreen } from './screens/report/reportScreen.js';
import { renderPendingScreen, PENDING_TITLES } from './screens/pendingScreen.js';

/** Pantalla de cada ruta: (contenedor, ruta, contexto). */
const SCREENS = {
  orders: (c) => renderOrdersScreen(c),
  sales: (c) => renderSalesScreen(c),
  inventoryProducts: (c, _r, ctx) => renderInventoryScreen(c, { tab: 'products' }, ctx),
  inventorySupplies: (c, _r, ctx) => renderInventoryScreen(c, { tab: 'supplies' }, ctx),
  productNew: (c, _r, ctx) => renderProductForm(c, {}, ctx),
  productEdit: (c, r, ctx) => renderProductForm(c, { id: r.params.id }, ctx),
  productDetail: (c, r, ctx) => renderProductDetail(c, { id: r.params.id }, ctx),
  production: (c, _r, ctx) => renderProductionForm(c, {}, ctx),
  productionEdit: (c, r, ctx) => renderProductionEdit(c, { id: r.params.id }, ctx),
  stockOut: (c, r, ctx) => renderStockOutForm(c, { productId: r.query.product ?? '' }, ctx),
  supplyNew: (c, _r, ctx) => renderSupplyForm(c, {}, ctx),
  supplyEdit: (c, r, ctx) => renderSupplyForm(c, { id: r.params.id }, ctx),
  supplyDetail: (c, r, ctx) => renderSupplyDetail(c, { id: r.params.id }, ctx),
  stockCount: (c, r, ctx) => renderStockCountForm(c, { supplyId: r.query.supply ?? '' }, ctx),
  expenses: (c, r, ctx) => renderExpensesScreen(c, { category: r.query.category ?? '' }, ctx),
  expenseNew: (c, _r, ctx) => renderExpenseForm(c, {}, ctx),
  expenseEdit: (c, r, ctx) => renderExpenseForm(c, { id: r.params.id }, ctx),
  report: (c) => renderReportScreen(c),
};

/** Dirección actual sin ?today ni ?time (para "Volver a la fecha real"). */
function realDateUrl(location) {
  return `${location.pathname}${location.hash}`;
}

/**
 * @param {{ root: HTMLElement, store: object, clock: object, services: object }} deps
 */
export function startApp({ root, store, clock, services }) {
  const shell = AppShell();
  replaceChildren(root, shell.element);
  let router = null;
  let currentRoute = null;

  const ctx = {
    store,
    clock,
    services,
    navigate: (hash) => {
      if (window.location.hash === hash) render(currentRoute);
      else router.navigate(hash);
    },
    refresh: () => render(currentRoute),
  };

  function render(route) {
    currentRoute = route;
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
    if (screen) screen(shell.main, route, ctx);
    else renderPendingScreen(shell.main, { title: PENDING_TITLES[route.name], backHref: section.href });
  }

  router = startRouter((route) => {
    render(route);
    window.scrollTo(0, 0);
  });
  return router;
}
