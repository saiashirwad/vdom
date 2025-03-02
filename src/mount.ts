import { type Component } from './component';
import { createDOMElement, type VNode } from './vdom';
import { createDispatch } from './dispatch';

export interface MountOptions {
  rootId?: string;
}

/**
 * Mounts a component to the DOM and sets up the rendering loop
 */
export function mount<TModel, TMsg extends { type: string }>(
  component: Component<TModel, TMsg> & ((props: any) => VNode),
  options: { rootId: string }
): void {
  const rootElement = document.getElementById(options.rootId);

  if (!rootElement) {
    throw new Error(`Root element with id "${options.rootId}" not found`);
  }

  // Initial model
  const model = component.init();

  // Function to dispatch messages
  const dispatch = createDispatch(model, render);

  // Render function that updates the view
  function render() {
    // Clear the root element first
    while (rootElement.firstChild) {
      rootElement.removeChild(rootElement.firstChild);
    }

    // Call the component's view function with the model and dispatch
    const vnode = component.view(model, dispatch);

    // Convert the virtual node to a real DOM node and append it
    const domNode = createDOMElement(vnode);

    // Make sure domNode is actually a Node before appending
    if (domNode instanceof Node) {
      rootElement.appendChild(domNode);
    } else {
      console.error('Failed to create DOM node:', vnode, domNode);
      throw new Error('createDOMElement did not return a valid DOM node');
    }
  }

  // Create a dispatch function that triggers model updates and rerenders
  function createDispatch(model: TModel, render: () => void) {
    const dispatcher = {} as any;

    // For each message type in the component's update pattern
    Object.keys(component.update).forEach(type => {
      dispatcher[type] = (payload?: any) => {
        const msg = payload !== undefined ? { type, ...payload } : { type };

        // Update the model
        const updatedModel = component.updateState(msg, model);

        // If a new model is returned, use it
        if (updatedModel) {
          Object.assign(model, updatedModel);
        }

        // Rerender
        render();
      };
    });

    return dispatcher;
  }

  // Initial render
  render();
} 