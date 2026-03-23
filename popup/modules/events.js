// Events module - handles all event listeners and handlers

import {
  addTaskToStorage,
  updateTaskStatus,
  clearAllTasks,
  saveTaskOrder,
  saveTasks,
  getTasks,
} from "./storage.js";

import {
  elements,
  renderTaskList,
  autoExpandTextarea,
  applyErrorStyles,
  removeErrorStyles,
  initSortableList,
  setFilter,
} from "./ui.js";

// Keep the input box focused if the user clicks elsewhere on the page
function keepInputFocused(e) {
  // Don't refocus if clicking on the task list (prevents scroll jump)
  if (elements.listContainer.contains(e.target)) {
    return;
  }
  if (e.target !== elements.inputBox) {
    elements.inputBox.focus();
  }
}

// Enter inline edit mode for a task
function startEdit(item) {
  if (item.dataset.editing === "1") return;
  item.dataset.editing = "1";

  const originalText = item.dataset.value;
  const textarea = document.createElement("textarea");
  textarea.value = originalText;
  textarea.rows = 1;

  const span = item.querySelector("span");
  item.textContent = "";
  item.appendChild(textarea);
  item.appendChild(span);

  // Block all pointer/click events inside textarea from reaching the item
  textarea.addEventListener("pointerdown", (e) => e.stopPropagation());
  textarea.addEventListener("pointerup", (e) => e.stopPropagation());
  textarea.addEventListener("click", (e) => e.stopPropagation());

  textarea.style.height = "auto";
  textarea.style.height = textarea.scrollHeight + "px";
  textarea.addEventListener("input", () => {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  });

  let committed = false;
  async function commitEdit() {
    if (committed) return;
    committed = true;
    const newValue = textarea.value.trim();
    delete item.dataset.editing;
    if (newValue && newValue !== originalText) {
      const index = Array.from(elements.listContainer.children).indexOf(item);
      const tasks = await getTasks();
      tasks[index].value = newValue;
      await saveTasks(tasks);
    }
    await renderTaskList();
    addItemListeners();
  }

  textarea.addEventListener("blur", commitEdit);
  textarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); textarea.blur(); }
    if (e.key === "Escape") { textarea.value = originalText; textarea.blur(); }
  });

  textarea.focus();
  textarea.select();
}

// Handle input expansion on typing
function handleInputExpand() {
  autoExpandTextarea();
}

// Add a new task when the user presses the "Enter" key
function handleKeyPress(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    addTask();
  }
}

// Add a new task to the list
export async function addTask() {
  let taskValue = elements.inputBox.value.trim();
  if (!taskValue) {
    applyErrorStyles();
    return;
  }

  await addTaskToStorage(taskValue);

  await renderTaskList();
  addDragAndDropListeners();
  elements.inputBox.value = "";
  removeErrorStyles();
  autoExpandTextarea();
}

// Clear all tasks from the list — requires double-click confirmation
let clearPending = false;
let clearPendingTimer = null;

async function clearTasks() {
  const tasks = await getTasks();
  if (tasks.length === 0) return;

  if (!clearPending) {
    clearPending = true;
    elements.clearButton.textContent = "Are you sure?";
    clearPendingTimer = setTimeout(() => {
      clearPending = false;
      elements.clearButton.textContent = "Clear";
    }, 3000);
    return;
  }

  clearTimeout(clearPendingTimer);
  clearPending = false;
  elements.clearButton.textContent = "Clear";
  await clearAllTasks();
  await renderTaskList();
  addItemListeners();
  elements.inputBox.focus();
}

