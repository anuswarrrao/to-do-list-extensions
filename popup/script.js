// Main entry point - initializes the application

import { elements, updateTime, updateDate, renderTaskList } from "./modules/ui.js";
import { setupEventListeners, addDragAndDropListeners } from "./modules/events.js";

// Initialize the app: set up date, time, and render existing tasks
async function initialize() {
  updateDate();
  updateTime();
  setInterval(updateTime, 1000);

  // Initialize the textarea height
  elements.inputBox.style.height = `${elements.inputBox.scrollHeight}px`;

  await renderTaskList();
  addDragAndDropListeners();
  elements.inputBox.focus();
}

// Set up event listeners and initialize when DOM is ready
setupEventListeners();
document.addEventListener("DOMContentLoaded", initialize);
