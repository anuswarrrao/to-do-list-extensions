![To Do List Extensions Preview](https://raw.githubusercontent.com/Anuswar/to-do-list-extensions/main/images/preview.jpg)

# To-Do List Extensions

A Chrome extension for managing tasks efficiently directly from your browser. Tasks persist across browser sessions using Chrome's sync storage.

### Key Features

- Add, edit, and delete tasks from a clean popup interface.
- Tap a task to toggle it complete/incomplete instantly.
- Double-tap a task to edit it inline.
- Long-press a task to drag and reorder.
- Filter tasks by **All**, **Active**, or **Completed**.
- Pending task counter shown as a badge on the extension icon.
- Clear all tasks with a double-confirm button.
- Full keyboard shortcut support (see below).
- Tasks persist across browser sessions via `chrome.storage.sync`.
- Modular JavaScript architecture (`events.js`, `ui.js`, `storage.js`).

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/anuswarrrao/to-do-list-extensions.git
   ```

2. Navigate to the project directory:

   ```bash
   cd to-do-list-extensions
   ```

3. Open Chrome and go to `chrome://extensions/`.
4. Enable **Developer mode** (toggle in the top-right corner).
5. Click **Load unpacked** and select the cloned directory.
6. The extension will be installed and ready to use.

## Keyboard Shortcuts

### Open the Popup

Due to Chrome security restrictions, the popup shortcut must be set manually once:

1. Go to `chrome://extensions/shortcuts`
2. Find **To-Do List** and set the shortcut to `Ctrl+Shift+L` (Windows/Linux) or `Command+Shift+L` (Mac)

> This only needs to be done once — Chrome remembers it permanently.

### In-Popup Shortcuts

These work automatically once the popup is open:

| Action | Windows / Linux | Mac |
|---|---|---|
| Focus first task | `Ctrl+A` (no task focused) | `Cmd+A` (no task focused) |
| Toggle focused task | `Ctrl+A` (task focused via Tab) | `Cmd+A` (task focused via Tab) |
| Cycle to next task | `Tab` | `Tab` |
| Cycle to previous task | `Shift+Tab` | `Shift+Tab` |
| Delete focused task | `Delete` | `Delete` |
| Clear input box | `Escape` | `Escape` |
| Remove all completed tasks | `Ctrl+Shift+D` | `Cmd+Shift+D` |
| Filter: All tasks | `F1` | `F1` |
| Filter: Active tasks | `F2` | `F2` |
| Filter: Completed tasks | `F3` | `F3` |

## Mouse / Touch Interaction

| Action | How | Result |
|---|---|---|
| Single tap | Click / tap a task | Toggles task complete/incomplete |
| Double tap | Two taps within 280ms | Opens inline edit mode |
| Long press | Hold 500ms then drag | Reorders tasks |
| Delete | Tap the × button | Removes the task |
| Clear all | Click **Clear** twice | Removes all tasks (confirms first) |

## Tech Stack

- **HTML** — popup structure (`popup/index.html`)
- **CSS** — styling (`popup/styles.css`)
- **JavaScript (ES Modules)** — split across:
  - `popup/script.js` — app entry point
  - `popup/modules/events.js` — all event listeners and interaction logic
  - `popup/modules/ui.js` — DOM rendering, filter state, pending counter
  - `popup/modules/storage.js` — `chrome.storage.sync` wrapper
  - `background.js` — service worker for toolbar badge updates
- **Chrome Extension APIs** — storage, action (badge), commands, manifest v3

## File Structure

```
to-do-list-extensions/
│
├── images/
│   ├── checked.png
│   ├── unchecked.png
│   ├── icon.png
│   └── preview.jpg
│
├── popup/
│   ├── index.html
│   ├── styles.css
│   ├── script.js
│   └── modules/
│       ├── events.js
│       ├── ui.js
│       └── storage.js
│
├── background.js
├── manifest.json
├── LICENSE.md
└── README.md
```

## Contributing

Contributions are welcome. To contribute:

1. Fork the repository.
2. Create a new branch for your feature or fix.
3. Commit your changes with clear messages.
4. Push to your fork and open a pull request to `main`.

## License

Licensed under the [MIT License](LICENSE.md).
