(() => {
  "use strict";

  const STORAGE_KEY = "vanilla_todos_v1";

  const form = document.getElementById("todoForm");
  const input = document.getElementById("todoInput");
  const list = document.getElementById("todoList");
  const errorEl = document.getElementById("todoError");
  const emptyStateEl = document.getElementById("emptyState");
  const counterTextEl = document.getElementById("counterText");

  /** @type {{id: string, text: string, completed: boolean, createdAt: number}[]} */
  let todos = loadTodos();

  // --- Persistence helpers (localStorage) ---
  function loadTodos() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveTodos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }

  // --- Small utilities ---
  function uid() {
    // Simple unique id: timestamp + random chunk (good enough for this app)
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function normalizeText(value) {
    return value.replace(/\s+/g, " ").trim();
  }

  function setError(message) {
    errorEl.textContent = message;
    if (message) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
  }

  function updateCountersAndEmptyState() {
    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    const remaining = total - completed;

    const label =
      total === 0
        ? "0 tareas"
        : total === 1
          ? "1 tarea"
          : `${total} tareas`;

    counterTextEl.textContent = `${label} · ${remaining} pendientes`;
    emptyStateEl.hidden = total !== 0;
  }

  // --- Rendering ---
  function render() {
    // Clear list and rebuild for simplicity and clarity.
    list.innerHTML = "";

    for (const todo of todos) {
      const li = document.createElement("li");
      li.className = `todo-item${todo.completed ? " is-completed" : ""}`;
      li.dataset.id = todo.id;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "checkbox";
      checkbox.checked = todo.completed;
      checkbox.setAttribute("aria-label", `Marcar como completada: ${todo.text}`);
      checkbox.dataset.action = "toggle";

      const text = document.createElement("p");
      text.className = "todo-text";
      text.textContent = todo.text;

      const del = document.createElement("button");
      del.type = "button";
      del.className = "button delete-btn";
      del.textContent = "Eliminar";
      del.dataset.action = "delete";
      del.setAttribute("aria-label", `Eliminar tarea: ${todo.text}`);

      li.append(checkbox, text, del);
      list.appendChild(li);
    }

    updateCountersAndEmptyState();
  }

  // --- Core actions ---
  function addTodo(rawText) {
    const text = normalizeText(rawText);

    // Validation: don't allow empty tasks (also blocks whitespace-only)
    if (!text) {
      setError("No puedes agregar una tarea vacía.");
      return;
    }

    setError("");

    todos.unshift({
      id: uid(),
      text,
      completed: false,
      createdAt: Date.now(),
    });

    saveTodos();
    render();

    // UX: keep focus for fast entry
    input.value = "";
    input.focus();
  }

  function deleteTodo(id) {
    todos = todos.filter((t) => t.id !== id);
    saveTodos();
    render();
  }

  function toggleTodo(id) {
    todos = todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    saveTodos();
    render();
  }

  // --- Events ---
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    addTodo(input.value);
  });

  input.addEventListener("input", () => {
    // Clear error as soon as the user starts typing again
    if (errorEl.textContent) setError("");
  });

  // Event delegation: one listener for the whole list
  list.addEventListener("click", (e) => {
    const target = /** @type {HTMLElement} */ (e.target);
    const action = target?.dataset?.action;
    if (!action) return;

    const li = target.closest(".todo-item");
    const id = li?.dataset?.id;
    if (!id) return;

    if (action === "delete") deleteTodo(id);
  });

  list.addEventListener("change", (e) => {
    const target = /** @type {HTMLElement} */ (e.target);
    const action = target?.dataset?.action;
    if (action !== "toggle") return;

    const li = target.closest(".todo-item");
    const id = li?.dataset?.id;
    if (!id) return;

    toggleTodo(id);
  });

  // Initial render
  render();
})();

