// UI module - handles DOM manipulation and rendering

import { getTasks } from "./storage.js";

// Cache DOM elements
export const elements = {
  inputBox: document.getElementById("input-box"),
  row: document.querySelector(".row"),
  listContainer: document.getElementById("list-container"),
  sortableList: document.querySelector(".sortable-list"),
  pendingNum: document.querySelector(".pending-num"),
  pendingLabel: document.querySelector(".pending-label"),
  clearButton: document.querySelector(".clear-button"),
  addTaskButton: document.getElementById("addTaskButton"),
  dateElement: document.getElementById("date"),
  hourElement: document.getElementById("hour"),
  filterBtns: document.querySelectorAll(".filter-btn"),
};

// Active filter: "all" | "active" | "completed"
export let activeFilter = "all";

export function setFilter(filter) {
  activeFilter = filter;
  elements.filterBtns.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filter === filter);
  });
}

// Update the time display
export function updateTime() {
  const data = new Date();
  const h = data.getHours();
  const m = data.getMinutes();
  const s = data.getSeconds();
  elements.hourElement.textContent = `${h < 10 ? "0" : ""}${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
}

// Update the date display
export function updateDate() {
  const data = new Date();
  elements.dateElement.textContent = data.toDateString();
}

// Convert *bold* _italic_ ~strike~ `code` markers to HTML
function parseFormat(text) {
  const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return escaped
    .replace(/\*([^*]+)\*/g, "<strong>$1</strong>")
    .replace(/_([^_]+)_/g, "<em>$1</em>")
    .replace(/~([^~]+)~/g, "<s>$1</s>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

// Render the task list from storage
export async function renderTaskList() {
  const fragment = document.createDocumentFragment();
  const tasks = await getTasks();

  const visible = tasks.filter((task) => {
    if (activeFilter === "active") return task.status === "pending";
    if (activeFilter === "completed") return task.status === "completed";
    return true;
  });

  visible.forEach((task) => {
    const storageIndex = tasks.indexOf(task);
    const taskItem = document.createElement("li");
    taskItem.dataset.value = task.value;
    taskItem.dataset.createdAt = task.createdAt || Date.now();
    taskItem.dataset.index = storageIndex;
    taskItem.className = "item";
    taskItem.draggable = false;
    taskItem.setAttribute("tabindex", "0");
    if (task.status === "completed") taskItem.classList.add("checked");
    taskItem.innerHTML = parseFormat(task.value);

    const removeSpan = document.createElement("span");
    removeSpan.textContent = "\u00D7";
    taskItem.appendChild(removeSpan);

    fragment.appendChild(taskItem);
  });

  elements.listContainer.innerHTML = "";
  if (visible.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-state";

    const img = document.createElement("img");
    img.src = "/images/checked.png";
    img.alt = "";

    const text = document.createElement("p");
    text.textContent = tasks.length === 0 ? "No tasks yet!" : "Nothing here!";

    empty.appendChild(img);
    empty.appendChild(text);
    elements.listContainer.appendChild(empty);
  } else {
    elements.listContainer.appendChild(fragment);
  }

  await updatePendingTasks(tasks);
}

// Update the pending tasks counter
// Accepts an optional tasks array to avoid a redundant storage fetch
export async function updatePendingTasks(tasks) {
  if (!tasks) tasks = await getTasks();
  const count = tasks.filter((task) => task.status === "pending").length;
  elements.pendingNum.textContent = count > 99 ? "+99" : count.toString();
  elements.pendingLabel.textContent = count === 1 ? "Task left" : "Tasks left";
  elements.clearButton.style.pointerEvents = tasks.length === 0 ? "none" : "auto";
}

// Automatically expand the textarea as the user types
export function autoExpandTextarea() {
  const el = elements.inputBox;
  el.style.height = "auto";
  const lineHeight = parseInt(getComputedStyle(el).lineHeight);
  const paddingTop = parseInt(getComputedStyle(el).paddingTop);
  const paddingBottom = parseInt(getComputedStyle(el).paddingBottom);
  const singleLineHeight = lineHeight + paddingTop + paddingBottom;
  el.style.height = `${Math.max(el.scrollHeight, singleLineHeight)}px`;
  const lines = Math.round((el.scrollHeight - paddingTop - paddingBottom) / lineHeight);
  elements.row.classList.toggle("multiline", lines > 1);
}

// Apply error styles to the row
export function applyErrorStyles() {
  elements.row.classList.add("error-row");
  elements.inputBox.placeholder = "Please add a task!";
}

// Remove error styles from the row
export function removeErrorStyles() {
  elements.row.classList.remove("error-row");
  elements.inputBox.placeholder = "Add your task";
}

// Initialize sortable list for drag-and-drop
export function initSortableList(e) {
  e.preventDefault();
  const draggingItem = document.querySelector(".dragging");
  if (!draggingItem) return;

  const siblings = [...elements.sortableList.querySelectorAll(".item:not(.dragging)")];
  const nextSibling = siblings.find((sibling) => {
    return e.clientY <= sibling.offsetTop + sibling.offsetHeight / 2;
  });

  if (nextSibling) {
    elements.sortableList.insertBefore(draggingItem, nextSibling);
  } else {
    elements.sortableList.appendChild(draggingItem);
  }
}
