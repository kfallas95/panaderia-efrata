// Secciones de la navegación principal y la acción del botón (+) de cada una.
// D-046 · docs/design.md §3.1 y §3.2 · docs/wireframe.md §1, §4, §6 a §10.

export const SECTIONS = Object.freeze([
  {
    key: 'orders',
    label: 'Pedidos',
    icon: 'assets/icons/orders.svg',
    href: '#/orders',
    action: { label: 'Nuevo pedido', href: '#/orders/new' },
  },
  {
    key: 'sales',
    label: 'Ventas',
    icon: 'assets/icons/sales.svg',
    href: '#/sales',
    action: { label: 'Nueva venta', href: '#/sales/new' },
  },
  {
    key: 'inventory',
    label: 'Inventario',
    icon: 'assets/icons/inventory.svg',
    href: '#/inventory/products',
    action: {
      label: 'Nuevo',
      menu: [
        { label: 'Producción', href: '#/inventory/production' },
        { label: 'Salida', href: '#/inventory/stock-out' },
        { label: 'Conteo físico', href: '#/inventory/count' },
        { label: 'Nuevo producto', href: '#/inventory/products/new' },
        { label: 'Nuevo insumo', href: '#/inventory/supplies/new' },
      ],
    },
  },
  {
    key: 'expenses',
    label: 'Gastos',
    icon: 'assets/icons/expenses.svg',
    href: '#/expenses',
    action: { label: 'Nuevo gasto', href: '#/expenses/new' },
  },
  {
    key: 'report',
    label: 'Reporte',
    icon: 'assets/icons/report.svg',
    href: '#/report',
    action: null, // Reporte no tiene botón (+) (D-046)
  },
]);

export const sectionByKey = (key) => SECTIONS.find((section) => section.key === key) ?? SECTIONS[0];

/** Rutas de lista: las únicas que muestran el botón (+). */
export const LIST_ROUTES = Object.freeze(['orders', 'sales', 'inventoryProducts', 'inventorySupplies', 'expenses']);
