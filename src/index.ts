import { produce } from 'immer';
import { applyDiff, createElement, diff, h, type Draft, type VNode } from './vdom';

type Pattern<TMsg extends { type: string }, TModel, TResult> = {
  [K in TMsg['type']]: (params: {
    msg: Extract<TMsg, { type: K }>,
    state: Draft<TModel>  // Use Draft type for Immer support
  }) => TResult;
};

function match<TMsg extends { type: string }, TModel, TResult>(
  msg: TMsg,
  patterns: Pattern<TMsg, TModel, TResult>,
  state: TModel
): TResult {
  const handler = patterns[msg.type as keyof typeof patterns];
  return handler({
    msg: msg as Extract<TMsg, { type: typeof msg.type }>,
    state: state as Draft<TModel>
  });
}

function createComponent<TModel, TMsg extends { type: string }>(
  init: () => TModel,
  update: Pattern<TMsg, TModel, void | TModel | null>,
  view: (model: TModel, dispatch: (msg: TMsg) => void) => VNode
) {
  return {
    init,
    update,
    view,
    updateState: (msg: TMsg, state: TModel): TModel => {
      return produce(state, (draft: Draft<TModel>) => {
        match(msg, update, draft);
      });
    },
    render: (props: { key: string, dispatch?: (msg: TMsg) => void, model?: TModel }) => {
      return view(props.model ?? init(), props.dispatch ?? (() => { }));
    }
  };
}

type CounterModel = {
  count: number;
};

type CounterMsg =
  | { type: 'INCREMENT' }
  | { type: 'DECREMENT' }
  | { type: 'SET'; value: number };

const Counter = createComponent<CounterModel, CounterMsg>(
  () => ({ count: 0 }),
  {
    INCREMENT: ({ state }) => {
      state.count += 1;
    },
    DECREMENT: ({ state }) => {
      state.count -= 1;
    },
    SET: ({ msg: { value }, state }) => {
      state.count = value;
    }
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
  () => ({ darkMode: false, fontSize: 16 }),
  {
    TOGGLE_DARK_MODE: ({ state }) => {
      // Mutative approach with Immer
      state.darkMode = !state.darkMode;
    },
    SET_FONT_SIZE: ({ msg: { size }, state }) => {
      // Mutative approach with Immer
      state.fontSize = size;
    }
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
  () => ({
    counter: Counter.init(),
    settings: Settings.init(),
    resetCount: 0
  }),
  {
    COUNTER: ({ msg: { msg }, state }) => {
      // Mutative update with sub-component
      state.counter = Counter.updateState(msg, state.counter);
    },
    SETTINGS: ({ msg: { msg }, state }) => {
      // Mutative update with sub-component
      state.settings = Settings.updateState(msg, state.settings);
    },
    RESET_COUNTER: ({ state }) => {
      // Mutative update with counter reset
      state.counter = Counter.init();
      state.resetCount += 1;
    }
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

  // Create a dispatch function that uses the updateState helper
  const dispatch = (msg: AppMsg) => {
    appState = App.updateState(msg, appState);
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