const { dbQuery } = require("./db-query");
const bcrypt = require("bcrypt");

module.exports = class PgPersistence {
  constructor(session) {
    this.username = session.username;
  }

  isDoneTodoList(todoList) {
    return todoList.todos.length > 0 && todoList.todos.every(todo => todo.done);
  }

  async sortedTodoLists() {

    const ALL_TODOLISTS = "SELECT * FROM todolists" +
                        "  WHERE username = $1" +
                        "  ORDER BY lower(title) ASC";
  const ALL_TODOS =     "SELECT * FROM todos" +
                        "  WHERE username = $1";

  let resultTodoLists = dbQuery(ALL_TODOLISTS, this.username);
  let resultTodos = dbQuery(ALL_TODOS, this.username);
  let resultBoth = await Promise.all([resultTodoLists, resultTodos]);

  let allTodoLists = resultBoth[0].rows;
  let allTodos = resultBoth[1].rows;
  if (!allTodoLists || !allTodos) return undefined;

  allTodoLists.forEach(todoList => {
    todoList.todos = allTodos.filter(todo => {
      return todoList.id === todo.todolist_id;
    });
  });

  return this._partitionTodoLists(allTodoLists);
  }

  // Returns a new list of todo lists partitioned by completion status.
  _partitionTodoLists(todoLists) {
    let undone = [];
    let done = [];

    todoLists.forEach(todoList => {
      if (this.isDoneTodoList(todoList)) {
        done.push(todoList);
      } else {
        undone.push(todoList);
      }
    });

    return undone.concat(done);
  }

  sortTodoLists(undone, done) {
    // undone.sort(compareByTitle);
    // done.sort(compareByTitle);
    // return [].concat(undone, done);
  }

  async loadTodoList(todoListId) {
    const TODOLIST = "SELECT * FROM todolists WHERE id = $1 AND username = $2;";
    const SORT_TODOS_QUERY = "SELECT * FROM todos WHERE todolist_id = $1 AND username = $2 ORDER BY done ASC, title ASC;";

    let result1 = dbQuery(TODOLIST, todoListId, this.username);
    let result2 = dbQuery(SORT_TODOS_QUERY, todoListId, this.username);

    let bothResults = await Promise.all([result1, result2]);

    let todoList = bothResults[0].rows[0];

    if(!todoList) return undefined;

    todoList.todos = bothResults[1].rows;
    return todoList;
  };

  hasUndoneTodos(todoList) {
    return todoList.todos.some(todo => !todo.done);
  }

  async sortedTodos(todoList) {
    const SORT_TODOS_QUERY = "SELECT * FROM todos WHERE todolist_id = $1 AND username = $2 ORDER BY done ASC, title ASC;";

    let sortedTodos = await dbQuery(SORT_TODOS_QUERY, todoList.id, this.username);
    todoList.todos = sortedTodos.rows;
    return todoList;
  }

  async loadTodo(todoListId, todoId) {

    const FIND_TODO = "SELECT * FROM todos WHERE todolist_id = $1 AND id = $2 AND username = $3";

    let result = await dbQuery(FIND_TODO, todoListId, todoId, this.username);
    return result.rows[0];
  }

  async toggleDoneTodo(todoListId, todoId) {
    const TOGGLE_DONE = "UPDATE todos SET done = NOT done" +
                        "  WHERE todolist_id = $1 AND id = $2 AND username = $3";

    let result = await dbQuery(TOGGLE_DONE, todoListId, todoId, this.username);
    return result.rowCount > 0;
  }

  markDone(todoListId, todoId) {
    // let todo = this._findTodo(todoListId, todoId);
    // todo.done = true;
  }

  markUndone(todoListId, todoId) {
    // let todo = this._findTodo(todoListId, todoId);
    // todo.done = false;
  }

  _findTodo(todoListId, todoId) {
    // let todoList = this._findTodoList(todoListId);
    // return todoList.todos.find(todo => todo.id === todoId);
  }

  _findTodoList(todoListId) {
    //return this._todoLists.find(todoList => todoList.id === todoListId);
  }

  async deleteTodo(todoListId, todoId) {
    const DELETE_TODO = "DELETE FROM todos WHERE todolist_id = $1 AND id = $2 AND username = $3;";

    let result = await dbQuery(DELETE_TODO, todoListId, todoId, this.username);
    return result.rowCount > 0;
  }

  _findTodoIndex(todoList, todoId) {
    //return todoList.todos.indexOf(todo => todo.id === todoId);
  }

  _findTodoListIndex(todoListId) {
    //return this._todoLists.indexOf(todoList => todoList.id === todoListId);
  }

  async markAllDone(todoListId) {
    const MARK_ALL_DONE = "UPDATE todos SET done = true WHERE todolist_id = $1 AND done = false AND username = $3;";

    let result = await dbQuery(MARK_ALL_DONE, todoListId, this.username);
    return result.rowCount > 0;
  }

  async createTodo(todoListId, todoTitle) {
    const CREATE_TODO = "INSERT INTO todos (todolist_id, title, username) VALUES ($1, $2, $3);";

    let result = await dbQuery(CREATE_TODO, todoListId, todoTitle, this.username);
    return result.rowCount > 0;
  }

  async deleteTodoList(todoListId) {
    const DELETE_TODOLIST = "DELETE FROM todolists WHERE id = $1 AND username = $2;";

    let result = await dbQuery(DELETE_TODOLIST, todoListId, this.username);
    return result.rowCount > 0;
  }

  async setTitle(todoListId, newTitle) {
    const SET_TODOLIST_TITLE = "UPDATE todolists SET title = $1 WHERE id = $2 AND username = $3;";

    let result = await dbQuery(SET_TODOLIST_TITLE, newTitle, todoListId, this.username);
    return result.rowCount > 0;
  }

  async existsTodoListTitle(title) {
    const FIND_TODOLIST = "SELECT null FROM todolists WHERE title = $1 AND username = $2;";

    let result = await dbQuery(FIND_TODOLIST, title, this.username);
    return result.rowCount > 0;
  }

  async createList(listTitle) {
    const CREATE_TODOLIST = "INSERT INTO todolists (title, username) VALUES ($1, $2);";

    let result = await dbQuery(CREATE_TODOLIST, listTitle, this.username);
    return result.rowCount > 0;
  }

  async signIn(username, password) {
    const AUTHENTICATE = "SELECT password FROM users WHERE username = $1;";

    let result = await dbQuery(AUTHENTICATE, username);
    if (result.rowCount === 0) return false;

    return bcrypt.compare(password, result.rows[0].password);
  }
};
