const Model = (() => {
  class State {
    constructor() {
      this.todos = [];
      this.apiUrl = "https://dummyjson.com/todos";
      this.storageKey = "todos";
    }

    saveTodos() {
      localStorage.setItem(this.storageKey, JSON.stringify(this.todos));
    }

    async loadTodos() {
      const savedTodos = localStorage.getItem(this.storageKey);

      if (savedTodos) {
        this.todos = JSON.parse(savedTodos);
        return;
      }

      const response = await fetch(this.apiUrl);
      const data = await response.json();
      this.todos = data.todos;
      this.saveTodos();
    }

    async deleteTodo(id) {
      await fetch(`https://dummyjson.com/todos/${id}`, {
        method: "DELETE"
      });

      this.todos = this.todos.filter((todo) => todo.id !== id);
      this.saveTodos();
    }

    async toggleTodo(id) {
      const todo = this.todos.find((todo) => todo.id === id);
      if (!todo) return;

      await fetch(`https://dummyjson.com/todos/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          completed: !todo.completed
        })
      });

      todo.completed = !todo.completed;
      this.saveTodos();
    }

    async addTodo(text) {
      const response = await fetch("https://dummyjson.com/todos/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          todo: text,
          completed: false,
          userId: 1
        })
      });

      const newTodo = await response.json();
      newTodo.id = Date.now();
      this.todos.unshift(newTodo);
      this.saveTodos();
    }

    async editTodo(id, newText) {
      await fetch(`https://dummyjson.com/todos/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          todo: newText
        })
      });

      const todo = this.todos.find((todo) => todo.id === id);

      if (todo) {
        todo.todo = newText;
        this.saveTodos();
      }
    }
  }

  return { State };
})();