// Attach all per-item listeners: single tap = toggle, double tap = edit, long press = drag, × = delete
export function addItemListeners() {
  const items = elements.sortableList.querySelectorAll(".item");
  items.forEach((item) => {
    if (item.dataset.listenersAttached) return;
    item.dataset.listenersAttached = "1";
    item.draggable = false;

    let longPressTimer = null;
    let tapTimer = null;
    let isDragging = false;
    let tapCount = 0;

    // --- Pointer down: start long-press timer ---
    item.addEventListener("pointerdown", (e) => {
      if (e.target.tagName === "SPAN") return;
      if (item.dataset.editing === "1") return;

      isDragging = false;
      longPressTimer = setTimeout(() => {
        isDragging = true;
        item.draggable = true;
      }, 500);
    });

    // --- Pointer up: single tap = toggle after 280ms, second tap within 280ms = edit ---
    item.addEventListener("pointerup", (e) => {
      if (e.target.tagName === "SPAN") return;
      if (item.dataset.editing === "1") return;

      const wasLongPress = isDragging;
      clearTimeout(longPressTimer);

      if (wasLongPress) return;

      tapCount++;

      if (tapCount === 1) {
        tapTimer = setTimeout(() => {
          tapCount = 0;
        }, 280);

        // Toggle immediately — no delay
        item.classList.toggle("checked");
        const index = parseInt(item.dataset.index, 10);
        const status = item.classList.contains("checked") ? "completed" : "pending";
        // Update counter from DOM (no storage read)
        const allItems = elements.listContainer.querySelectorAll(".item");
        const pendingCount = Array.from(allItems).filter((i) => !i.classList.contains("checked")).length;
        elements.pendingNum.textContent = pendingCount > 99 ? "+99" : pendingCount.toString();
        elements.pendingLabel.textContent = pendingCount === 1 ? "Task left" : "Tasks left";
        // Save to storage — re-render only if filter hides this item
        updateTaskStatus(index, status).then(async () => {
          const { activeFilter } = await import("./ui.js");
          const hidden =
            (activeFilter === "active" && status === "completed") ||
            (activeFilter === "completed" && status === "pending");
          if (hidden) {
            await renderTaskList();
            addItemListeners();
          }
        });
      } else {
        // Second tap within 280ms: undo the toggle, open edit instead
        clearTimeout(tapTimer);
        tapCount = 0;
        item.classList.toggle("checked"); // revert
        startEdit(item);
      }
    });

    item.addEventListener("pointercancel", () => {
      clearTimeout(longPressTimer);
      isDragging = false;
      item.draggable = false;
    });

    // --- Drag events ---
    item.addEventListener("dragstart", () => {
      item.classList.add("dragging");
    });

    item.addEventListener("dragend", async () => {
      item.classList.remove("dragging");
      item.draggable = false;
      isDragging = false;
      const allItems = document.querySelectorAll(".item");
      await saveTaskOrder(allItems);
    });

    // Block synthetic click events from firing toggle after drag or double-tap
    item.addEventListener("click", (e) => {
      if (e.target.tagName === "SPAN") return;
      e.stopPropagation(); // prevent keepInputFocused refocus conflict
    });

    // --- × delete button ---
    const span = item.querySelector("span");
    span.addEventListener("pointerdown", (e) => e.stopPropagation());
    span.addEventListener("pointerup", async (e) => {
      e.stopPropagation();
      if (item.dataset.editing === "1") return; // don't delete while editing
      const index = Array.from(elements.listContainer.children).indexOf(item);
      const tasks = await getTasks();
      tasks.splice(index, 1);
      await saveTasks(tasks);
      await renderTaskList();
      addItemListeners();
    });
  });
}

// Keep backward-compat alias used by addTask / renderTaskList call sites
export const addDragAndDropListeners = addItemListeners;

