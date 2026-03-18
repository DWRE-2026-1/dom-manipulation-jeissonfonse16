(() => {
  "use strict";

  const STORAGE_KEY = "vanilla_todos_v1";

  const form = document.getElementById("todoForm");
  const input = document.getElementById("todoInput");
  const list = document.getElementById("todoList");
  const errorEl = document.getElementById("todoError");
  const emptyStateEl = document.getElementById("emptyState");
  const totalBadgeEl = document.getElementById("totalBadge");
  const pendingBadgeEl = document.getElementById("pendingBadge");
  const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));

  /** @type {{id: string, text: string, completed: boolean, createdAt: number}[]} */
  let todos = loadTodos();
  /** @type {"all" | "active" | "completed"} */
  let currentFilter = "all";
  /** @type {string | null} */
  let lastAddedId = null;

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

  function updateBadgesAndEmptyState(visibleCount) {
    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    const remaining = total - completed;

    totalBadgeEl.textContent = `Total: ${total}`;
    pendingBadgeEl.textContent = `Pendientes: ${remaining}`;

    // Empty state depends on the selected filter
    let emptyMessage = "No hay tareas todavía. Agrega la primera.";
    if (total > 0 && visibleCount === 0) {
      emptyMessage =
        currentFilter === "active"
          ? "No tienes tareas pendientes. ¡Buen trabajo!"
          : "No tienes tareas completadas todavía.";
    }
    emptyStateEl.textContent = emptyMessage;
    emptyStateEl.hidden = visibleCount !== 0;
  }

  // --- Rendering ---
  function render() {
    // Clear list and rebuild for simplicity and clarity.
    list.innerHTML = "";

    const visibleTodos =
      currentFilter === "active"
        ? todos.filter((t) => !t.completed)
        : currentFilter === "completed"
          ? todos.filter((t) => t.completed)
          : todos;

    for (const todo of visibleTodos) {
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

      // Animate only the last added item
      if (lastAddedId && todo.id === lastAddedId) {
        li.classList.add("is-new");
        window.setTimeout(() => li.classList.remove("is-new"), 260);
      }
    }

    updateBadgesAndEmptyState(visibleTodos.length);
    lastAddedId = null;
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

    const newTodo = {
      id: uid(),
      text,
      completed: false,
      createdAt: Date.now(),
    };
    todos.unshift(newTodo);
    lastAddedId = newTodo.id;

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

    if (action === "delete") {
      // Animate removal before updating data
      li.classList.add("is-removing");
      li.addEventListener(
        "animationend",
        () => {
          deleteTodo(id);
        },
        { once: true },
      );
    }
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

  // Filters
  for (const btn of filterButtons) {
    btn.addEventListener("click", () => {
      const next = /** @type {"all" | "active" | "completed"} */ (btn.dataset.filter);
      currentFilter = next;

      for (const b of filterButtons) {
        const isActive = b.dataset.filter === next;
        b.classList.toggle("is-active", isActive);
        b.setAttribute("aria-pressed", isActive ? "true" : "false");
      }

      render();
    });
  }

  // Initial render
  render();
})();

