export interface VNode {
  type: string | Function;
  props: { [key: string]: any };
  children: (VNode | string)[];
  domRef?: HTMLElement | Text;
  eventCache?: { [eventName: string]: EventListenerOrEventListenerObject };
}

export type DiffOperation =
  | { action: 'CREATE', node: VNode }
  | { action: 'REMOVE', node: VNode }
  | { action: 'REPLACE', old: VNode, new: VNode }
  | { action: 'UPDATE', old: VNode, new: VNode };

export function h(type: string | Function, props: { [key: string]: any } = {}, children: VNode | string | (VNode | string)[] = []): VNode {
  const childrenArray = Array.isArray(children) ? children : [children];
  return { type, props, children: childrenArray };
}

function isComponent(vnode: VNode): boolean {
  return typeof vnode.type === 'function';
}

function shallowEqual(obj1: { [key: string]: any }, obj2: { [key: string]: any }): boolean {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  return keys1.every(key => {
    if (key.startsWith('on')) return true;
    return obj1[key] === obj2[key];
  });
}

export function diff(oldNode: VNode | null, newNode: VNode | null): DiffOperation[] {
  if (!oldNode) return [{ action: 'CREATE', node: newNode! }];
  if (!newNode) return [{ action: 'REMOVE', node: oldNode }];

  if (typeof oldNode.type === 'function' && typeof newNode.type === 'function') {
    newNode.domRef = oldNode.domRef;
    newNode.eventCache = oldNode.eventCache || {};
    return [];
  }

  if (oldNode.type !== newNode.type) {
    return [{ action: 'REPLACE', old: oldNode, new: newNode }];
  }

  if (areNodesEqual(oldNode, newNode)) {
    newNode.domRef = oldNode.domRef;
    newNode.eventCache = oldNode.eventCache || {};
    return [];
  }

  return [{ action: 'UPDATE', old: oldNode, new: newNode }];
}

function areNodesEqual(a: VNode, b: VNode): boolean {
  if (a.type !== b.type) return false;

  const aProps = Object.entries(a.props).filter(([key]) => !key.startsWith('on'));
  const bProps = Object.entries(b.props).filter(([key]) => !key.startsWith('on'));

  if (aProps.length !== bProps.length) return false;

  for (const [key, value] of aProps) {
    if (key === 'key' || key === 'componentKey') continue;
    if (value !== b.props[key]) return false;
  }

  if (a.children.length !== b.children.length) return false;

  for (let i = 0; i < a.children.length; i++) {
    const aChild = a.children[i];
    const bChild = b.children[i];

    if (typeof aChild !== typeof bChild) return false;

    if (typeof aChild === 'string' && typeof bChild === 'string') {
      if (aChild !== bChild) return false;
    } else if (typeof aChild !== 'string' && typeof bChild !== 'string') {
      if (!areNodesEqual(aChild, bChild)) return false;
    }
  }

  return true;
}

export function createElement(vnode: VNode): HTMLElement | Text {
  if (typeof vnode === 'string' || vnode.type === 'TEXT') {
    const content = typeof vnode === 'string' ? vnode : String(vnode.children[0]);
    const textNode = document.createTextNode(content);
    if (typeof vnode !== 'string') vnode.domRef = textNode;
    return textNode;
  }

  if (typeof vnode.type === 'string') {
    const element = document.createElement(vnode.type);
    vnode.domRef = element;
    vnode.eventCache = {};

    Object.entries(vnode.props).forEach(([key, value]) => {
      if (key.startsWith('on')) return;

      if (key === 'className') {
        element.className = value;
      } else if (key === 'style' && typeof value === 'string') {
        element.setAttribute('style', value);
      } else if (key !== 'key' && key !== 'componentKey') {
        element.setAttribute(key, value);
      }
    });

    Object.entries(vnode.props)
      .filter(([key]) => key.startsWith('on') && typeof vnode.props[key] === 'function')
      .forEach(([key, handler]) => {
        const eventName = key.slice(2).toLowerCase();
        element.addEventListener(eventName, handler as EventListener);
        vnode.eventCache![eventName] = handler as EventListener;
      });

    vnode.children.forEach(child => {
      element.appendChild(
        typeof child === 'string'
          ? document.createTextNode(child)
          : createElement(child)
      );
    });

    return element;
  }

  if (typeof vnode.type === 'function') {
    const childVNode = vnode.type(vnode.props);
    const element = createElement(childVNode);
    vnode.domRef = element;
    return element;
  }

  throw new Error(`Unknown node type: ${vnode.type}`);
}