// Handle global keyboard shortcuts
async function handleGlobalKeydown(e) {
  const tag = document.activeElement.tagName;
  const inTextarea = tag === "TEXTAREA" || tag === "INPUT";

  // Escape — clear the input box (only when input is focused)
  if (e.key === "Escape" && inTextarea) {
    e.preventDefault();
    elements.inputBox.value = "";
    removeErrorStyles();
    autoExpandTextarea();
    return;
  }

  // F1 / F2 / F3 — switch filters
  if (e.key === "F1") { e.preventDefault(); setFilter("all");       await renderTaskList(); addItemListeners(); return; }
  if (e.key === "F2") { e.preventDefault(); setFilter("active");    await renderTaskList(); addItemListeners(); return; }
  if (e.key === "F3") { e.preventDefault(); setFilter("completed"); await renderTaskList(); addItemListeners(); return; }

  // Ctrl+A — if a task is focused: toggle it; otherwise focus first task
  if (e.ctrlKey && e.key === "a" && !inTextarea) {
    e.preventDefault();
    const items = [...elements.listContainer.querySelectorAll(".item")];
    if (items.length === 0) return;
    const focused = items.find((i) => i === document.activeElement);
    if (focused) {
      // Toggle the focused task
      focused.classList.toggle("checked");
      const index = parseInt(focused.dataset.index, 10);
      const status = focused.classList.contains("checked") ? "completed" : "pending";
      await updateTaskStatus(index, status);
      const tasks = await getTasks();
      const pendingCount = tasks.filter((t) => t.status === "pending").length;
      elements.pendingNum.textContent = pendingCount > 99 ? "+99" : String(pendingCount);
      elements.pendingLabel.textContent = pendingCount === 1 ? "Task left" : "Tasks left";
    } else {
      // No task focused — focus the first one
      items[0].setAttribute("tabindex", "0");
      items[0].focus();
    }
    return;
  }

  // Ctrl+Shift+D — remove all completed tasks
  if (e.ctrlKey && e.shiftKey && e.key === "D") {
    e.preventDefault();
    const tasks = await getTasks();
    await saveTasks(tasks.filter((t) => t.status !== "completed"));
    await renderTaskList();
    addItemListeners();
    return;
  }

  // Tab — cycle focus through visible task items
  if (e.key === "Tab" && !inTextarea) {
    e.preventDefault();
    const items = [...elements.listContainer.querySelectorAll(".item")];
    if (items.length === 0) return;
    const current = items.indexOf(document.activeElement);
    const next = e.shiftKey
      ? (current <= 0 ? items.length - 1 : current - 1)
      : (current >= items.length - 1 ? 0 : current + 1);
    items[next].setAttribute("tabindex", "0");
    items[next].focus();
    return;
  }

  // Delete — remove the focused task
  if (e.key === "Delete" && !inTextarea) {
    const focused = document.activeElement;
    if (!focused.classList.contains("item")) return;
    e.preventDefault();
    const index = Array.from(elements.listContainer.children).indexOf(focused);
    const tasks = await getTasks();
    tasks.splice(index, 1);
    await saveTasks(tasks);
    await renderTaskList();
    addItemListeners();
    // Move focus to next available item
    const remaining = [...elements.listContainer.querySelectorAll(".item")];
    if (remaining.length > 0) {
      const nextIndex = Math.min(index, remaining.length - 1);
      remaining[nextIndex].setAttribute("tabindex", "0");
      remaining[nextIndex].focus();
    } else {
      elements.inputBox.focus();
    }
    return;
  }
}

// Set up all event listeners
export function setupEventListeners() {
  document.body.addEventListener("click", keepInputFocused);
  document.addEventListener("keydown", handleGlobalKeydown);
  elements.sortableList.addEventListener("dragover", initSortableList);
  elements.sortableList.addEventListener("dragenter", (e) => e.preventDefault());
  elements.inputBox.addEventListener("input", handleInputExpand);
  elements.inputBox.addEventListener("input", removeErrorStyles);
  elements.inputBox.addEventListener("keypress", handleKeyPress);
  elements.addTaskButton.addEventListener("click", addTask);
  elements.clearButton.addEventListener("click", clearTasks);

  elements.filterBtns.forEach((btn) => {
    btn.addEventListener("click", async () => {
      setFilter(btn.dataset.filter);
      await renderTaskList();
      addItemListeners();
    });
  });
}
