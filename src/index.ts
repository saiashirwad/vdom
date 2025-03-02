import { component, h, createApp, type VNode } from './vdom';

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

function appView(): VNode {
  return h('div', {}, [
    h('h1', {}, 'Component Examples'),
    Button({ key: 'button1' }),
    Button({ key: 'button2' }),
    Counter({ key: 'counter1' })
  ]);
}

document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('app') || document.body;
  createApp(root, appView);
});