export function applyDiff(parent: HTMLElement, operations: DiffOperation[]): void {
  operations.forEach(op => {
    if (op.action === 'CREATE') {
      parent.appendChild(createElement(op.node));
    }
    else if (op.action === 'REMOVE') {
      if (op.node.domRef && op.node.domRef.parentNode === parent) {
        cleanupEventHandlers(op.node);
        parent.removeChild(op.node.domRef);
      }
    }
    else if (op.action === 'REPLACE') {
      if (op.old.domRef && op.old.domRef.parentNode === parent) {
        cleanupEventHandlers(op.old);
        const newElement = createElement(op.new);
        parent.replaceChild(newElement, op.old.domRef);
      }
    }
    else if (op.action === 'UPDATE') {
      updateElement(op.old.domRef as HTMLElement, op.old, op.new);
    }
  });
}

function cleanupEventHandlers(vnode: VNode): void {
  if (!vnode.domRef || !vnode.eventCache) return;

  Object.entries(vnode.eventCache).forEach(([eventName, handler]) => {
    vnode.domRef!.removeEventListener(eventName, handler);
  });

  vnode.children.forEach(child => {
    if (typeof child !== 'string') {
      cleanupEventHandlers(child);
    }
  });
}

function updateElement(element: HTMLElement, oldVNode: VNode, newVNode: VNode): void {
  newVNode.domRef = element;
  newVNode.eventCache = oldVNode.eventCache || {};

  updateProps(element, oldVNode.props, newVNode.props, newVNode.eventCache);
  updateChildrenEfficiently(element, oldVNode.children, newVNode.children);
}

