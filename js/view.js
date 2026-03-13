const View = (() => {
  function render(state) {
    const pendingList = document.getElementById("pending-list");
    const completedList = document.getElementById("completed-list");

    pendingList.innerHTML = "";
    completedList.innerHTML = "";

    state.todos.forEach((todo) => {
      const li = createTodoItem(todo);

      if (todo.completed) {
        completedList.appendChild(li);
      } else {
        pendingList.appendChild(li);
      }
    });
  }

  function createTodoItem(todo) {
    const li = document.createElement("li");
    li.dataset.id = todo.id;

    li.innerHTML = `
        <span>${todo.todo}</span>
        <button class="toggle-btn">${todo.completed ? "←" : "→"}</button>
        <button class="edit-btn">✏️</button>
        <button class="delete-btn">🗑️</button>
    `;

    return li;
  }

  return { render };
})();