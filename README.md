# Nova — To-Do Planner

A small, colorful daily and monthly planner built with plain HTML, CSS, and JavaScript. It runs in your browser and saves accounts and plans locally on your device.

## Use

Open `index.html` in a modern browser. Choose **Create account** for a new local profile or **Log in** to use an existing one. Add tasks, choose an emoji, select a daily or monthly plan, and set an optional due date. Check tasks off when complete; edit or remove them with the action buttons.

Your login and task data are stored in this browser's `localStorage`. This is a basic demo, not secure authentication: do not use a real password or sensitive information. Data is not synced between browsers or devices.

## Features

- Local demo login and account creation
- Daily and monthly plan filters
- Add, edit, delete, and complete tasks
- Emoji and optional due dates
- Progress summary and responsive colorful interface
- Per-account browser storage
- Past-due tasks with a due date are automatically removed when the app opens; tasks due today or later are kept
