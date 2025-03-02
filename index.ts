interface VNode {
  type: string | Function
  key?: string | number
  props: { [key: string]: any }
  children?: VNode[]
  hooks?: LifecycleHooks
}

type DiffOperation =
  | { action: 'CREATE', node: VNode }
  | { action: 'REMOVE', node: VNode }
  | { action: 'REPLACE', old: VNode, new: VNode }
  | { action: 'UPDATE_ATTRIBUTE', key: string, value: any }
  | { action: 'UPDATE_TEXT', value: string }
  | { action: 'REMOVE_ATTRIBUTE', key: string }
  | { action: 'CHILD_UPDATE', index: number, changes: DiffOperation[] }

interface Update {
  payload: any
  callback?: () => void
}

interface UpdateQueue {
  updates: Update[]
}

interface RenderContext {
  dispatch: (msg: any) => void;
}

interface LifecycleHooks {
  onMount?: () => void | (() => void); // Return cleanup function if needed
  onUpdate?: (prevProps: any) => void;
  onUnmount?: () => void;
}

const cleanupFunctions = new Map<HTMLElement, () => void>();

// Add a WeakMap to store event handlers
const eventListeners = new WeakMap<HTMLElement, Record<string, EventListener>>();

function diff(oldNode: VNode | null, newNode: VNode | null): DiffOperation[] {
  if (oldNode === null) {
    return [{ action: 'CREATE', node: newNode! }];
  }
  if (newNode === null) {
    return [{ action: 'REMOVE', node: oldNode! }];
  }
  if (oldNode.type !== newNode.type) {
    return [{ action: 'REPLACE', old: oldNode, new: newNode }];
  }

  // Move the text element special case to the beginning of the function
  // This handles leaf text nodes cleanly
  if (oldNode.type === 'TEXT_ELEMENT' && newNode.type === 'TEXT_ELEMENT') {
    if (oldNode.props.nodeValue !== newNode.props.nodeValue) {
      return [{ action: 'UPDATE_TEXT', value: newNode.props.nodeValue }];
    }
    return [];
  }

  const changes: DiffOperation[] = [];

  // Diff attributes
  for (const key in newNode.props) {
    if (newNode.props.hasOwnProperty(key) && oldNode.props[key] !== newNode.props[key]) {
      changes.push({ action: "UPDATE_ATTRIBUTE", key, value: newNode.props[key] });
    }
  }
  for (const key in oldNode.props) {
    if (oldNode.props.hasOwnProperty(key) && !(key in newNode.props)) {
      changes.push({ action: "REMOVE_ATTRIBUTE", key });
    }
  }

  // Diff children
  const oldChildren = oldNode.children ?? [];
  const newChildren = newNode.children ?? [];

  const oldKeyedChildren = new Map<string | number, { node: VNode, index: number }>();
  oldChildren.forEach((child, index) => {
    if (child.key !== undefined) {
      oldKeyedChildren.set(child.key, { node: child, index });
    }
  });

  const usedOldNodes = new Set<number>();
  let pointer = 0;
  for (let newIndex = 0; newIndex < newChildren.length; newIndex++) {
    const newChild = newChildren[newIndex];
    let oldChild: VNode | null = null;

    if (newChild.key !== undefined) {
      // Try to find a matching keyed node.
      const oldEntry = oldKeyedChildren.get(newChild.key);
      if (oldEntry) {
        oldChild = oldEntry.node;
        usedOldNodes.add(oldEntry.index);
      }
    } else {
      // For non-keyed nodes, find the next unused node.
      while (pointer < oldChildren.length && usedOldNodes.has(pointer)) {
        pointer++;
      }
      if (pointer < oldChildren.length && oldChildren[pointer].key === undefined) {
        oldChild = oldChildren[pointer];
        usedOldNodes.add(pointer);
      }
      pointer++;
    }

    const childChanges = diff(oldChild, newChild);
    if (childChanges.length > 0) {
      changes.push({ action: "CHILD_UPDATE", index: newIndex, changes: childChanges });
    }
  }

  // Remove any old nodes that weren't used.
  // Iterate in reverse so removals don't affect subsequent indices.
  for (let oldIndex = oldChildren.length - 1; oldIndex >= 0; oldIndex--) {
    if (!usedOldNodes.has(oldIndex)) {
      changes.push({
        action: "CHILD_UPDATE",
        index: oldIndex,
        changes: [{ action: "REMOVE", node: oldChildren[oldIndex] }]
      });
    }
  }

  return changes;
}

