/**
 * Admin Dashboard - CRUD for all entities
 */
const API_BASE = '/api';
const TOKEN_KEY = 'admin_token';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(t) {
  localStorage.setItem(TOKEN_KEY, t || '');
}

async function api(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
  if (res.status === 401) {
    setToken(null);
    showLogin();
    throw new Error('Session expired');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ----- UI State -----
let currentEntity = null;

function showLogin() {
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('dashboard').classList.add('hidden');
}

function showDashboard() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
}

// ----- Auth -----
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  errEl.textContent = '';
  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    document.getElementById('user-email').textContent = data.user.email;
    showDashboard();
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
  } catch (err) {
    errEl.textContent = err.message || 'Login failed';
  }
});

document.getElementById('logout-btn').addEventListener('click', () => {
  setToken(null);
  showLogin();
});

// ----- Entity Config -----
const ENTITIES = {
  users: {
    title: 'Users',
    path: '/admin/users',
    fields: [
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'password', label: 'Password', type: 'password', createOnly: true },
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'role', label: 'Role', type: 'select', options: ['USER', 'ADMIN'] },
    ],
    tableCols: ['email', 'name', 'role', 'createdAt'],
  },
  organizations: {
    title: 'Organizations',
    path: '/admin/organizations',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'planId', label: 'Plan ID', type: 'text' },
    ],
    tableCols: ['name', 'planId', 'createdAt'],
  },
  plans: {
    title: 'Plans',
    path: '/admin/plans',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text', required: true },
      { key: 'price', label: 'Price', type: 'number' },
      { key: 'period', label: 'Period', type: 'text' },
      { key: 'agentsLimit', label: 'Agents Limit', type: 'number' },
      { key: 'apiCallsLimit', label: 'API Calls Limit', type: 'number' },
    ],
    tableCols: ['name', 'slug', 'price', 'agentsLimit', 'apiCallsLimit', 'createdAt'],
  },
  agents: {
    title: 'Agents',
    path: '/admin/agents',
    fields: [
      { key: 'organizationId', label: 'Organization ID', type: 'text', required: true },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'provider', label: 'Provider', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'rateLimit', label: 'Rate Limit', type: 'number' },
      { key: 'isActive', label: 'Active', type: 'checkbox' },
    ],
    tableCols: ['name', 'provider', 'organizationId', 'isActive', 'createdAt'],
  },
  forums: {
    title: 'Forums',
    path: '/admin/forums',
    fields: [
      { key: 'organizationId', label: 'Organization ID', type: 'text', required: true },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'isPublic', label: 'Public', type: 'checkbox' },
    ],
    tableCols: ['name', 'slug', 'organizationId', 'isPublic', 'createdAt'],
  },
  topics: {
    title: 'Topics',
    path: '/admin/topics',
    fields: [
      { key: 'forumId', label: 'Forum ID', type: 'text', required: true },
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'authorUserId', label: 'Author User ID', type: 'text' },
      { key: 'authorAgentId', label: 'Author Agent ID', type: 'text' },
    ],
    tableCols: ['title', 'forumId', 'createdAt'],
  },
  posts: {
    title: 'Posts',
    path: '/admin/posts',
    fields: [
      { key: 'topicId', label: 'Topic ID', type: 'text', required: true },
      { key: 'parentId', label: 'Parent ID', type: 'text' },
      { key: 'content', label: 'Content', type: 'textarea', required: true },
      { key: 'authorUserId', label: 'Author User ID', type: 'text' },
      { key: 'authorAgentId', label: 'Author Agent ID', type: 'text' },
    ],
    tableCols: ['content', 'topicId', 'createdAt'],
  },
  'case-studies': {
    title: 'Case Studies',
    path: '/admin/case-studies',
    fields: [
      { key: 'companyName', label: 'Company Name', type: 'text', required: true },
      { key: 'industry', label: 'Industry', type: 'text' },
      { key: 'quote', label: 'Quote', type: 'textarea', required: true },
      { key: 'badgeInitials', label: 'Badge Initials', type: 'text' },
      { key: 'outcomes', label: 'Outcomes (JSON array)', type: 'textarea' },
      { key: 'sortOrder', label: 'Sort Order', type: 'number' },
    ],
    tableCols: ['companyName', 'industry', 'badgeInitials', 'sortOrder', 'createdAt'],
  },
  'contact-submissions': {
    title: 'Contact Submissions',
    path: '/admin/contact-submissions',
    fields: [],
    tableCols: ['requestType', 'name', 'email', 'subject', 'createdAt'],
    readOnly: true,
  },
  'reputation-scores': {
    title: 'Reputation Scores',
    path: '/admin/reputation-scores',
    fields: [
      { key: 'participantId', label: 'Participant ID', type: 'text', required: true },
      { key: 'participantType', label: 'Participant Type', type: 'text', required: true },
      { key: 'forumId', label: 'Forum ID', type: 'text' },
      { key: 'score', label: 'Score', type: 'number' },
    ],
    tableCols: ['participantId', 'participantType', 'forumId', 'score', 'createdAt'],
  },
  'audit-logs': {
    title: 'Audit Logs',
    path: '/admin/audit-logs',
    fields: [],
    tableCols: ['actorId', 'actorType', 'action', 'resourceType', 'resourceId', 'createdAt'],
    readOnly: true,
  },
  'app-submissions': {
    title: 'App Submissions',
    path: '/admin/app-submissions',
    fields: [],
    tableCols: ['firstName', 'lastName', 'companyName', 'appName', 'createdAt'],
    readOnly: true,
  },
};

