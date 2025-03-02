import { component } from './component';
import { button, div, h3, input, label, option, p, select, span } from './elements';
import { mount } from './mount';

type CounterModel = {
  count: number;
};

type CounterMsg =
  | { type: 'INCREMENT' }
  | { type: 'DECREMENT' }
  | { type: 'SET'; value: number };

const Counter = component<CounterModel, CounterMsg>(
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
  (model, dispatch) => div({ className: 'counter' }, [
    h3({}, 'Counter'),
    div({ className: 'controls' }, [
      button({
        onClick: () => dispatch({ type: 'DECREMENT' })
      }, '-'),
      span({ className: 'value' }, String(model.count)),
      button({
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

const Settings = component<SettingsModel, SettingsMsg>(
  () => ({ darkMode: false, fontSize: 16 }),
  {
    TOGGLE_DARK_MODE: ({ state }) => {
      state.darkMode = !state.darkMode;
    },
    SET_FONT_SIZE: ({ msg: { size }, state }) => {
      state.fontSize = size;
    }
  },
  (model, dispatch) => div({ className: 'settings' }, [
    h3({}, 'Settings'),
    div({ className: 'controls' }, [
      label({}, [
        input({
          type: 'checkbox',
          checked: model.darkMode,
          onChange: () => dispatch({ type: 'TOGGLE_DARK_MODE' })
        }),
        ' Dark Mode'
      ]),
      div({}, [
        span({}, 'Font Size: '),
        select({
          value: String(model.fontSize),
          onChange: (e: Event) => {
            const size = Number((e.target as HTMLSelectElement).value);
            dispatch({ type: 'SET_FONT_SIZE', size });
          }
        }, [
          option({ value: '12' }, '12px'),
          option({ value: '14' }, '14px'),
          option({ value: '16' }, '16px'),
          option({ value: '18' }, '18px')
        ])
      ])
    ])
  ])
);

type AppModel = {
  counter: CounterModel;
  settings: SettingsModel;
  resetCount: number;
};

type AppMsg =
  | { type: 'COUNTER'; msg: CounterMsg }
  | { type: 'SETTINGS'; msg: SettingsMsg }
  | { type: 'RESET_COUNTER' };

const App = component<AppModel, AppMsg>(
  () => ({
    counter: Counter.init(),
    settings: Settings.init(),
    resetCount: 0
  }),
  {
    COUNTER: ({ msg: { msg }, state }) => {
      state.counter = Counter.updateState(msg, state.counter);
    },
    SETTINGS: ({ msg: { msg }, state }) => {
      state.settings = Settings.updateState(msg, state.settings);
    },
    RESET_COUNTER: ({ state }) => {
      state.counter = Counter.init();
      state.resetCount += 1;
    }
  },
  (model, dispatch) => {
    const counterDispatch = (msg: CounterMsg) => dispatch({ type: 'COUNTER', msg });
    const settingsDispatch = (msg: SettingsMsg) => dispatch({ type: 'SETTINGS', msg });

    const containerStyle = {
      backgroundColor: model.settings.darkMode ? '#333' : '#fff',
      color: model.settings.darkMode ? '#fff' : '#333',
      fontSize: `${model.settings.fontSize}px`,
      padding: '20px'
    };

    return div({ className: 'app' }, [
      div({ style: containerStyle }, [
        Settings.view(model.settings, settingsDispatch),
        div({ className: 'themed-container' }, [
          Counter.render({
            key: 'counter',
            model: model.counter,
            dispatch: counterDispatch
          }),
          div({ className: 'reset-section' }, [
            button({
              onClick: () => dispatch({ type: 'RESET_COUNTER' })
            }, 'Reset Counter'),
            p({}, `Counter has been reset ${model.resetCount} times`)
          ])
        ])
      ])
    ]);
  }
);

document.addEventListener('DOMContentLoaded', () => {
  mount(App, { rootId: 'app' });
});