(() => {
  const STORAGE_KEY = 'myTodoList.v1';
  const $ = (id) => document.getElementById(id);
  const todayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };
  const formatDate = (iso, options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) => {
    if (!iso) return '';
    const [y,m,d] = iso.split('-').map(Number);
    return new Date(y, m-1, d).toLocaleDateString('id-ID', options);
  };
  const defaultState = () => ({ profile: { name: 'Nama Pengguna', role: 'Mahasiswa' }, tasks: [] });
  let state;
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    state = saved && saved.profile && Array.isArray(saved.tasks) ? saved : defaultState();
  } catch { state = defaultState(); }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch { alert('Penyimpanan browser tidak tersedia. Tugas mungkin tidak tersimpan setelah halaman ditutup.'); }
  }
  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function renderProfile() {
    $('profileName').textContent = state.profile.name;
    $('profileRole').textContent = state.profile.role;
    $('avatar').textContent = (state.profile.name.trim()[0] || 'U').toLocaleUpperCase('id-ID');
  }
  function renderDate() {
    const today = todayISO();
    $('todayText').textContent = formatDate(today);
    $('dayNumber').textContent = String(Number(today.slice(-2))).padStart(2, '0');
    if (!$('taskDate').value) $('taskDate').value = today;
    if (!$('filterDate').value) $('filterDate').value = today;
  }
  function taskCard(task) {
    const priorityClass = task.priority.toLowerCase();
    return `<article class="task ${task.done ? 'done' : ''}">
      <input class="task-check" type="checkbox" aria-label="Tandai ${escapeHTML(task.title)} selesai" data-action="toggle" data-id="${task.id}" ${task.done ? 'checked' : ''}>
      <div class="task-main">
        <div class="task-title">${escapeHTML(task.title)}</div>
        <div class="task-meta"><span class="pill ${priorityClass}">${escapeHTML(task.priority)}</span><span>📅 ${escapeHTML(formatDate(task.date, {day:'numeric', month:'short', year:'numeric'}))}</span></div>
      </div>
      <button class="delete-one" type="button" aria-label="Hapus tugas ${escapeHTML(task.title)}" title="Hapus tugas" data-action="delete" data-id="${task.id}">🗑</button>
    </article>`;
  }
  function renderTasks() {
    const filter = $('filterDate').value;
    const active = state.tasks.filter(t => !t.done && (!filter || t.date === filter)).sort((a,b) => a.date.localeCompare(b.date) || ({High:0,Medium:1,Low:2}[a.priority] - {High:0,Medium:1,Low:2}[b.priority]));
    const completed = state.tasks.filter(t => t.done && (!filter || t.date === filter)).sort((a,b) => b.completedAt - a.completedAt);
    $('todoList').innerHTML = active.length ? active.map(taskCard).join('') : '<div class="empty">Tidak ada tugas yang perlu dikerjakan pada tanggal ini. 🌿</div>';
    $('doneList').innerHTML = completed.length ? completed.map(taskCard).join('') : '<div class="empty">Tugas yang selesai akan muncul di sini. ✨</div>';
    $('todoCount').textContent = `${active.length} tugas`;
    $('doneCount').textContent = `${completed.length} tugas`;
  }
  function render() { renderProfile(); renderDate(); renderTasks(); }
  $('taskForm').addEventListener('submit', event => {
    event.preventDefault();
    const title = $('taskTitle').value.trim();
    const date = $('taskDate').value;
    const priority = document.querySelector('input[name="priority"]:checked')?.value || 'Medium';
    if (!title || !date) return;
    state.tasks.push({ id: (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`), title, date, priority, done: false, createdAt: Date.now(), completedAt: null });
    save();
    $('taskTitle').value = '';
    $('filterDate').value = date;
    renderTasks();
    $('taskTitle').focus();
  });
  document.addEventListener('change', event => {
    const target = event.target;
    if (target.matches('[data-action="toggle"]')) {
      const task = state.tasks.find(t => t.id === target.dataset.id);
      if (!task) return;
      task.done = target.checked;
      task.completedAt = task.done ? Date.now() : null;
      save(); renderTasks();
    }
  });
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-action="delete"]');
    if (!button) return;
    const task = state.tasks.find(t => t.id === button.dataset.id);
    if (!task) return;
    if (confirm(`Hapus tugas "${task.title}"?`)) {
      state.tasks = state.tasks.filter(t => t.id !== task.id);
      save(); renderTasks();
    }
  });
  $('filterDate').addEventListener('change', renderTasks);
  $('showAllBtn').addEventListener('click', () => { $('filterDate').value = ''; renderTasks(); });
  $('deleteAllBtn').addEventListener('click', () => {
    if (!state.tasks.length) { alert('Belum ada tugas untuk dihapus.'); return; }
    if (confirm('Yakin ingin menghapus SEMUA tugas, termasuk yang sudah selesai? Tindakan ini tidak bisa dibatalkan.')) {
      state.tasks = []; save(); renderTasks();
    }
  });
  $('editProfileBtn').addEventListener('click', () => {
    $('nameInput').value = state.profile.name;
    $('roleInput').value = state.profile.role;
    $('profileDialog').showModal();
  });
  $('cancelProfile').addEventListener('click', () => $('profileDialog').close());
  $('profileForm').addEventListener('submit', event => {
    event.preventDefault();
    const name = $('nameInput').value.trim();
    const role = $('roleInput').value.trim();
    if (!name || !role) return;
    state.profile = { name, role }; save(); renderProfile(); $('profileDialog').close();
  });
  render();
})();
