const STORAGE_KEY = 'bloom-todo-v1';
const EMOJIS = ['✨', '📚', '💪', '💻', '🧘', '🎨', '🛒', '🌱', '💌', '🎯', '☕', '🧹', '🎉', '💡', '📝', '🏃'];
const app = document.querySelector('#app');
let store = readStore();
let currentUser = store.session || '';
let activePlan = 'daily';
let selectedEmoji = '✨';
let toastTimer;

function readStore() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return { users: data.users && typeof data.users === 'object' ? data.users : {}, session: data.session || '' };
  } catch {
    return { users: {}, session: '' };
  }
}

function saveStore() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function removePastDueTasks() {
  const today = todayKey();
  let changed = false;
  Object.values(store.users).forEach((user) => {
    if (!Array.isArray(user.tasks)) return;
    const currentTasks = user.tasks.filter((task) => {
      const hasValidDate = typeof task.dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(task.dueDate);
      return !hasValidDate || task.dueDate >= today;
    });
    if (currentTasks.length !== user.tasks.length) {
      user.tasks = currentTasks;
      changed = true;
    }
  });
  if (changed) saveStore();
}

removePastDueTasks();

function getTasks() {
  return store.users[currentUser]?.tasks || [];
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function todayKey() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

function prettyDate(date) {
  return new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(date);
}

function render() {
  if (!currentUser || !store.users[currentUser]) {
    currentUser = '';
    renderAuth();
    return;
  }
  renderDashboard();
}

function renderAuth(mode = 'login', error = '') {
  const registering = mode === 'register';
  app.innerHTML = `
    <section class="auth-card" aria-label="Nova sign in">
      <div class="brand"><span class="brand-mark">✿</span><span>Nova</span></div>
      <h1>${registering ? 'Let’s get growing' : 'A little more lovely'}</h1>
      <p class="auth-subtitle">${registering ? 'Create your space for little plans and big wins.' : 'Your plans, your pace. Pick up where you left off.'}</p>
      <div class="auth-tabs" role="tablist" aria-label="Account options">
        <button class="auth-tab ${!registering ? 'active' : ''}" type="button" data-auth-mode="login">Log in</button>
        <button class="auth-tab ${registering ? 'active' : ''}" type="button" data-auth-mode="register">Create account</button>
      </div>
      <form id="auth-form" data-mode="${mode}">
        ${registering ? '<div class="field"><label for="display-name">Your name</label><input id="display-name" name="displayName" type="text" maxlength="40" placeholder="What should we call you?" autocomplete="name" required /></div>' : ''}
        <div class="field"><label for="email">Email</label><input id="email" name="email" type="email" placeholder="you@example.com" autocomplete="email" required /></div>
        <div class="field"><label for="password">Password</label><input id="password" name="password" type="password" minlength="4" placeholder="At least 4 characters" autocomplete="${registering ? 'new-password' : 'current-password'}" required /></div>
        ${error ? `<p role="alert" style="margin:0 0 12px;color:#d85f76;font-size:13px">${escapeHtml(error)}</p>` : ''}
        <button class="primary-btn auth-submit" type="submit">${registering ? 'Create my account' : 'Log in to Nova'} <span aria-hidden="true">→</span></button>
      </form>
      <p class="auth-note">🔒 Local demo only: use the same browser and project address you used to create your account. Creating an account signs you in automatically. No secure authentication or sync.</p>
    </section>`;
}

function renderDashboard() {
  const tasks = getTasks();
  const filtered = tasks.filter((task) => task.plan === activePlan);
  const completed = filtered.filter((task) => task.done).length;
  const name = store.users[currentUser].name || currentUser.split('@')[0];
  const date = new Date();
  app.innerHTML = `
    <section class="dashboard" aria-label="To-do planner">
      <aside class="sidebar">
        <div class="brand"><span class="brand-mark">✿</span><span>Nova</span></div>
        <div class="side-label">Your plans</div>
        <nav class="nav-list" aria-label="Plan type">
          <button class="nav-item ${activePlan === 'daily' ? 'active' : ''}" type="button" data-plan="daily" aria-pressed="${activePlan === 'daily'}"><span class="nav-icon">☀️</span><span class="nav-text">Daily plan</span><span class="nav-count">${tasks.filter((task) => task.plan === 'daily').length}</span></button>
          <button class="nav-item ${activePlan === 'monthly' ? 'active' : ''}" type="button" data-plan="monthly" aria-pressed="${activePlan === 'monthly'}"><span class="nav-icon">🗓️</span><span class="nav-text">Monthly plan</span><span class="nav-count">${tasks.filter((task) => task.plan === 'monthly').length}</span></button>
        </nav>
        <div class="sidebar-bottom"><div class="tip-card"><span class="tip-emoji">🌷</span><p>Small steps still move you forward. Celebrate what you finish today.</p></div></div>
      </aside>
      <section class="main-panel">
        <header class="topbar">
          <div class="date-label">${escapeHtml(prettyDate(date))}</div>
          <div class="user-menu"><div class="avatar" aria-hidden="true">${escapeHtml(name.trim().charAt(0).toUpperCase() || 'B')}</div><span class="user-name">${escapeHtml(name)}</span><button class="logout-btn" type="button" data-action="logout">Log out</button></div>
        </header>
        <div class="greeting"><div><h1>${activePlan === 'daily' ? `Hey, ${escapeHtml(name)} ✨` : 'Your month, your magic ✨'}</h1><p>${activePlan === 'daily' ? 'Make today count, one little thing at a time.' : 'Give your bigger goals a little room to bloom.'}</p></div><span class="greeting-sparkle" aria-hidden="true">${activePlan === 'daily' ? '🌤️' : '🌙'}</span></div>
        <div class="summary-grid">
          <article class="summary-card total"><div class="summary-heading"><span>${activePlan === 'daily' ? 'TODAY’S LITTLE PLANS' : 'THIS MONTH’S PLANS'}</span><span class="summary-emoji">🪄</span></div><div class="summary-number">${filtered.length}</div><div class="summary-caption">${filtered.length === 1 ? 'one thing on your list' : 'things on your list'}</div></article>
          <article class="summary-card done"><div class="summary-heading"><span>ALREADY BLOOMING</span><span class="summary-emoji">🌿</span></div><div class="summary-number">${completed}<span style="color:#9c99ab;font-size:18px;font-weight:600"> / ${filtered.length}</span></div><div class="summary-caption">${filtered.length && completed === filtered.length ? 'you did it — lovely work!' : 'little wins add up'}</div></article>
        </div>
        <div class="list-heading"><h2>${activePlan === 'daily' ? 'Your daily list' : 'Your monthly list'}</h2><button class="primary-btn add-btn" type="button" data-action="add">＋ &nbsp;Add a plan</button></div>
        <div class="task-list">${filtered.length ? filtered.map(renderTask).join('') : `<div class="empty-state"><div class="empty-emoji">${activePlan === 'daily' ? '🌼' : '🌙'}</div><h3>A fresh page, full of possibility</h3><p>Add your first ${activePlan} plan and watch your progress bloom.</p></div>`}</div>
      </section>
    </section>`;
}

function renderTask(task) {
  const dueLabel = task.dueDate ? `Due ${new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(`${task.dueDate}T12:00:00`))}` : (task.plan === 'daily' ? 'A little step for today' : 'A goal for this month');
  return `<article class="task-card ${task.done ? 'completed' : ''}">
    <input class="task-check" type="checkbox" data-action="toggle" data-id="${escapeHtml(task.id)}" aria-label="Mark ${escapeHtml(task.title)} ${task.done ? 'not done' : 'done'}" ${task.done ? 'checked' : ''} />
    <div><div class="task-title"><span aria-hidden="true">${escapeHtml(task.emoji || '✨')}</span><span class="task-title-text">${escapeHtml(task.title)}</span></div><div class="task-meta">${escapeHtml(dueLabel)}</div></div>
    <div class="task-actions"><button class="icon-btn" type="button" data-action="edit" data-id="${escapeHtml(task.id)}" aria-label="Edit ${escapeHtml(task.title)}" title="Edit">✎</button><button class="icon-btn delete" type="button" data-action="delete" data-id="${escapeHtml(task.id)}" aria-label="Delete ${escapeHtml(task.title)}" title="Delete">×</button></div>
  </article>`;
}

function openTaskModal(task = null) {
  selectedEmoji = task?.emoji || '✨';
  const editing = Boolean(task);
  const emojiOptions = EMOJIS.map((emoji) => `<button class="emoji-option ${selectedEmoji === emoji ? 'selected' : ''}" type="button" data-emoji="${emoji}" aria-label="Choose ${emoji}" aria-pressed="${selectedEmoji === emoji}">${emoji}</button>`).join('');
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.id = 'modal-backdrop';
  modal.innerHTML = `<section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <div class="modal-header"><h2 id="modal-title">${editing ? 'A little edit ✏️' : 'Add a little plan ✨'}</h2><button class="modal-close" type="button" data-action="close-modal" aria-label="Close">×</button></div>
    <form id="task-form" data-id="${editing ? escapeHtml(task.id) : ''}">
      <div class="field"><label for="task-title">What would you like to do?</label><input id="task-title" name="title" type="text" maxlength="100" placeholder="e.g. Take a little walk" value="${editing ? escapeHtml(task.title) : ''}" required /></div>
      <div class="field"><label>Pick a mood</label><div class="emoji-picker">${emojiOptions}</div><input type="hidden" name="emoji" value="${escapeHtml(selectedEmoji)}" /></div>
      <div class="modal-row"><div class="field"><label for="task-plan">Plan type</label><select id="task-plan" name="plan"><option value="daily" ${(!editing && activePlan === 'daily') || task?.plan === 'daily' ? 'selected' : ''}>☀️ Daily</option><option value="monthly" ${(!editing && activePlan === 'monthly') || task?.plan === 'monthly' ? 'selected' : ''}>🗓️ Monthly</option></select></div><div class="field"><label for="task-date">Due date <span style="color:#aaa;font-weight:400">(optional)</span></label><input id="task-date" name="dueDate" type="date" value="${editing ? escapeHtml(task.dueDate || '') : ''}" /></div></div>
      <button class="primary-btn modal-submit" type="submit">${editing ? 'Save changes' : 'Add to my list'}</button>
    </form>
  </section>`;
  app.append(modal);
  document.querySelector('#task-title').focus();
}

function showToast(message) {
  document.querySelector('.toast')?.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.textContent = message;
  document.body.append(toast);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.remove(), 2300);
}

