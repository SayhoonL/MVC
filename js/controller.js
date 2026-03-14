const Controller = ((view, model) => {
    const state = new model.State();

    async function init() {
        await state.loadTodos();
        view.render(state);
        bindEvents();
    }

    function bindEvents() {
        const pendingList = document.getElementById("pending-list");
        const completedList = document.getElementById("completed-list");
        const form = document.getElementById("todo-form");

        pendingList.addEventListener("click", handleListClick);
        completedList.addEventListener("click", handleListClick);
        form.addEventListener("submit", handleAddTodo);
    }

    async function handleListClick(event) {
        const button = event.target.closest("button");
        if (!button) return;

        const li = button.closest("li");
        if (!li) return;

        const todoId = Number(li.dataset.id);

        if (button.classList.contains("delete-btn")) {
        await state.deleteTodo(todoId);
        view.render(state);
        return;
        }

        if (button.classList.contains("toggle-btn")) {
        await state.toggleTodo(todoId);
        view.render(state);
        return;
        }

        if (button.classList.contains("edit-btn")) {
        enterEditMode(li, button);
        return;
        }

        if (button.classList.contains("save-btn")) {
        await saveEditedTodo(li, todoId);
        view.render(state);
        }
    }

    function enterEditMode(li, button) {
        const span = li.querySelector("span");
        const currentText = span.textContent;

        const input = document.createElement("input");
        input.className = "edit-input";
        input.value = currentText;

        span.textContent = "";
        span.appendChild(input);

        button.textContent = "💾";
        button.classList.remove("edit-btn");
        button.classList.add("save-btn");
    }

    async function saveEditedTodo(li, todoId) {
        const input = li.querySelector(".edit-input");
        if (!input) return;

        const newText = input.value.trim();
        if (!newText) return;

        await state.editTodo(todoId, newText);
    }

    async function handleAddTodo(event) {
        event.preventDefault();

        const input = document.getElementById("todo-input");
        const text = input.value.trim();

        if (!text) return;

        await state.addTodo(text);
        input.value = "";
        view.render(state);
    }

    return { init };
})(View, Model);

Controller.init();