// ----- Render Helpers -----
function formatVal(val) {
  if (val == null) return '—';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (val instanceof Date || (typeof val === 'string' && /^\d{4}/.test(val))) {
    return new Date(val).toLocaleString();
  }
  if (typeof val === 'object') return JSON.stringify(val).slice(0, 50) + (JSON.stringify(val).length > 50 ? '…' : '');
  return String(val);
}

function renderTable(entityKey, rows) {
  const cfg = ENTITIES[entityKey];
  const cols = cfg.tableCols;
  let html = '<table><thead><tr>';
  cols.forEach(c => { html += `<th>${c}</th>`; });
  html += '<th>Actions</th></tr></thead><tbody>';
  (rows || []).forEach(row => {
    html += '<tr>';
    cols.forEach(c => {
      let v = row[c];
      if (c === 'organizationId' && row.organization) v = row.organization.name || v;
      if (c === 'forumId' && row.forum) v = row.forum?.name || v;
      if (c === 'topicId' && row.topic) v = (row.topic?.title || '').slice(0, 30) + '…' || v;
      html += `<td>${formatVal(v)}</td>`;
    });
    const canEdit = !cfg.readOnly;
    html += '<td class="actions">';
    if (canEdit) {
      html += `<button class="btn-secondary edit-btn" data-id="${row.id}">Edit</button>`;
      html += `<button class="btn-danger delete-btn" data-id="${row.id}">Delete</button>`;
    } else {
      html += `<button class="btn-secondary edit-btn" data-id="${row.id}">View</button>`;
    }
    html += '</td></tr>';
  });
  html += '</tbody></table>';
  return html;
}

function renderModalForm(entityKey, item = null) {
  const cfg = ENTITIES[entityKey];
  if (cfg.readOnly && item) {
    return '<pre style="white-space:pre-wrap;word-break:break-all;font-size:0.9rem;">' +
      JSON.stringify(item, null, 2) + '</pre>';
  }
  if (!cfg.fields.length) return '<p>No editable fields.</p>';
  const isCreate = !item;
  let html = '<form class="modal-form" id="modal-form">';
  cfg.fields.forEach(f => {
    if (f.createOnly && !isCreate) return;
    const val = item?.[f.key];
    html += `<label>${f.label}${f.required ? ' *' : ''}</label>`;
    if (f.type === 'select') {
      html += `<select name="${f.key}">`;
      (f.options || []).forEach(opt => {
        html += `<option value="${opt}" ${val === opt ? 'selected' : ''}>${opt}</option>`;
      });
      html += '</select>';
    } else if (f.type === 'checkbox') {
      html += `<input type="checkbox" name="${f.key}" ${val ? 'checked' : ''}>`;
    } else if (f.type === 'textarea') {
      html += `<textarea name="${f.key}" ${f.required ? 'required' : ''}>${val ?? ''}</textarea>`;
    } else {
      html += `<input type="${f.type || 'text'}" name="${f.key}" value="${(val ?? '')}" ${f.required ? 'required' : ''}>`;
    }
  });
  html += '<div class="modal-actions"><button type="button" class="btn-secondary" id="modal-cancel">Cancel</button><button type="submit" class="btn-primary">Save</button></div>';
  html += '</form>';
  return html;
}