app.addEventListener('click', (event) => {
  const target = event.target.closest('button');
  if (!target) {
    if (event.target.id === 'modal-backdrop') document.querySelector('#modal-backdrop')?.remove();
    return;
  }
  if (target.dataset.authMode) {
    renderAuth(target.dataset.authMode);
    return;
  }
  if (target.dataset.plan) {
    activePlan = target.dataset.plan;
    renderDashboard();
    return;
  }
  if (target.dataset.emoji) {
    selectedEmoji = target.dataset.emoji;
    document.querySelectorAll('.emoji-option').forEach((button) => {
      const chosen = button.dataset.emoji === selectedEmoji;
      button.classList.toggle('selected', chosen);
      button.setAttribute('aria-pressed', String(chosen));
    });
    document.querySelector('[name="emoji"]').value = selectedEmoji;
    return;
  }
  const { action, id } = target.dataset;
  if (action === 'logout') {
    currentUser = '';
    store.session = '';
    saveStore();
    renderAuth();
  } else if (action === 'add') {
    openTaskModal();
  } else if (action === 'close-modal') {
    document.querySelector('#modal-backdrop')?.remove();
  } else if (action === 'edit') {
    const task = getTasks().find((item) => item.id === id);
    if (task) openTaskModal(task);
  } else if (action === 'delete') {
    const task = getTasks().find((item) => item.id === id);
    if (!task) return;
    store.users[currentUser].tasks = getTasks().filter((item) => item.id !== id);
    saveStore();
    renderDashboard();
    showToast('Plan gently removed.');
  }
});

