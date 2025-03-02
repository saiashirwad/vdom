import { h, createApp, type VNode, createElement, diff, applyDiff, match, type Pattern } from './vdom';

// Component factory function with pattern matching support
function createComponent<TModel, TMsg extends { type: string }>(
  name: string,
  init: () => TModel,
  update: Pattern<TMsg, TModel, TModel>,
  view: (model: TModel, dispatch: (msg: TMsg) => void) => VNode
) {
  return {
    name,
    init,
    update,
    view,
    // Wrap the component for use in parent components
    render: (props: { key: string, dispatch?: (msg: TMsg) => void, model?: TModel }) => {
      return view(props.model ?? init(), props.dispatch ?? (() => { }));
    }
  };
}

// Counter Component
type CounterModel = {
  count: number;
};

type CounterMsg =
  | { type: 'INCREMENT' }
  | { type: 'DECREMENT' }
  | { type: 'SET'; value: number };

const Counter = createComponent<CounterModel, CounterMsg>(
  'Counter',
  () => ({ count: 0 }),
  {
    INCREMENT: (_, model) => ({ ...model, count: model.count + 1 }),
    DECREMENT: (_, model) => ({ ...model, count: model.count - 1 }),
    SET: (msg, model) => ({ ...model, count: msg.value })
  },
  (model, dispatch) => h('div', { className: 'counter', key: 'counter-container' }, [
    h('h3', { key: 'counter-heading' }, 'Counter'),
    h('div', { key: 'counter-controls', className: 'controls' }, [
      h('button', {
        key: 'decrement-btn',
        onClick: () => dispatch({ type: 'DECREMENT' })
      }, '-'),
      h('span', { key: 'counter-value', className: 'value' }, String(model.count)),
      h('button', {
        key: 'increment-btn',
        onClick: () => dispatch({ type: 'INCREMENT' })
      }, '+')
    ])
  ])
);

// Settings Component
type SettingsModel = {
  darkMode: boolean;
  fontSize: number;
};

type SettingsMsg =
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'SET_FONT_SIZE'; size: number };

const Settings = createComponent<SettingsModel, SettingsMsg>(
  'Settings',
  () => ({ darkMode: false, fontSize: 16 }),
  {
    TOGGLE_DARK_MODE: (_, model) => ({ ...model, darkMode: !model.darkMode }),
    SET_FONT_SIZE: (msg, model) => ({ ...model, fontSize: msg.size })
  },
  (model, dispatch) => h('div', { className: 'settings', key: 'settings-container' }, [
    h('h3', { key: 'settings-heading' }, 'Settings'),
    h('div', { key: 'settings-controls', className: 'controls' }, [
      h('label', { key: 'dark-mode-label' }, [
        h('input', {
          key: 'dark-mode-checkbox',
          type: 'checkbox',
          checked: model.darkMode,
          onChange: () => dispatch({ type: 'TOGGLE_DARK_MODE' })
        }),
        ' Dark Mode'
      ]),
      h('div', { key: 'font-size-control' }, [
        h('span', { key: 'font-size-label' }, 'Font Size: '),
        h('select', {
          key: 'font-size-select',
          value: String(model.fontSize),
          onChange: (e: Event) => {
            const size = Number((e.target as HTMLSelectElement).value);
            dispatch({ type: 'SET_FONT_SIZE', size });
          }
        }, [
          h('option', { key: 'size-12', value: '12' }, '12px'),
          h('option', { key: 'size-14', value: '14' }, '14px'),
          h('option', { key: 'size-16', value: '16' }, '16px'),
          h('option', { key: 'size-18', value: '18' }, '18px')
        ])
      ])
    ])
  ])
);

// Main App Component
type AppModel = {
  counter: CounterModel;
  settings: SettingsModel;
  resetCount: number;
};

type AppMsg =
  | { type: 'COUNTER'; msg: CounterMsg }
  | { type: 'SETTINGS'; msg: SettingsMsg }
  | { type: 'RESET_COUNTER' };

const App = createComponent<AppModel, AppMsg>(
  'App',
  () => ({
    counter: Counter.init(),
    settings: Settings.init(),
    resetCount: 0
  }),
  {
    COUNTER: (msg, model) => ({
      ...model,
      counter: match(msg.msg, Counter.update, model.counter)
    }),
    SETTINGS: (msg, model) => ({
      ...model,
      settings: match(msg.msg, Settings.update, model.settings)
    }),
    RESET_COUNTER: (_, model) => ({
      ...model,
      counter: Counter.init(),
      resetCount: model.resetCount + 1
    })
  },
  (model, dispatch) => {
    // Create wrapped dispatchers for child components
    const counterDispatch = (msg: CounterMsg) => dispatch({ type: 'COUNTER', msg });
    const settingsDispatch = (msg: SettingsMsg) => dispatch({ type: 'SETTINGS', msg });

    // Apply styling based on settings
    const containerStyle = {
      backgroundColor: model.settings.darkMode ? '#333' : '#fff',
      color: model.settings.darkMode ? '#fff' : '#333',
      fontSize: `${model.settings.fontSize}px`,
      padding: '20px'
    };

    return h('div', { key: 'app-container', className: 'app' }, [
      h('div', { key: 'app-content', style: containerStyle }, [
        // Directly use the component's view function
        Settings.view(model.settings, settingsDispatch),

        h('div', { key: 'content-container', className: 'themed-container' }, [
          // Use the render helper method
          Counter.render({
            key: 'counter',
            model: model.counter,
            dispatch: counterDispatch
          }),

          h('div', { key: 'reset-section', className: 'reset-section' }, [
            h('button', {
              key: 'reset-btn',
              onClick: () => dispatch({ type: 'RESET_COUNTER' })
            }, 'Reset Counter'),
            h('p', { key: 'reset-count' }, `Counter has been reset ${model.resetCount} times`)
          ])
        ])
      ])
    ]);
  }
);

// APP SETUP
document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('app') || document.body;
  let currentVNode: VNode | null = null;

  let appState = App.init();

  // Create a dispatch function that causes re-renders
  const dispatch = (msg: AppMsg) => {
    appState = match(msg, App.update, appState);
    render(); // Call render after state update
  };

  // Set up manual rendering function
  const render = () => {
    const newVNode = App.view(appState, dispatch);

    if (!currentVNode) {
      // First render
      currentVNode = newVNode;
      root.appendChild(createElement(newVNode));
    } else {
      // Update existing DOM
      const operations = diff(currentVNode, newVNode);
      applyDiff(root, operations);
      currentVNode = newVNode;
    }
  };

  // Initial render
  render();
});