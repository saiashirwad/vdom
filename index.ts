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

// Debug function to help trace rendering issues
function debugLog(message: string, ...args: any[]) {
  console.log(`[DEBUG] ${message}`, ...args);
}

function diff(oldNode: VNode | null, newNode: VNode | null): DiffOperation[] {
  debugLog('Diffing nodes:', { oldNode, newNode });

  if (oldNode === null) {
    debugLog('Old node is null, creating new node');
    return [{ action: 'CREATE', node: newNode! }];
  }
  if (newNode === null) {
    debugLog('New node is null, removing old node');
    return [{ action: 'REMOVE', node: oldNode! }];
  }
  if (oldNode.type !== newNode.type) {
    debugLog('Node types differ, replacing node');
    return [{ action: 'REPLACE', old: oldNode, new: newNode }];
  }

  // Move the text element special case to the beginning of the function
  // This handles leaf text nodes cleanly
  if (oldNode.type === 'TEXT_ELEMENT' && newNode.type === 'TEXT_ELEMENT') {
    if (oldNode.props.nodeValue !== newNode.props.nodeValue) {
      debugLog('Text content changed from', oldNode.props.nodeValue, 'to', newNode.props.nodeValue);
      return [{ action: 'UPDATE_TEXT', value: newNode.props.nodeValue }];
    }
    return [];
  }

  const changes: DiffOperation[] = [];

  // Diff attributes
  for (const key in newNode.props) {
    // Skip children property - we handle that separately
    if (key === 'children') continue;

    // Use strict equality for event handlers instead of JSON.stringify
    if (key.startsWith('on') && typeof newNode.props[key] === 'function') {
      // Always update event handlers - functions cannot be reliably compared
      changes.push({ action: "UPDATE_ATTRIBUTE", key, value: newNode.props[key] });
    }
    // For other props use JSON.stringify for deep comparison
    else if (newNode.props.hasOwnProperty(key) &&
      JSON.stringify(oldNode.props[key]) !== JSON.stringify(newNode.props[key])) {
      debugLog(`Attribute changed: ${key} from`, oldNode.props[key], 'to', newNode.props[key]);
      changes.push({ action: "UPDATE_ATTRIBUTE", key, value: newNode.props[key] });
    }
  }

  for (const key in oldNode.props) {
    if (key !== 'children' && oldNode.props.hasOwnProperty(key) && !(key in newNode.props)) {
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

  // Fix for child diffing - more verbose but clearer
  for (let newIndex = 0; newIndex < newChildren.length; newIndex++) {
    const newChild = newChildren[newIndex];
    let oldChild: VNode | null = null;
    let oldChildIndex = -1;

    if (newChild.key !== undefined) {
      // Try to find a matching keyed node.
      const oldEntry = oldKeyedChildren.get(newChild.key);
      if (oldEntry) {
        oldChild = oldEntry.node;
        oldChildIndex = oldEntry.index;
        usedOldNodes.add(oldEntry.index);
      }
    } else {
      // For non-keyed nodes, find the next unused node.
      while (pointer < oldChildren.length && usedOldNodes.has(pointer)) {
        pointer++;
      }
      if (pointer < oldChildren.length && oldChildren[pointer].key === undefined) {
        oldChild = oldChildren[pointer];
        oldChildIndex = pointer;
        usedOldNodes.add(pointer);
        pointer++;
      }
    }

    const childChanges = diff(oldChild, newChild);
    if (childChanges.length > 0) {
      debugLog(`Child update at index ${newIndex}, changes:`, childChanges);
      changes.push({ action: "CHILD_UPDATE", index: newIndex, changes: childChanges });
    }
  }

  // Remove any old nodes that weren't used.
  // Iterate in reverse so removals don't affect subsequent indices.
  for (let oldIndex = oldChildren.length - 1; oldIndex >= 0; oldIndex--) {
    if (!usedOldNodes.has(oldIndex)) {
      debugLog(`Removing unused child at index ${oldIndex}`);
      changes.push({
        action: "CHILD_UPDATE",
        index: oldIndex,
        changes: [{ action: "REMOVE", node: oldChildren[oldIndex] }]
      });
    }
  }

  // Add logging before returning changes
  debugLog('Computed changes:', changes);
  return changes;
}

function createElement(vnode: VNode, context: RenderContext): HTMLElement | Text {
  debugLog('Creating element for vnode:', vnode);

  if (typeof vnode.type === 'string' && vnode.type === 'TEXT_ELEMENT') {
    debugLog('Creating text node with content:', vnode.props.nodeValue);
    return document.createTextNode(vnode.props.nodeValue || '');
  }

  if (typeof vnode.type === 'string') {
    debugLog('Creating element with tag:', vnode.type);
    const element = document.createElement(vnode.type);
    const elementEventListeners: Record<string, EventListener> = {};

    for (const [key, value] of Object.entries(vnode.props)) {
      if (key === 'children' || key === 'key') continue;
      if (key.startsWith('on') && typeof value === 'function') {
        const eventName = key.substring(2).toLowerCase();
        debugLog(`Adding event listener: ${eventName} to element`, element);
        const listener = (e: Event) => {
          debugLog(`Event ${eventName} triggered`);
          value(e, context);
        };
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
    debugLog('Creating component:', vnode.type.name || 'anonymous');
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

function applyDiff(parent: HTMLElement | Node, changes: DiffOperation[], context: RenderContext, index: number = 0): void {
  debugLog('Applying diff to parent:', parent);
  debugLog('Changes to apply:', changes);
  debugLog('Current index:', index);

  for (const change of changes) {
    debugLog('Processing change:', change);

    switch (change.action) {
      case 'CREATE': {
        debugLog('Creating new element');
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
          debugLog('Removing element:', element);

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
          debugLog('Replacing element:', oldElement);

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
        debugLog('Updating attribute on element:', element, 'key:', change.key, 'value:', change.value);

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
          }
          // Special handling for input values
          else if (change.key === 'value' && htmlElement instanceof HTMLInputElement) {
            htmlElement.value = String(change.value);
          }
          // Special handling for style objects
          else if (change.key === 'style' && typeof change.value === 'object') {
            Object.assign(htmlElement.style, change.value);
          }
          // All other attributes
          else {
            htmlElement.setAttribute(change.key, String(change.value));
          }
        }
        break;
      }
      case 'REMOVE_ATTRIBUTE': {
        const element = parent.childNodes[index];
        if (element && element.nodeType === Node.ELEMENT_NODE) {
          debugLog('Removing attribute:', change.key);
          (element as HTMLElement).removeAttribute(change.key);
        }
        break;
      }
      case 'UPDATE_TEXT': {
        const node = parent.childNodes[index];
        debugLog('Updating text node:', node, 'to value:', change.value);
        if (node && node.nodeType === Node.TEXT_NODE) {
          node.nodeValue = change.value;
        }
        break;
      }
      case 'CHILD_UPDATE': {
        // Fix: Make sure we find the right child node index
        let childElement = null;

        // Get the actual child at this index
        if (change.index < parent.childNodes.length) {
          childElement = parent.childNodes[change.index];
        }

        debugLog('Updating child at index:', change.index, 'child:', childElement);

        if (childElement) {
          // Important fix: Handle direct text updates properly
          if (change.changes.length === 1 && change.changes[0].action === 'UPDATE_TEXT') {
            if (childElement.nodeType === Node.TEXT_NODE) {
              // Direct update of text node
              childElement.nodeValue = change.changes[0].value;
            } else {
              // The element might contain a text node as its first child
              const textNodes = Array.from(childElement.childNodes)
                .filter(node => node.nodeType === Node.TEXT_NODE);

              if (textNodes.length > 0) {
                textNodes[0].nodeValue = change.changes[0].value;
              } else {
                // If no text node exists, we should create one
                const textNode = document.createTextNode(change.changes[0].value);
                childElement.appendChild(textNode);
              }
            }
          } else {
            // Multiple operations on the child
            applyDiff(childElement, change.changes, context);
          }
        } else {
          // The child doesn't exist yet, likely needs to be created
          // This is a common case for initial rendering of new elements
          for (const childChange of change.changes) {
            if (childChange.action === 'CREATE') {
              const newElement = createElement(childChange.node, context);
              parent.appendChild(newElement);
            }
          }
        }
        break;
      }
    }
  }

  debugLog('Finished applying changes');
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

  // Separate key from props
  const { key, ...restProps } = props;

  return {
    type,
    key: key, // preserve key if provided
    props: { ...restProps },
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
  let renderScheduled = false;

  function dispatch(msg: Msg) {
    debugLog('Dispatch called with message:', msg);
    const newModel = config.update(msg, currentModel);
    debugLog('Model updated:', newModel);

    // Only update if model has actually changed
    if (newModel !== currentModel) {
      currentModel = newModel;
      scheduleRender();
    } else {
      debugLog('Model unchanged, not re-rendering');
    }
  }

  // Use requestAnimationFrame to batch renders
  function scheduleRender() {
    if (!renderScheduled) {
      renderScheduled = true;
      requestAnimationFrame(() => {
        render();
        renderScheduled = false;
      });
    }
  }

  const context: RenderContext = { dispatch };

  function render() {
    debugLog('Render called');
    const newVNode = config.view(currentModel, dispatch);
    debugLog('New VNode:', newVNode);

    if (currentVNode === null) {
      debugLog('First render - creating new DOM');
      const element = createElement(newVNode, context);
      config.root.innerHTML = '';
      config.root.appendChild(element);
    } else {
      debugLog('Differential render - calculating changes');
      const changes = diff(currentVNode, newVNode);
      debugLog('Changes to apply:', changes);

      if (changes.length > 0) {
        debugLog('Applying changes to DOM');
        applyDiff(config.root, changes, context);
      } else {
        debugLog('No changes detected, skipping DOM updates');
      }
    }
    currentVNode = newVNode;
  }

  render();

  return {
    getModel: () => currentModel,
    render
  };
}

// Example usage of a more complex application with multiple components

// Counter Component
type CounterModel = { count: number };
type CounterMsg =
  | { type: 'INCREMENT' }
  | { type: 'DECREMENT' };

function counterUpdate(msg: CounterMsg, model: CounterModel): CounterModel {
  debugLog('Counter update:', { msg, prevCount: model.count });

  switch (msg.type) {
    case 'INCREMENT': {
      const result = { ...model, count: model.count + 1 };
      debugLog('Incremented to:', result.count);
      return result;
    }
    case 'DECREMENT': {
      const result = { ...model, count: model.count - 1 };
      debugLog('Decremented to:', result.count);
      return result;
    }
    default:
      return model;
  }
}

function CounterView(model: CounterModel, dispatch: (msg: CounterMsg) => void) {
  debugLog('Rendering counter with count:', model.count);

  return h('div', { class: 'counter' }, [
    h('h2', {}, `Count: ${model.count}`),
    h('div', { class: 'buttons' }, [
      h('button', {
        onClick: (e: Event) => {
          debugLog('Increment button clicked');
          e.preventDefault();
          dispatch({ type: 'INCREMENT' });
        }
      }, 'Increment'),
      h('button', {
        onClick: (e: Event) => {
          debugLog('Decrement button clicked');
          e.preventDefault();
          dispatch({ type: 'DECREMENT' });
        }
      }, 'Decrement')
    ])
  ]);
}

// Todo List Component
type TodoItem = {
  id: number;
  text: string;
  completed: boolean;
};

type TodoListModel = {
  todos: TodoItem[];
  newTodoText: string;
  nextId: number;
};

type TodoListMsg =
  | { type: 'ADD_TODO' }
  | { type: 'UPDATE_NEW_TODO', text: string }
  | { type: 'TOGGLE_TODO', id: number }
  | { type: 'DELETE_TODO', id: number };

function todoListUpdate(msg: TodoListMsg, model: TodoListModel): TodoListModel {
  debugLog('Todo list update:', msg);

  switch (msg.type) {
    case 'ADD_TODO':
      if (model.newTodoText.trim() === '') return model;
      return {
        ...model,
        todos: [
          ...model.todos,
          { id: model.nextId, text: model.newTodoText, completed: false }
        ],
        newTodoText: '',
        nextId: model.nextId + 1
      };
    case 'UPDATE_NEW_TODO':
      return {
        ...model,
        newTodoText: msg.text
      };
    case 'TOGGLE_TODO':
      return {
        ...model,
        todos: model.todos.map(todo =>
          todo.id === msg.id ? { ...todo, completed: !todo.completed } : todo
        )
      };
    case 'DELETE_TODO':
      return {
        ...model,
        todos: model.todos.filter(todo => todo.id !== msg.id)
      };
    default:
      return model;
  }
}

function TodoListView(model: TodoListModel, dispatch: (msg: TodoListMsg) => void) {
  debugLog('Rendering todo list with todos:', model.todos.length);

  return h('div', { class: 'todo-list' }, [
    h('h2', {}, 'Todo List'),
    h('div', { class: 'add-todo' }, [
      h('input', {
        type: 'text',
        value: model.newTodoText,
        onInput: (e: Event) => {
          const target = e.target as HTMLInputElement;
          dispatch({ type: 'UPDATE_NEW_TODO', text: target.value });
        },
        onKeyDown: (e: KeyboardEvent) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            dispatch({ type: 'ADD_TODO' });
          }
        }
      }),
      h('button', {
        onClick: (e: Event) => {
          e.preventDefault();
          dispatch({ type: 'ADD_TODO' });
        }
      }, 'Add Todo')
    ]),
    h('ul', { class: 'todos' },
      model.todos.map(todo =>
        h('li', {
          key: todo.id,
          class: todo.completed ? 'completed' : ''
        }, [
          h('span', {
            onClick: (e: Event) => {
              e.preventDefault();
              dispatch({ type: 'TOGGLE_TODO', id: todo.id });
            },
            style: todo.completed ? 'text-decoration: line-through;' : ''
          }, todo.text),
          h('button', {
            onClick: (e: Event) => {
              e.preventDefault();
              dispatch({ type: 'DELETE_TODO', id: todo.id });
            },
            class: 'delete-btn'
          }, 'Delete')
        ])
      )
    )
  ]);
}

// Main Application
type AppModel = {
  counter: CounterModel;
  todoList: TodoListModel;
  activeTab: 'counter' | 'todoList' | 'both';
};

type AppMsg =
  | { type: 'COUNTER', msg: CounterMsg }
  | { type: 'TODO_LIST', msg: TodoListMsg }
  | { type: 'SET_TAB', tab: 'counter' | 'todoList' | 'both' };

document.addEventListener('DOMContentLoaded', () => {
  debugLog('DOM content loaded, initializing app');
  const rootElement = document.getElementById('app');
  debugLog('Root element:', rootElement);

  if (!rootElement) {
    console.error('Could not find #app element, falling back to body');
  }

  const app = createApp<AppModel, AppMsg>({
    root: rootElement || document.body,
    init: () => ({
      counter: { count: 0 },
      todoList: {
        todos: [
          { id: 1, text: 'Learn virtual DOM', completed: false },
          { id: 2, text: 'Build a component system', completed: false }
        ],
        newTodoText: '',
        nextId: 3
      },
      activeTab: 'both'
    }),
    update: (msg, model) => {
      debugLog('App update with message:', msg);
      let newModel = { ...model };

      switch (msg.type) {
        case 'COUNTER': {
          const newCounter = counterUpdate(msg.msg, model.counter);
          debugLog('Updated counter model:', newCounter);
          // Always use a new object reference to ensure change detection
          newModel = {
            ...newModel,
            counter: newCounter
          };
          break;
        }
        case 'TODO_LIST': {
          const newTodoList = todoListUpdate(msg.msg, model.todoList);
          debugLog('Updated todo list model:', newTodoList);
          newModel = {
            ...newModel,
            todoList: newTodoList
          };
          break;
        }
        case 'SET_TAB': {
          debugLog('Changing tab to:', msg.tab);
          newModel = {
            ...newModel,
            activeTab: msg.tab
          };
          break;
        }
      }

      return newModel;
    },
    view: (model, dispatch) => {
      debugLog('Rendering app with model:', model);

      return h('div', { class: 'app' }, [
        h('div', { class: 'tabs' }, [
          h('button', {
            class: model.activeTab === 'counter' ? 'active' : '',
            onClick: (e: Event) => {
              debugLog('Counter tab clicked');
              e.preventDefault();
              dispatch({ type: 'SET_TAB', tab: 'counter' });
            }
          }, 'Counter'),
          h('button', {
            class: model.activeTab === 'todoList' ? 'active' : '',
            onClick: (e: Event) => {
              e.preventDefault();
              dispatch({ type: 'SET_TAB', tab: 'todoList' });
            }
          }, 'Todo List'),
          h('button', {
            class: model.activeTab === 'both' ? 'active' : '',
            onClick: (e: Event) => {
              e.preventDefault();
              dispatch({ type: 'SET_TAB', tab: 'both' });
            }
          }, 'Both')
        ]),
        h('div', { class: 'content' }, [
          (model.activeTab === 'counter' || model.activeTab === 'both') ?
            CounterView(
              model.counter,
              (counterMsg) => dispatch({ type: 'COUNTER', msg: counterMsg })
            ) : null,
          (model.activeTab === 'todoList' || model.activeTab === 'both') ?
            TodoListView(
              model.todoList,
              (todoListMsg) => dispatch({ type: 'TODO_LIST', msg: todoListMsg })
            ) : null
        ])
      ]);
    }
  });
});