function updateProps(
  element: HTMLElement,
  oldProps: { [key: string]: any },
  newProps: { [key: string]: any },
  eventCache: { [key: string]: EventListenerOrEventListenerObject }
): void {
  Object.keys(oldProps).forEach(key => {
    if (key.startsWith('on')) return;
    if (!(key in newProps) && key !== 'key' && key !== 'componentKey') {
      if (key === 'className') {
        element.className = '';
      } else {
        element.removeAttribute(key);
      }
    }
  });

  Object.entries(newProps).forEach(([key, value]) => {
    if (key.startsWith('on')) return;

    if (oldProps[key] === value) return;

    if (key === 'className') {
      element.className = value;
    } else if (key === 'value' && (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
      if (element.value !== value) {
        const isActive = document.activeElement === element;
        const start = isActive ? element.selectionStart : null;
        const end = isActive ? element.selectionEnd : null;

        element.value = value;

        if (isActive && start !== null && end !== null) {
          element.setSelectionRange(start, end);
        }
      }
    } else if (key === 'style' && typeof value === 'string') {
      element.setAttribute('style', value);
    } else if (key !== 'key' && key !== 'componentKey') {
      element.setAttribute(key, value);
    }
  });

  Object.keys(eventCache).forEach(eventName => {
    const propName = 'on' + eventName.charAt(0).toUpperCase() + eventName.slice(1);
    if (!(propName in newProps)) {
      element.removeEventListener(eventName, eventCache[eventName]);
      delete eventCache[eventName];
    }
  });

  Object.entries(newProps)
    .filter(([key]) => key.startsWith('on') && typeof newProps[key] === 'function')
    .forEach(([key, handler]) => {
      const eventName = key.slice(2).toLowerCase();
      const oldHandler = eventCache[eventName];

      if (oldHandler !== handler) {
        if (oldHandler) {
          element.removeEventListener(eventName, oldHandler);
        }

        element.addEventListener(eventName, handler as EventListener);
        eventCache[eventName] = handler as EventListener;
      }
    });
}

function updateChildrenEfficiently(
  parent: HTMLElement,
  oldChildren: (VNode | string)[],
  newChildren: (VNode | string)[]
): void {
  const domChildren = Array.from(parent.childNodes);

  if (oldChildren.length === 0 && newChildren.length === 0) return;

  const oldKeyMap = new Map();
  const newKeyMap = new Map();

  const handledDomIndices = new Set<number>();

  oldChildren.forEach((child, i) => {
    if (typeof child !== 'string' && child.props.key) {
      oldKeyMap.set(child.props.key, { node: child, index: i });
    }
  });

  newChildren.forEach((child, i) => {
    if (typeof child !== 'string' && child.props.key) {
      newKeyMap.set(child.props.key, { node: child, index: i });
    }
  });

  for (let i = oldChildren.length - 1; i >= 0; i--) {
    const oldChild = oldChildren[i];

    if (typeof oldChild === 'string' || !oldChild.props.key) continue;

    if (!newKeyMap.has(oldChild.props.key)) {
      if (i < domChildren.length) {
        if (typeof oldChild !== 'string') {
          cleanupEventHandlers(oldChild);
        }
        parent.removeChild(domChildren[i]);

        domChildren.splice(i, 1);
      }
    }
  }

  for (let i = 0; i < newChildren.length; i++) {
    const newChild = newChildren[i];

    if (typeof newChild !== 'string' && newChild.props.key) {
      if (oldKeyMap.has(newChild.props.key)) {
        const { node: oldChild, index: oldIndex } = oldKeyMap.get(newChild.props.key);

        if (oldIndex < domChildren.length) {
          updateElement(domChildren[oldIndex] as HTMLElement, oldChild, newChild);
          handledDomIndices.add(oldIndex);
        } else {
          const newElement = createElement(newChild);

          if (i < domChildren.length) {
            parent.insertBefore(newElement, domChildren[i]);
          } else {
            parent.appendChild(newElement);
          }
        }
      } else {
        const newElement = createElement(newChild);

        if (i < domChildren.length) {
          parent.insertBefore(newElement, domChildren[i]);
        } else {
          parent.appendChild(newElement);
        }
      }
    } else {
      const isStringNewChild = typeof newChild === 'string';

      if (i < domChildren.length) {
        const domNode = domChildren[i];
        const oldChild = i < oldChildren.length ? oldChildren[i] : null;

        if (handledDomIndices.has(i)) {
          const newNode = isStringNewChild
            ? document.createTextNode(newChild)
            : createElement(newChild);

          parent.insertBefore(newNode, domNode);
        } else if (isStringNewChild) {
          if (typeof oldChild === 'string') {
            if (oldChild !== newChild) {
              domNode.textContent = newChild;
            }
          } else {
            const textNode = document.createTextNode(newChild);
            parent.replaceChild(textNode, domNode);
          }
        } else if (typeof newChild !== 'string' && typeof oldChild !== 'string') {
          updateElement(domNode as HTMLElement, oldChild, newChild);
        } else {
          const elementNode = createElement(newChild as VNode);
          parent.replaceChild(elementNode, domNode);
        }
      } else {
        const newNode = isStringNewChild
          ? document.createTextNode(newChild)
          : createElement(newChild as VNode);

        parent.appendChild(newNode);
      }
    }
  }

  const currentDomChildren = Array.from(parent.childNodes);
  if (currentDomChildren.length > newChildren.length) {
    for (let i = currentDomChildren.length - 1; i >= newChildren.length; i--) {
      parent.removeChild(currentDomChildren[i]);
    }
  }
}

const componentStates = new Map<string, any>();
const componentUpdates = new Map<string, (msg: any, model: any) => any>();
let globalRender: (() => void) | null = null;
let renderPending = false;

export function createApp(rootElement: HTMLElement, view: () => VNode): void {
  let currentVNode: VNode | null = null;

  function render() {
    if (renderPending) return;
    renderPending = true;

    requestAnimationFrame(() => {
      const newVNode = view();

      if (!currentVNode) {
        rootElement.appendChild(createElement(newVNode));
      } else {
        const operations = diff(currentVNode, newVNode);
        applyDiff(rootElement, operations);
      }

      currentVNode = newVNode;
      renderPending = false;
    });
  }

  globalRender = render;
  render();
}

export function component<Model, Msg>(
  componentType: string,
  init: () => Model,
  update: (msg: Msg, model: Model) => Model,
  view: (model: Model, dispatch: (msg: Msg) => void) => VNode
): (props: { key: string }) => VNode {
  componentUpdates.set(componentType, update as (msg: any, model: any) => any);

  return function Component(props: { key: string }): VNode {
    const componentKey = props.key;

    if (!componentStates.has(componentKey)) {
      componentStates.set(componentKey, init());
    }

    const model = componentStates.get(componentKey)!;

    const dispatch = (msg: Msg) => {
      const updateFn = componentUpdates.get(componentType)!;
      const oldModel = model;
      const newModel = updateFn(msg, oldModel);

      if (JSON.stringify(oldModel) !== JSON.stringify(newModel)) {
        componentStates.set(componentKey, { ...newModel });

        const activeElement = document.activeElement;

        if (globalRender) globalRender();

        if (activeElement && document.contains(activeElement)) {
          (activeElement as HTMLElement).focus();
        }
      }
    };

    const rendered = view(model, dispatch);

    rendered.props = {
      ...rendered.props,
      componentKey,
      key: rendered.props.key || componentKey
    };

    return rendered;
  };
}