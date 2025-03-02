// Virtual DOM types
interface VNode {
  type: string | Function;
  props: { [key: string]: any };
  children: (VNode | string)[];
}

type DiffOperation =
  | { action: 'CREATE', node: VNode }
  | { action: 'REMOVE', node: VNode }
  | { action: 'REPLACE', old: VNode, new: VNode }
  | { action: 'UPDATE_ATTRIBUTE', key: string, value: any }
  | { action: 'REMOVE_ATTRIBUTE', key: string }
  | { action: 'CHILD_UPDATE', index: number, changes: DiffOperation[] };

// Hyperscript function to create VNodes
function h(type: string | Function, props: { [key: string]: any } = {}, children: VNode | string | (VNode | string)[] = []): VNode {
  // Convert single child to array for consistent handling
  const childrenArray = Array.isArray(children) ? children : [children];
  return { type, props, children: childrenArray };
}

// Simple diff function (minimal for demonstration)
function diff(oldNode: VNode | null, newNode: VNode | null): DiffOperation[] {
  if (!oldNode) return [{ action: 'CREATE', node: newNode! }];
  if (!newNode) return [{ action: 'REMOVE', node: oldNode }];
  if (oldNode.type !== newNode.type) return [{ action: 'REPLACE', old: oldNode, new: newNode }];

  // For simplicity, we'll just replace the entire node
  return [{ action: 'REPLACE', old: oldNode, new: newNode }];
}

// Render function to create DOM elements
function createElement(vnode: VNode): HTMLElement | Text {
  if (typeof vnode.type === 'string') {
    const element = document.createElement(vnode.type);

    // Set attributes and event listeners
    for (const [key, value] of Object.entries(vnode.props)) {
      if (key.startsWith('on') && typeof value === 'function') {
        const eventName = key.slice(2).toLowerCase();
        element.addEventListener(eventName, value);
      } else {
        element.setAttribute(key, value);
      }
    }

    // Append children
    vnode.children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else {
        element.appendChild(createElement(child));
      }
    });

    return element;
  }

  if (typeof vnode.type === 'function') {
    const childVNode = vnode.type(vnode.props);
    return createElement(childVNode);
  }

  throw new Error('Unknown node type');
}

// Apply diff operations (minimal for demonstration)
function applyDiff(parent: HTMLElement, changes: DiffOperation[]): void {
  changes.forEach(change => {
    if (change.action === 'CREATE') {
      parent.appendChild(createElement(change.node));
    } else if (change.action === 'REMOVE') {
      parent.removeChild(parent.lastChild!);
    } else if (change.action === 'REPLACE') {
      parent.replaceChild(createElement(change.new), parent.lastChild!);
    }
  });
}

// Component system
const componentStates = new Map<string, any>();
const componentUpdates = new Map<string, (msg: any, model: any) => any>();
let globalRender: () => void;

function component<Model, Msg>(
  componentType: string,
  init: () => Model,
  update: (msg: Msg, model: Model) => Model,
  view: (model: Model, dispatch: (msg: Msg) => void) => VNode
): (props: { key: string }) => VNode {
  componentUpdates.set(componentType, update as (msg: any, model: any) => any);
  return function Component(props: { key: string }): VNode {
    if (!componentStates.has(props.key)) {
      componentStates.set(props.key, init());
    }
    const model = componentStates.get(props.key)!;
    const dispatch = (msg: Msg) => {
      const updateFn = componentUpdates.get(componentType)!;
      const newModel = updateFn(msg, model);
      componentStates.set(props.key, newModel);
      if (globalRender) globalRender();
    };
    return view(model, dispatch);
  };
}

// Button component
type ButtonModel = { clicks: number };
type ButtonMsg = { type: 'CLICK' };

const Button = component<ButtonModel, ButtonMsg>(
  'BUTTON',
  () => ({ clicks: 0 }),
  (msg, model) => {
    switch (msg.type) {
      case 'CLICK': return { ...model, clicks: model.clicks + 1 };
      default: return model;
    }
  },
  (model, dispatch) => h('button', {
    onClick: () => dispatch({ type: 'CLICK' })
  }, `Clicked ${model.clicks} times`)
);

// Counter component
type CounterModel = { count: number };
type CounterMsg = { type: 'INCREMENT' } | { type: 'DECREMENT' };

const Counter = component<CounterModel, CounterMsg>(
  'COUNTER',
  () => ({ count: 0 }),
  (msg, model) => {
    switch (msg.type) {
      case 'INCREMENT': return { ...model, count: model.count + 1 };
      case 'DECREMENT': return { ...model, count: model.count - 1 };
      default: return model;
    }
  },
  (model, dispatch) => h('div', {}, [
    h('button', { onClick: () => dispatch({ type: 'DECREMENT' }) }, '-'),
    h('span', {}, ` ${model.count} `),
    h('button', { onClick: () => dispatch({ type: 'INCREMENT' }) }, '+')
  ])
);


function createApp(root: HTMLElement) {
  let currentVNode: VNode | null = null;

  function render() {
    const newVNode = appView();
    if (!currentVNode) {
      root.appendChild(createElement(newVNode));
    } else {
      const changes = diff(currentVNode, newVNode);
      applyDiff(root, changes);
    }
    currentVNode = newVNode;
  }

  function appView(): VNode {
    return h('div', {}, [
      h('h1', {}, 'Component Examples'),
      Button({ key: 'button1' }),
      Button({ key: 'button2' }),
      Counter({ key: 'counter1' })
    ]);
  }

  globalRender = render;
  render();
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('app') || document.body;
  createApp(root);
});