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

        const span = document.createElement("span");
        span.textContent = todo.todo;

        const toggleBtn = document.createElement("button");
        toggleBtn.className = "toggle-btn";
        toggleBtn.textContent = todo.completed ? "←" : "→";

        const editBtn = document.createElement("button");
        editBtn.className = "edit-btn";
        editBtn.textContent = "✏️";

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "🗑️";

        li.appendChild(span);
        li.appendChild(toggleBtn);
        li.appendChild(editBtn);
        li.appendChild(deleteBtn);

        return li;
    }

  return { render };
})();