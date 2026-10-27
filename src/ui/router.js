// Router por hash (T-4.1). D-055 · docs/design.md §3.1.
// Funciona con Live Server sin configuración; Atrás, Adelante y recargar
// conservan la pantalla. Una ruta desconocida lleva a #/orders.

export const DEFAULT_ROUTE = '#/orders';

/**
 * Rutas de design §3.1. `section` indica qué sección queda activa en la navegación.
 * El orden importa: las rutas fijas (por ejemplo /products/new) van antes que /products/{id}.
 */
export const ROUTES = Object.freeze([
  { pattern: '/orders', name: 'orders', section: 'orders' },
  { pattern: '/orders/new', name: 'orderNew', section: 'orders' },
  { pattern: '/orders/:id/edit', name: 'orderEdit', section: 'orders' },
  { pattern: '/orders/:id', name: 'orderDetail', section: 'orders' },
  { pattern: '/sales', name: 'sales', section: 'sales' },
  { pattern: '/sales/new', name: 'saleNew', section: 'sales' },
  { pattern: '/sales/:id/edit', name: 'saleEdit', section: 'sales' },
  { pattern: '/inventory/products', name: 'inventoryProducts', section: 'inventory' },
  { pattern: '/inventory/supplies', name: 'inventorySupplies', section: 'inventory' },
  { pattern: '/inventory/products/new', name: 'productNew', section: 'inventory' },
  { pattern: '/inventory/supplies/new', name: 'supplyNew', section: 'inventory' },
  { pattern: '/inventory/products/:id/edit', name: 'productEdit', section: 'inventory' },
  { pattern: '/inventory/supplies/:id/edit', name: 'supplyEdit', section: 'inventory' },
  { pattern: '/inventory/products/:id', name: 'productDetail', section: 'inventory' },
  { pattern: '/inventory/supplies/:id', name: 'supplyDetail', section: 'inventory' },
  { pattern: '/inventory/production', name: 'production', section: 'inventory' },
  { pattern: '/inventory/production/:id/edit', name: 'productionEdit', section: 'inventory' },
  { pattern: '/inventory/stock-out', name: 'stockOut', section: 'inventory' },
  { pattern: '/inventory/count', name: 'stockCount', section: 'inventory' },
  { pattern: '/expenses', name: 'expenses', section: 'expenses' },
  { pattern: '/expenses/new', name: 'expenseNew', section: 'expenses' },
  { pattern: '/expenses/:id/edit', name: 'expenseEdit', section: 'expenses' },
  { pattern: '/report', name: 'report', section: 'report' },
]);

/**
 * Lee un hash como '#/orders/abc?tab=delivered'.
 * @returns {{ name: string, section: string, params: object, query: object } | null}
 */
export function matchRoute(hash) {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  const [path, queryPart = ''] = raw.split('?');
  const query = Object.fromEntries(new URLSearchParams(queryPart));
  const segments = path.split('/').filter(Boolean);

  for (const route of ROUTES) {
    const parts = route.pattern.split('/').filter(Boolean);
    if (parts.length !== segments.length) continue;
    const params = {};
    const ok = parts.every((part, i) => {
      if (part.startsWith(':')) {
        params[part.slice(1)] = decodeURIComponent(segments[i]);
        return true;
      }
      return part === segments[i];
    });
    if (ok) return { name: route.name, section: route.section, params, query };
  }
  return null;
}

/**
 * Inicia el router.
 * @param {(route: ReturnType<typeof matchRoute>) => void} onRoute
 * @returns {{ navigate: (hash: string) => void, current: () => object, stop: () => void }}
 */
export function startRouter(onRoute, target = window) {
  let current = null;

  const handle = () => {
    const route = matchRoute(target.location.hash);
    if (!route) {
      target.location.replace(DEFAULT_ROUTE);
      return;
    }
    current = route;
    onRoute(route);
  };

  target.addEventListener('hashchange', handle);
  handle();

  return {
    navigate: (hash) => {
      target.location.hash = hash;
    },
    current: () => current,
    stop: () => target.removeEventListener('hashchange', handle),
  };
}
