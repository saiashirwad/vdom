import { component } from './src/component';
import { mapDispatch } from './src/dispatch';
import { button, div, h, h3, input, label, option, p, select, span } from './src/elements';
import { mount } from './src/mount';

type CounterModel = {
  count: number;
};

type CounterMsg =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'set'; value: number };

const Counter = component<CounterModel, CounterMsg>(
  () => ({ count: 0 }),
  {
    increment: ({ state }) => {
      state.count += 1;
    },
    decrement: ({ state }) => {
      state.count -= 1;
    },
    set: ({ msg: { value }, state }) => {
      state.count = value;
    }
  },
  (model, dispatch) =>
    <div className="counter">
      <h3>Counter</h3>
      <div className="controls">
        <button onClick={() => dispatch.decrement()}>-</button>
        <span className="value">{model.count}</span>
        <button onClick={() => dispatch.increment()}>+</button>
        <button onClick={() => dispatch.set({ value: 0 })}>Reset</button>
      </div>
    </div>
);


type SettingsModel = {
  darkMode: boolean;
  fontSize: number;
};

type SettingsMsg =
  | { type: 'toggleDarkMode' }
  | { type: 'setFontSize'; size: number };

const Settings = component<SettingsModel, SettingsMsg>(
  () => ({ darkMode: false, fontSize: 16 }),
  {
    toggleDarkMode: ({ state }) => {
      state.darkMode = !state.darkMode;
    },
    setFontSize: ({ msg: { size }, state }) => {
      state.fontSize = size;
    }
  },
  (model, dispatch) => (
    <div className="settings">
      <h3>Settings</h3>
      <div className="controls">
        <label>
          <input
            type="checkbox"
            checked={model.darkMode}
            onChange={() => dispatch.toggleDarkMode()}
          />
          {' Dark Mode'}
        </label>
        <div>
          <span>Font Size: </span>
          <select
            value={String(model.fontSize)}
            onChange={(e: Event) => {
              const size = Number((e.target as HTMLSelectElement).value);
              dispatch.setFontSize({ size });
            }}
          >
            <option value="12">12px</option>
            <option value="14">14px</option>
            <option value="16">16px</option>
            <option value="18">18px</option>
          </select>
        </div>
      </div>
    </div>
  )
);

type AppModel = {
  counter: CounterModel;
  settings: SettingsModel;
  resetCount: number;
};

type AppMsg =
  | { type: 'counter'; msg: CounterMsg }
  | { type: 'settings'; msg: SettingsMsg }
  | { type: 'resetCounter' };

const App = component<AppModel, AppMsg>(
  () => ({
    counter: Counter.init(),
    settings: Settings.init(),
    resetCount: 0
  }),
  {
    counter: Counter.updateState,
    settings: Settings.updateState,
    resetCounter: ({ state }) => {
      state.counter = Counter.init();
      state.resetCount += 1;
    }
  },
  (model, dispatch) => {
    const settingsDispatch = mapDispatch(dispatch.settings);
    const counterDispatch = mapDispatch(dispatch.counter);

    return (
      <div>
        <div>
          <Settings model={model.settings} dispatch={settingsDispatch} />
          <div className="themed-container">
            <Counter model={model.counter} dispatch={counterDispatch} />
          </div>
          <div>
            <button onClick={() => dispatch.resetCounter()}>
              Reset Counter
            </button>
            <p>Counter has been reset {model.resetCount} times</p>
          </div>
        </div>
      </div>
    );
  }
);

document.addEventListener('DOMContentLoaded', () => {
  mount(App, { rootId: 'app' });
});

