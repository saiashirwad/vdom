import { component, h, createApp, type VNode } from './vdom';


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
  () => [{ todos: [], newTodoText: '', nextId: 1 }, null],
  (msg, state) => {
    switch (msg.type) {
      case 'UPDATE_NEW_TODO': {
        state.newTodoText = msg.text;
        return;
      }
      case 'ADD_TODO': {
        if (!state.newTodoText.trim()) return null;
        state.todos.push({
          id: state.nextId,
          text: state.newTodoText,
          completed: false
        });
        state.newTodoText = '';
        state.nextId++;
        return;
      }
      case 'TOGGLE_TODO': {
        const todo = state.todos.find(t => t.id === msg.id);
        if (todo) {
          todo.completed = !todo.completed;
        }
        return;
      }
      case 'DELETE_TODO': {
        const index = state.todos.findIndex(t => t.id === msg.id);
        if (index !== -1) {
          state.todos.splice(index, 1);

          // Example of returning a command with the modified draft
          const logCmd = (dispatch: (msg: TodoListMsg) => void) => {
            console.log(`Deleted todo ${msg.id}`);
          };
          return [state, logCmd];
        }
        return null;
      }
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
    TodoList({ key: 'todoList' })
  ]);
}

document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('app') || document.body;
  createApp(root, appView);
});