/** Tiny DOM builder. Every string becomes a text node, so lead data can never inject markup. */

export type Child = Node | string | null | undefined | false;
export type Attrs = Record<string, string | boolean | undefined>;

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (value === undefined || value === false) continue;
    node.setAttribute(name, value === true ? '' : value);
  }
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    node.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

/** Replaces the children of `parent`. */
export function fill(parent: Element, ...children: Child[]): void {
  parent.replaceChildren(...children.filter((c): c is Node | string => c !== null && c !== undefined && c !== false));
}
