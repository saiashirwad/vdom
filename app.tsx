import { component } from './src/component';
import { mapDispatch } from './src/dispatch';
import { h } from './src/elements';
import { mount } from './src/mount';

type TodoItem = {
  id: number;
  text: string;
  completed: boolean;
};

type TodoModel = {
  todos: TodoItem[];
  newTodoText: string;
  nextId: number;
};

type TodoMsg =
  | { type: 'addTodo' }
  | { type: 'updateNewTodo'; text: string }
  | { type: 'toggleTodo'; id: number }
  | { type: 'deleteTodo'; id: number };

const TodoList = component<TodoModel, TodoMsg>(
  () => ({
    todos: [],
    newTodoText: '',
    nextId: 1
  }),
  {
    addTodo: ({ state }) => {
      if (state.newTodoText.trim()) {
        state.todos.push({
          id: state.nextId,
          text: state.newTodoText,
          completed: false
        });
        state.nextId += 1;
        state.newTodoText = '';
      }
    },
    updateNewTodo: ({ msg: { text }, state }) => {
      state.newTodoText = text;
    },
    toggleTodo: ({ msg: { id }, state }) => {
      const todo = state.todos.find(t => t.id === id);
      if (todo) {
        todo.completed = !todo.completed;
      }
    },
    deleteTodo: ({ msg: { id }, state }) => {
      state.todos = state.todos.filter(t => t.id !== id);
    }
  },
  (model, dispatch) => (
    <div className="todo-list">
      <h3>Todo List</h3>
      <div className="add-todo">
        <input
          type="text"
          value={model.newTodoText}
          onChange={(e: Event) => {
            const text = (e.target as HTMLInputElement).value;
            console.log({text})
            dispatch.updateNewTodo({ text });
          }}
          onKeyDown={(e: KeyboardEvent) => {
            if (e.key === 'Enter') {
              dispatch.addTodo();
            }
          }}
          placeholder="What needs to be done?"
        />
        <button onClick={() => dispatch.addTodo()}>Add</button>
      </div>
      <ul className="todos">
        {model.todos.map(todo => (
          <li key={todo.id} className={todo.completed ? 'completed' : ''}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => dispatch.toggleTodo({ id: todo.id })}
            />
            <span>{todo.text}</span>
            <button 
              onClick={() => dispatch.deleteTodo({ id: todo.id })}
              className="delete"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <div className="todo-stats">
        <p>Total: {model.todos.length}</p>
        <p>Completed: {model.todos.filter(t => t.completed).length}</p>
      </div>
    </div>
  )
);

document.addEventListener('DOMContentLoaded', () => {
  mount(TodoList, { rootId: 'app' });
});
