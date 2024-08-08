const SeedData = require("./seed-data");
const deepCopy = require("./deep-copy");
const { sortTodoLists, sortTodos } = require("./sort");
const nextId = require("./next-id");

module.exports = class SessionPersistence {
  constructor(session) {
    this._todoLists = session.todoLists || deepCopy(SeedData);
    session.todoLists = this._todoLists;
  }

  isDoneTodoList(todoList) {
    return todoList.todos.length > 0 && todoList.todos.every(todo => todo.done);
  }

  sortedTodoLists() {
    let todoLists = deepCopy(this._todoLists);
    let undone = todoLists.filter(todoList => !this.isDoneTodoList(todoList));
    let done = todoLists.filter(todoList => this.isDoneTodoList(todoList));
    return sortTodoLists(undone, done);
  }

  sortTodoLists(undone, done) {
    undone.sort(compareByTitle);
    done.sort(compareByTitle);
    return [].concat(undone, done);
  }

  loadTodoList = (todoListId) => {
    return deepCopy(this._findTodoList(todoListId));
  };

  hasUndoneTodos(todoList) {
    return todoList.todos.some(todo => !todo.done);
  }

  sortedTodos(todoList) {
    return deepCopy(sortTodos(todoList));
  }

  loadTodo(todoListId, todoId) {
    let todoList = this.loadTodoList(todoListId);
    if (!todoList) return undefined;
    return todoList.todos.find(todo => todo.id === todoId);
  }

  markDone(todoListId, todoId) {
    let todo = this._findTodo(todoListId, todoId);
    todo.done = true;
  }

  markUndone(todoListId, todoId) {
    let todo = this._findTodo(todoListId, todoId);
    todo.done = false;
  }

  _findTodo(todoListId, todoId) {
    let todoList = this._findTodoList(todoListId);
    return todoList.todos.find(todo => todo.id === todoId);
  }

  _findTodoList(todoListId) {
    return this._todoLists.find(todoList => todoList.id === todoListId);
  }

  deleteTodo(todoListId, todoId) {
    let todoList = this._findTodoList(todoListId);
    let todoIndex = this._findTodoIndex(todoList, todoId);
    todoList.todos.splice(todoIndex, 1);
  }

  _findTodoIndex(todoList, todoId) {
    return todoList.todos.indexOf(todo => todo.id === todoId);
  }

  _findTodoListIndex(todoListId) {
    return this._todoLists.indexOf(todoList => todoList.id === todoListId);
  }

  markAllDone(todoListId) {
    let todoList = this._findTodoList(todoListId);
    todoList.todos.forEach(todo => {
      if (!todo.done) {
        todo.done = true;
      }
    });
  }

  addTodo(todoListId, todoTitle) {
    let todoList = this._findTodoList(todoListId);
    todoList.todos.push({
      id: nextId(),
      title: todoTitle,
      done: false,
    });
  }

  deleteTodoList(todoListId) {
    let index = this._findTodoListIndex(todoListId);
    this._todoLists.splice(index, 1);
  }

  setTitle(todoListId, newTitle) {
    let todoList = this._findTodoList(todoListId);
    todoList.title = newTitle;
  }

  createList(listTitle) {
    this._todoLists.push({
      id: nextId(),
      title: listTitle,
      todos: [],
    });
  }
};