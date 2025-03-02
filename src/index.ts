import { produce } from 'immer';
import { applyDiff, createElement, diff, h, type Draft, type VNode } from './vdom';

// Add the $ helper object with methods for all HTML elements
const $ = {} as Record<string, (...args: any[]) => VNode>;

// List of common HTML elements
const elements = [
  'a', 'abbr', 'article', 'aside', 'audio', 'b', 'blockquote', 'body', 'br', 'button',
  'canvas', 'caption', 'code', 'col', 'colgroup', 'data', 'datalist', 'dd', 'del', 'details',
  'dfn', 'dialog', 'div', 'dl', 'dt', 'em', 'fieldset', 'figcaption', 'figure', 'footer',
  'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'i', 'iframe', 'img', 'input',
  'label', 'legend', 'li', 'main', 'map', 'mark', 'menu', 'meter', 'nav', 'ol', 'optgroup',
  'option', 'output', 'p', 'pre', 'progress', 'section', 'select', 'small', 'span', 'strong',
  'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'textarea', 'tfoot', 'th', 'thead', 'time',
  'tr', 'track', 'ul', 'video'
];

// Create methods for each element
elements.forEach(element => {
  $[element] = (props?: { [key: string]: any }, children?: VNode | string | (VNode | string)[]) => {
    return h(element, props, children);
  };
});

// Also expose h directly on $ for custom elements
$.h = h;

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

// Define a clear Component type for better type inference
type Component<TModel, TMsg extends { type: string }> = {
  init: () => TModel;
  update: Pattern<TMsg, TModel, void | TModel | null>;
  view: (model: TModel, dispatch: (msg: TMsg) => void) => VNode;
  updateState: (msg: TMsg, state: TModel) => TModel;
  render: (props: { key: string, dispatch?: (msg: TMsg) => void, model?: TModel }) => VNode;
};

// Updated component factory that returns the clean type
function createComponent<TModel, TMsg extends { type: string }>(
  init: () => TModel,
  update: Pattern<TMsg, TModel, void | TModel | null>,
  view: (model: TModel, dispatch: (msg: TMsg) => void) => VNode
): Component<TModel, TMsg> {
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
  (model, dispatch) => $.div({ className: 'counter' }, [
    $.h3({}, 'Counter'),
    $.div({ className: 'controls' }, [
      $.button({
        onClick: () => dispatch({ type: 'DECREMENT' })
      }, '-'),
      $.span({ className: 'value' }, String(model.count)),
      $.button({
        onClick: () => dispatch({ type: 'INCREMENT' })
      }, '+')
    ])
  ])
);

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
  (model, dispatch) => $.div({ className: 'settings' }, [
    $.h3({}, 'Settings'),
    $.div({ className: 'controls' }, [
      $.label({}, [
        $.input({
          type: 'checkbox',
          checked: model.darkMode,
          onChange: () => dispatch({ type: 'TOGGLE_DARK_MODE' })
        }),
        ' Dark Mode'
      ]),
      $.div({}, [
        $.span({}, 'Font Size: '),
        $.select({
          value: String(model.fontSize),
          onChange: (e: Event) => {
            const size = Number((e.target as HTMLSelectElement).value);
            dispatch({ type: 'SET_FONT_SIZE', size });
          }
        }, [
          $.option({ value: '12' }, '12px'),
          $.option({ value: '14' }, '14px'),
          $.option({ value: '16' }, '16px'),
          $.option({ value: '18' }, '18px')
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

    return $.div({ className: 'app' }, [
      $.div({ style: containerStyle }, [
        // Directly use the component's view function
        Settings.view(model.settings, settingsDispatch),

        $.div({ className: 'themed-container' }, [
          // Use the render helper method
          Counter.render({
            key: 'counter',
            model: model.counter,
            dispatch: counterDispatch
          }),

          $.div({ className: 'reset-section' }, [
            $.button({
              onClick: () => dispatch({ type: 'RESET_COUNTER' })
            }, 'Reset Counter'),
            $.p({}, `Counter has been reset ${model.resetCount} times`)
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