// Textos de error visibles para el usuario, en español (T-1.9).
// Fuente: docs/design.md §5.2, §5.4 y §8 · D-035, D-052, D-058, D-066, D-074, D-076, D-082, D-083, D-102, D-106.

export const MSG = Object.freeze({
  REQUIRED: 'Este campo es obligatorio',
  POSITIVE: 'Solo se admiten valores mayores a 0',
  NOT_NEGATIVE: 'La cantidad no puede ser negativa',
  INVALID_NUMBER: 'Escribe un número válido, por ejemplo 1250,50',
  INTEGER: 'Escribe un número entero',
  DUPLICATE_PRODUCT: 'Ya existe un producto con ese nombre',
  DUPLICATE_SUPPLY: 'Ya existe un insumo con ese nombre',
  FUTURE_DATE: 'La fecha no puede ser futura',
  PAST_DELIVERY: 'La entrega no puede estar en el pasado',
  PHONE: 'El teléfono debe tener 8 dígitos',
  ADVANCE_OVER_TOTAL: 'El adelanto no puede superar el total del pedido',
  AT_LEAST_ONE_QUANTITY: 'Ingresa al menos una cantidad',
  STORAGE_UNAVAILABLE: 'No se puede guardar información en este navegador',
  SAVE_FAILED: 'No se pudo guardar. Intenta de nuevo.',
  UNIT_LOCKED: 'La unidad no se puede cambiar porque el insumo ya tiene compras o conteos',
  AT_LEAST_ONE_PRODUCT: 'Agrega al menos un producto',
});

/** "Usa máximo {n} decimales" (REQ-F-28). */
export const maxDecimals = (n) => `Usa máximo ${n} decimales`;

/** Venta o salida que supera lo disponible para vender (REQ-F-05, 12, 13). */
export const notAvailable = (quantity, productName) =>
  `Solo hay ${quantity} disponibles de ${productName}`;

/** Editar o eliminar producción que deja la existencia en negativo (REQ-F-04). */
export const notInStock = (quantity, productName) =>
  `Solo hay ${quantity} de ${productName} en existencia`;

/** Insumo que quedaría en negativo; verificación defensiva (REQ-F-11). */
export const supplyShort = (quantityText, unitLabel, supplyName) =>
  `Solo hay ${quantityText} ${unitLabel} de ${supplyName}`;

/** Faltante de un pedido, en su tarjeta y detalle (REQ-F-15). */
export const missingInOrder = (quantity, productName) =>
  `Faltan ${quantity} ${productName} por producir`;

/** Bloqueo al entregar un pedido con faltantes (REQ-F-17, D-066). */
export const missingForDelivery = (quantity, productName) =>
  `Faltan ${quantity} ${productName} por producir para este pedido`;

/** Faltante por producto en Inventario (REQ-F-06, D-077). */
export const missingInInventory = (quantity) => `Faltan ${quantity} por producir`;

/** Producto en pedidos pendientes que se intenta desactivar o eliminar (REQ-F-02, D-074). */
export const productInPendingOrders = (productName) =>
  `${productName} está en pedidos pendientes`;
