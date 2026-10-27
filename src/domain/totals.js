// Totales de ventas y pedidos, en céntimos (T-1.7). Valores derivados (D-036).

const lineTotal = (line) => line.quantity * line.unitPrice;
const sumLines = (lines = []) => lines.reduce((total, line) => total + lineTotal(line), 0);

/** Total de una venta = Σ líneas de catálogo + Σ artículos personalizados (si viene de un pedido). */
export function saleTotal(sale) {
  return sumLines(sale.items) + sumLines(sale.customItems);
}

/** Total de un pedido = Σ líneas de catálogo + Σ artículos personalizados. */
export function orderTotal(order) {
  return sumLines(order.items) + sumLines(order.customItems);
}

/** Saldo del pedido = total − adelanto (el adelanto es opcional, D-026). */
export function orderBalance(order) {
  return orderTotal(order) - (order.advanceAmount ?? 0);
}