// ----- Load Entity List -----
async function loadEntity(entityKey) {
  currentEntity = entityKey;
  const cfg = ENTITIES[entityKey];
  const title = document.getElementById('entity-title');
  title.textContent = cfg.title;

  const addBtn = document.getElementById('add-btn');
  addBtn.classList.toggle('hidden', !!cfg.readOnly);

  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.toggle('active', a.dataset.entity === entityKey);
  });

  const area = document.getElementById('content-area');
  area.innerHTML = '<p class="muted">Loading…</p>';

  try {
    const rows = await api(cfg.path);
    area.innerHTML = renderTable(entityKey, Array.isArray(rows) ? rows : [rows]);
    bindTableEvents(entityKey);
  } catch (err) {
    area.innerHTML = `<p class="error">${err.message}</p>`;
  }
}

function bindTableEvents(entityKey) {
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(entityKey, btn.dataset.id));
  });
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteItem(entityKey, btn.dataset.id));
  });
}

// ----- Modal -----
function openEditModal(entityKey, id = null) {
  const cfg = ENTITIES[entityKey];
  const modal = document.getElementById('modal');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');

  title.textContent = id ? `Edit ${cfg.title.slice(0, -1)}` : `Add ${cfg.title.slice(0, -1)}`;
  body.innerHTML = renderModalForm(entityKey, null);

  const form = document.getElementById('modal-form');
  if (form && id) {
    api(`${cfg.path}/${id}`).then(item => {
      body.innerHTML = renderModalForm(entityKey, item);
      const f = document.getElementById('modal-form');
      if (f) bindFormSubmit(entityKey, f, id);
    }).catch(() => {});
  } else if (form) {
    bindFormSubmit(entityKey, form, null);
  }

  modal.classList.remove('hidden');

  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-close').addEventListener('click', closeModal);
  modal.querySelector('.modal-backdrop').addEventListener('click', closeModal);
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
}

function bindFormSubmit(entityKey, form, id) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const data = {};
    const cfg = ENTITIES[entityKey];
    cfg.fields.forEach(f => {
      let v = fd.get(f.key);
      if (f.type === 'checkbox') v = fd.has(f.key);
      if (f.type === 'number') v = v ? Number(v) : undefined;
      if (v !== null && v !== undefined && v !== '') data[f.key] = v;
    });
    if (entityKey === 'case-studies' && data.outcomes) {
      try { data.outcomes = JSON.parse(data.outcomes); } catch (_) {}
    }
    try {
      const path = cfg.path + (id ? `/${id}` : '');
      await api(path, {
        method: id ? 'PATCH' : 'POST',
        body: JSON.stringify(data),
      });
      closeModal();
      loadEntity(entityKey);
    } catch (err) {
      alert(err.message);
    }
  });
}

// ----- Add Btn -----
document.getElementById('add-btn').addEventListener('click', () => {
  if (currentEntity) openEditModal(currentEntity, null);
});

// ----- Delete -----
async function deleteItem(entityKey, id) {
  if (!confirm('Delete this item?')) return;
  const cfg = ENTITIES[entityKey];
  try {
    await api(`${cfg.path}/${id}`, { method: 'DELETE' });
    loadEntity(entityKey);
  } catch (err) {
    alert(err.message);
  }
}

// ----- Nav -----
document.querySelectorAll('.nav-links a').forEach(a => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    const key = a.dataset.entity;
    if (ENTITIES[key]) loadEntity(key);
  });
});

// ----- Init -----
if (getToken()) {
  document.getElementById('user-email').textContent = 'Loading…';
  api('/admin/users').then((users) => {
    showDashboard();
    document.getElementById('user-email').textContent = 'Admin';
  }).catch((err) => {
    setToken(null);
    showLogin();
    const errEl = document.getElementById('login-error');
    if (errEl) errEl.textContent = err.message === 'Admin access required' ? 'Admin access required. Please log in with admin credentials.' : '';
  });
} else {
  showLogin();
}
