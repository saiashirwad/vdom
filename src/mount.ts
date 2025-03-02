import { applyDiff, createElement, diff, type VNode } from './vdom';
import type { Component } from './component';

export interface MountOptions {
  rootId?: string;
}

/**
 * Mounts a component to the DOM and sets up the rendering loop
 */
export function mount<Model, Msg extends { type: string }>(
  component: Component<Model, Msg>,
  options: MountOptions = {}
) {
  const rootElement = options.rootId
    ? document.getElementById(options.rootId)
    : document.body;

  if (!rootElement) {
    throw new Error(`Root element with ID "${options.rootId}" not found`);
  }

  let currentVNode: VNode | null = null;
  let state = component.init();

  const dispatch = (msg: Msg) => {
    state = component.updateState(msg, state);
    render();
  };

  const render = () => {
    const newVNode = component.view(state, dispatch);

    if (!currentVNode) {
      currentVNode = newVNode;
      rootElement.appendChild(createElement(newVNode));
    } else {
      const operations = diff(currentVNode, newVNode);
      applyDiff(rootElement, operations);
      currentVNode = newVNode;
    }
  };

  // Initial render
  render();

  // Return functions to interact with the mounted component
  return {
    getState: () => state,
    dispatch,
    unmount: () => {
      // Clean up logic could go here
      rootElement.innerHTML = '';
    }
  };
} 