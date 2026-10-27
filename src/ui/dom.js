// Ayudas mínimas para construir el DOM sin framework (R3).

/**
 * Crea un elemento.
 * @param {string} tag
 * @param {object} [attrs] atributos; `class`, `text`, `on{Evento}` y `dataset` tienen trato especial
 * @param {...(Node|string|null|false|Array)} children
 */
export function h(tag, attrs = {}, ...children) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') element.className = value;
    else if (key === 'text') element.textContent = value;
    else if (key === 'dataset') Object.assign(element.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') {
      element.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (value === true) element.setAttribute(key, '');
    else element.setAttribute(key, String(value));
  }
  append(element, children);
  return element;
}

/** Agrega hijos (ignora null, false y undefined; aplana listas). */
export function append(parent, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    parent.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return parent;
}

/** Vacía un contenedor y le pone nuevos hijos. */
export function replaceChildren(parent, ...children) {
  parent.replaceChildren();
  return append(parent, children);
}
