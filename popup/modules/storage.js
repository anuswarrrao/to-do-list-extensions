// Storage module - handles all chrome.storage.sync operations

const STORAGE_KEY = "tasks";

// Get all tasks from storage
export async function getTasks() {
  try {
    const result = await chrome.storage.sync.get(STORAGE_KEY);
    return result[STORAGE_KEY] || [];
  } catch (error) {
    console.error(`Error getting tasks from chrome.storage.sync: ${error}`);
    return [];
  }
}

// Save tasks to storage
export async function saveTasks(tasks) {
  try {
    await chrome.storage.sync.set({ [STORAGE_KEY]: tasks });
  } catch (error) {
    console.error(`Error saving tasks to chrome.storage.sync: ${error}`);
  }
}

// Add a new task
export async function addTaskToStorage(taskValue) {
  const tasks = await getTasks();
  tasks.push({ value: taskValue, status: "pending", createdAt: Date.now() });
  await saveTasks(tasks);
}

// Remove a task by index
export async function removeTaskFromStorage(index) {
  const tasks = await getTasks();
  tasks.splice(index, 1);
  await saveTasks(tasks);
}

// Update task status
export async function updateTaskStatus(index, status) {
  const tasks = await getTasks();
  tasks[index].status = status;
  await saveTasks(tasks);
}

// Clear all tasks
export async function clearAllTasks() {
  await saveTasks([]);
}

// Save new order after drag and drop
export async function saveTaskOrder(items) {
  const newOrder = Array.from(items).map((item) => ({
    value: item.dataset.value,
    status: item.classList.contains("checked") ? "completed" : "pending",
    createdAt: item.dataset.createdAt ? Number(item.dataset.createdAt) : Date.now(),
  }));
  await saveTasks(newOrder);
}