function createElement(vnode: VNode, context: RenderContext): HTMLElement | Text {
  if (typeof vnode.type === 'string' && vnode.type === 'TEXT_ELEMENT') {
    return document.createTextNode(vnode.props.nodeValue || '');
  }

  if (typeof vnode.type === 'string') {
    const element = document.createElement(vnode.type);
    const elementEventListeners: Record<string, EventListener> = {};

    for (const [key, value] of Object.entries(vnode.props)) {
      if (key === 'children' || key === 'key') continue;
      if (key.startsWith('on') && typeof value === 'function') {
        const eventName = key.substring(2).toLowerCase();
        const listener = (e: Event) => value(e, context);
        element.addEventListener(eventName, listener);
        elementEventListeners[eventName] = listener;
      } else {
        element.setAttribute(key, String(value));
      }
    }

    if (Object.keys(elementEventListeners).length > 0) {
      eventListeners.set(element, elementEventListeners);
    }

    const children = vnode.children || [];
    children.forEach(child => {
      element.appendChild(createElement(child, context));
    });

    if (vnode.hooks?.onMount) {
      setTimeout(() => {
        const cleanup = vnode.hooks?.onMount?.();
        if (cleanup) {
          cleanupFunctions.set(element, cleanup);
        }
      }, 0);
    }

    return element;
  }

  if (typeof vnode.type === 'function') {
    const componentVNode = (vnode.type as Function)(vnode.props, context);
    // Merge hooks from component declaration with hooks from the VNode
    if (vnode.hooks) {
      componentVNode.hooks = {
        ...componentVNode.hooks,
        ...vnode.hooks
      };
    }
    return createElement(componentVNode, context);
  }

  throw new Error('Unknown node type');
}

function applyDiff(parent: HTMLElement, changes: DiffOperation[], context: RenderContext, index: number = 0): void {
  for (const change of changes) {
    switch (change.action) {
      case 'CREATE': {
        const newElement = createElement(change.node, context);
        if (parent.childNodes[index]) {
          parent.insertBefore(newElement, parent.childNodes[index]);
        } else {
          parent.appendChild(newElement);
        }
        break;
      }
      case 'REMOVE': {
        const element = parent.childNodes[index] as HTMLElement;
        if (element) {
          // Cleanup event listeners
          if (element instanceof HTMLElement && eventListeners.has(element)) {
            const listeners = eventListeners.get(element)!;
            for (const [eventName, listener] of Object.entries(listeners)) {
              element.removeEventListener(eventName, listener);
            }
            eventListeners.delete(element);
          }

          // Run cleanup functions
          if (element instanceof HTMLElement && cleanupFunctions.has(element)) {
            cleanupFunctions.get(element)!();
            cleanupFunctions.delete(element);
          }

          // Run onUnmount hook
          if (change.node.hooks?.onUnmount) {
            change.node.hooks.onUnmount();
          }

          parent.removeChild(element);
        }
        break;
      }
      case 'REPLACE': {
        const oldElement = parent.childNodes[index] as HTMLElement;
        if (oldElement) {
          // Cleanup event listeners and hooks
          if (oldElement instanceof HTMLElement && eventListeners.has(oldElement)) {
            const listeners = eventListeners.get(oldElement)!;
            for (const [eventName, listener] of Object.entries(listeners)) {
              oldElement.removeEventListener(eventName, listener);
            }
            eventListeners.delete(oldElement);
          }

          if (oldElement instanceof HTMLElement && cleanupFunctions.has(oldElement)) {
            cleanupFunctions.get(oldElement)!();
            cleanupFunctions.delete(oldElement);
          }

          if (change.old.hooks?.onUnmount) {
            change.old.hooks.onUnmount();
          }

          const newElement = createElement(change.new, context);
          parent.replaceChild(newElement, oldElement);
        }
        break;
      }
      case 'UPDATE_ATTRIBUTE': {
        const element = parent.childNodes[index];
        if (element && element.nodeType === Node.ELEMENT_NODE) {
          const htmlElement = element as HTMLElement;
          if (change.key.startsWith('on') && typeof change.value === 'function') {
            const eventName = change.key.substring(2).toLowerCase();
            let oldListeners = eventListeners.get(htmlElement) || {};

            // Remove old listener if it exists
            if (oldListeners[eventName]) {
              htmlElement.removeEventListener(eventName, oldListeners[eventName]);
            }

            // Add new listener
            const listener = (e: Event) => change.value(e, context);
            htmlElement.addEventListener(eventName, listener);

            // Update listeners map
            oldListeners[eventName] = listener;
            eventListeners.set(htmlElement, oldListeners);
          } else {
            htmlElement.setAttribute(change.key, String(change.value));
          }
        }
        break;
      }
      case 'REMOVE_ATTRIBUTE': {
        const element = parent.childNodes[index];
        if (element && element.nodeType === Node.ELEMENT_NODE) {
          (element as HTMLElement).removeAttribute(change.key);
        }
        break;
      }
      case 'UPDATE_TEXT': {
        const node = parent.childNodes[index];
        if (node && node.nodeType === Node.TEXT_NODE) {
          node.nodeValue = change.value;
        }
        break;
      }
      case 'CHILD_UPDATE': {
        const childElement = parent.childNodes[change.index];
        if (childElement) {
          if (change.changes.length === 1) {
            const childChange = change.changes[0];

            // Special handling for text node updates
            if (childChange.action === 'UPDATE_TEXT' && childElement.nodeType === Node.TEXT_NODE) {
              childElement.nodeValue = childChange.value;
            }
            // For CREATE/REMOVE/REPLACE of elements (not text)
            else if (['CREATE', 'REMOVE', 'REPLACE'].includes(childChange.action)) {
              applyDiff(parent, [childChange], context, change.index);
            }
            // Other operations like attribute updates
            else {
              applyDiff(childElement as HTMLElement, change.changes, context);
            }
          } else {
            // Multiple operations on the child
            applyDiff(childElement as HTMLElement, change.changes, context);
          }
        }
        break;
      }
    }
  }
}

