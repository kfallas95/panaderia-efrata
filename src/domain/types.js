// Enumeraciones del dominio y sus etiquetas en español (T-1.1).
// Lenguaje ubicuo: CLAUDE.md §3.3 · D-019 a D-020, D-039.

export const ExpenseCategory = Object.freeze({
  SUPPLIES: 'SUPPLIES',
  SERVICES: 'SERVICES',
});

export const OrderStatus = Object.freeze({
  PENDING: 'PENDING',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
});

export const StockOutReason = Object.freeze({
  REUSED: 'REUSED',
  GIVEN_AWAY: 'GIVEN_AWAY',
});

export const SupplyUnit = Object.freeze({
  KG: 'KG',
  G: 'G',
  L: 'L',
  ML: 'ML',
  UNIT: 'UNIT',
});

export const ReportPeriod = Object.freeze({
  DAY: 'DAY',
  MONTH: 'MONTH',
});

export const EXPENSE_CATEGORY_LABELS = Object.freeze({
  SUPPLIES: 'Insumos',
  SERVICES: 'Servicios',
});

export const ORDER_STATUS_LABELS = Object.freeze({
  PENDING: 'Pendiente',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
});

export const STOCK_OUT_REASON_LABELS = Object.freeze({
  REUSED: 'Reutilizado',
  GIVEN_AWAY: 'Regalado',
});

export const SUPPLY_UNIT_LABELS = Object.freeze({
  KG: 'kg',
  G: 'g',
  L: 'L',
  ML: 'ml',
  UNIT: 'unidad',
});

export const REPORT_PERIOD_LABELS = Object.freeze({
  DAY: 'Día',
  MONTH: 'Mes',
});
