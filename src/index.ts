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

// TodoList Component
type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

type TodoListModel = {
  todos: Todo[];
  newTodoText: string;
  nextId: number;
};

type TodoListMsg =
  | { type: 'ADD_TODO' }
  | { type: 'UPDATE_NEW_TODO'; text: string }
  | { type: 'TOGGLE_TODO'; id: number }
  | { type: 'DELETE_TODO'; id: number };

const TodoList = component<TodoListModel, TodoListMsg>(
  'TODO_LIST',
  () => ({ todos: [], newTodoText: '', nextId: 1 }),
  (msg, model) => {
    switch (msg.type) {
      case 'UPDATE_NEW_TODO': {
        // Create a brand new model to ensure updates
        return { ...model, newTodoText: msg.text };
      }
      case 'ADD_TODO': {
        if (!model.newTodoText.trim()) return model;
        const newTodo = {
          id: model.nextId,
          text: model.newTodoText,
          completed: false
        };
        return {
          todos: [...model.todos, newTodo],
          newTodoText: '',
          nextId: model.nextId + 1
        };
      }
      case 'TOGGLE_TODO': {
        const updatedTodos = model.todos.map(todo =>
          todo.id === msg.id
            ? { ...todo, completed: !todo.completed }
            : todo
        );
        return { ...model, todos: updatedTodos };
      }
      case 'DELETE_TODO': {
        // Make sure we're creating a fresh array without the deleted todo
        const filteredTodos = model.todos.filter(todo => todo.id !== msg.id);

        // Log for debugging
        console.log(`Deleting todo ${msg.id}. Old count: ${model.todos.length}, New count: ${filteredTodos.length}`);

        // Return a completely new model to ensure the change is detected
        return {
          ...model,
          todos: filteredTodos
        };
      }
      default:
        return model;
    }
  },
  (model, dispatch) => h('div', { className: 'todo-list', key: 'todo-list-container' }, [
    h('h2', { key: 'todo-heading' }, 'Todo List'),

    // Input form
    h('div', { className: 'add-todo-form', key: 'todo-form' }, [
      h('input', {
        key: 'todo-input',
        type: 'text',
        value: model.newTodoText,
        onInput: (e: Event) => {
          const value = (e.target as HTMLInputElement).value;
          dispatch({ type: 'UPDATE_NEW_TODO', text: value });
        },
        onKeyDown: (e: KeyboardEvent) => {
          if (e.key === 'Enter') {
            dispatch({ type: 'ADD_TODO' });
          }
        }
      }),
      h('button', {
        key: 'add-todo-btn',
        onClick: () => dispatch({ type: 'ADD_TODO' })
      }, 'Add Todo')
    ]),

    // Todo list
    h('div', { key: 'todos-container', className: 'todos-container' }, [
      h('ul', { key: 'todos-list', className: 'todos' },
        model.todos.map(todo =>
          h('li', {
            key: `todo-${todo.id}`,
            className: todo.completed ? 'completed' : ''
          }, [
            h('span', {
              key: `todo-text-${todo.id}`,
              className: 'todo-text',
              style: todo.completed ? 'text-decoration: line-through;' : '',
              onClick: () => dispatch({ type: 'TOGGLE_TODO', id: todo.id })
            }, todo.text),
            h('button', {
              key: `todo-delete-${todo.id}`,
              className: 'delete-btn',
              onClick: () => dispatch({ type: 'DELETE_TODO', id: todo.id })
            }, '×')
          ])
        )
      )
    ]),

    h('div', { key: 'todo-stats', className: 'stats' }, [
      h('span', { key: 'todo-total' }, `Total: ${model.todos.length}`),
      h('span', { key: 'todo-completed' }, `Completed: ${model.todos.filter(t => t.completed).length}`)
    ])
  ])
);

function appView(): VNode {
  return h('div', {}, [
    h('h1', {}, 'Component Examples'),
    Button({ key: 'button1' }),
    Button({ key: 'button2' }),
    Counter({ key: 'counter1' }),
    TodoList({ key: 'todoList' })
  ]);
}

document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('app') || document.body;
  createApp(root, appView);
});