app.addEventListener('change', (event) => {
  const checkbox = event.target.closest('[data-action="toggle"]');
  if (!checkbox) return;
  const task = getTasks().find((item) => item.id === checkbox.dataset.id);
  if (!task) return;
  task.done = checkbox.checked;
  saveStore();
  renderDashboard();
  showToast(task.done ? 'Lovely work — one more little win! 🌱' : 'Moved back to your to-do list.');
});

app.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.target;
  if (form.id === 'auth-form') {
    const data = new FormData(form);
    const email = String(data.get('email')).trim().toLowerCase();
    const password = String(data.get('password'));
    if (form.dataset.mode === 'register') {
      if (store.users[email]) {
        renderAuth('register', 'An account with this email already exists. Try logging in.');
        return;
      }
      store.users[email] = { name: String(data.get('displayName')).trim(), password, tasks: [] };
    } else {
      if (!store.users[email]) {
        renderAuth('login', 'No account for this email is saved in this browser. Use the same browser and project address you registered with, or create the account here again.');
        return;
      }
      if (store.users[email].password !== password) {
        renderAuth('login', 'That password doesn’t match this account. Check it and try again.');
        return;
      }
    }
    currentUser = email;
    store.session = email;
    saveStore();
    render();
    return;
  }
  if (form.id === 'task-form') {
    const data = new FormData(form);
    const tasks = getTasks();
    const existing = tasks.find((item) => item.id === form.dataset.id);
    if (existing) {
      existing.title = String(data.get('title')).trim();
      existing.emoji = String(data.get('emoji'));
      existing.plan = String(data.get('plan'));
      existing.dueDate = String(data.get('dueDate'));
    } else {
      tasks.unshift({ id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`, title: String(data.get('title')).trim(), emoji: String(data.get('emoji')), plan: String(data.get('plan')), dueDate: String(data.get('dueDate')), done: false, createdAt: todayKey() });
    }
    saveStore();
    activePlan = String(data.get('plan'));
    renderDashboard();
    showToast(existing ? 'Your changes are saved ✨' : 'A fresh plan, ready to bloom 🌷');
  }
});

render();