function h(
  type: string | Function,
  props: { [key: string]: any } = {},
  ...children: (VNode | string | number | boolean | null | undefined | (VNode | string | number | boolean | null | undefined)[])[]
): VNode {
  const processedChildren = children
    .flat(Infinity) // Recursively flatten nested arrays
    .filter(child => child !== null && child !== undefined && child !== false)
    .map(child => {
      if (typeof child === 'string' || typeof child === 'number' || typeof child === 'boolean') {
        // Create a simple TEXT_ELEMENT again
        return {
          type: 'TEXT_ELEMENT',
          props: { nodeValue: String(child) },
          children: []
        };
      }
      return child as VNode;
    });

  return {
    type,
    key: props.key, // preserve key if provided
    props: { ...props },
    children: processedChildren
  };
}


function createApp<Model, Msg>(config: {
  init: () => Model;
  update: (msg: Msg, model: Model) => Model;
  view: (model: Model, dispatch: (msg: Msg) => void) => VNode;
  root: HTMLElement;
}) {
  let currentModel = config.init();
  let currentVNode: VNode | null = null;

  function dispatch(msg: Msg) {
    currentModel = config.update(msg, currentModel);
    render();
  }

  const context: RenderContext = { dispatch };

  function render() {
    const newVNode = config.view(currentModel, dispatch);
    if (currentVNode === null) {
      const changes = diff(null, newVNode);
      applyDiff(config.root, changes, context);
    } else {
      const changes = diff(currentVNode, newVNode);
      applyDiff(config.root, changes, context);
    }
    currentVNode = newVNode;
  }

  render();

  return {
    getModel: () => currentModel,
    render
  };
}

// Example usage
type CounterModel = { count: number };
type CounterMsg =
  | { type: 'INCREMENT' }
  | { type: 'DECREMENT' };

function Button(props: { label: string; onClick: () => void }) {
  return h('button', {
    onClick: (e: Event) => {
      props.onClick();
    }
  }, props.label);
}

document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.body;

  const app = createApp<CounterModel, CounterMsg>({
    root: rootElement,
    init: () => ({ count: 0 }),
    update: (msg, model) => {
      switch (msg.type) {
        case 'INCREMENT':
          return { ...model, count: model.count + 1 };
        case 'DECREMENT':
          return { ...model, count: model.count - 1 };
        default:
          return model;
      }
    },
    view: (model, dispatch) => {
      return h('div', { class: 'counter' }, [
        h('h1', {}, `Count: ${model.count}`),
        h('div', { class: 'buttons' }, [
          Button({
            label: 'Increment',
            onClick: () => dispatch({ type: 'INCREMENT' })
          }),
          Button({
            label: 'Decrement',
            onClick: () => dispatch({ type: 'DECREMENT' })
          })
        ]),
      ]);
    }
  });
});