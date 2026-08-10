const API = ''; // same-origin; API is mounted at /api on this Express app
let TOKEN = localStorage.getItem('cp_admin_token') || null;

// ---------------------------------------------------------------
// Fetch helper — attaches admin token, throws on non-2xx
// ---------------------------------------------------------------
async function apiFetch(path, options = {}) {
  const headers = options.headers || {};
  if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;
  if (!(options.body instanceof FormData) && options.body) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `Request failed (${res.status})`);
  return data;
}

// ---------------------------------------------------------------
// Auth
// ---------------------------------------------------------------
const loginScreen = document.getElementById('loginScreen');
const appShell = document.getElementById('appShell');

function showApp() {
  loginScreen.classList.add('hidden');
  appShell.classList.remove('hidden');
  loadDashboard();
}

function showLogin() {
  appShell.classList.add('hidden');
  loginScreen.classList.remove('hidden');
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  errEl.textContent = '';
  try {
    const { token } = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    TOKEN = token;
    localStorage.setItem('cp_admin_token', token);
    showApp();
  } catch (err) {
    errEl.textContent = err.message;
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  TOKEN = null;
  localStorage.removeItem('cp_admin_token');
  showLogin();
});

// ---------------------------------------------------------------
// Tab navigation
// ---------------------------------------------------------------
document.querySelectorAll('.nav-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.add('hidden'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    document.getElementById(`tab-${tab}`).classList.remove('hidden');
    if (tab === 'dashboard') loadDashboard();
    if (tab === 'bookings') loadBookings();
    if (tab === 'rooms') loadRoomTypesAndRates();
    if (tab === 'media') loadMedia();
    if (tab === 'addons') loadAddOns();
  });
});

// ---------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------
async function loadDashboard() {
  try {
    const stats = await apiFetch('/api/admin/dashboard/summary');
    Object.entries(stats).forEach(([key, value]) => {
      const el = document.querySelector(`[data-stat="${key}"]`);
      if (!el) return;
      el.textContent = key === 'revenueThisMonth' ? `₹${Number(value).toLocaleString('en-IN')}` : value;
    });
  } catch (err) {
    console.error(err);
  }
}

// ---------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------
let bookingPage = 1;

async function loadBookings() {
  const q = document.getElementById('bookingSearch').value;
  const status = document.getElementById('bookingStatusFilter').value;
  const params = new URLSearchParams({ page: bookingPage, pageSize: 15 });
  if (q) params.set('q', q);
  if (status) params.set('status', status);

  try {
    const { bookings, total, pageSize } = await apiFetch(`/api/bookings?${params}`);
    const tbody = document.getElementById('bookingsTableBody');
    tbody.innerHTML = bookings
      .map((b) => {
        const item = b.items[0];
        return `<tr>
          <td>${b.reference}</td>
          <td>${b.guest.firstName} ${b.guest.lastName}<br><span class="muted">${b.guest.email}</span></td>
          <td>${item ? item.roomType.name : '—'}</td>
          <td>${item ? formatDate(item.checkIn) : '—'}</td>
          <td>${item ? formatDate(item.checkOut) : '—'}</td>
          <td><span class="status-pill status-${b.status}">${b.status}</span></td>
          <td>₹${Number(b.totalAmount).toLocaleString('en-IN')}</td>
          <td class="row-actions">
            ${b.status === 'HELD' ? `<button data-action="confirm" data-id="${b.id}">Confirm</button>` : ''}
            ${b.status !== 'CANCELLED' && b.status !== 'COMPLETED' ? `<button class="danger" data-action="cancel" data-id="${b.id}">Cancel</button>` : ''}
          </td>
        </tr>`;
      })
      .join('');

    tbody.querySelectorAll('button[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => handleBookingAction(btn.dataset.action, btn.dataset.id));
    });

    renderPagination(total, pageSize, bookingPage, (p) => {
      bookingPage = p;
      loadBookings();
    });
  } catch (err) {
    alert(err.message);
  }
}

async function handleBookingAction(action, id) {
  if (action === 'cancel' && !confirm('Cancel this booking?')) return;
  try {
    await apiFetch(`/api/bookings/${id}/${action}`, { method: 'POST', body: JSON.stringify({}) });
    loadBookings();
    loadDashboard();
  } catch (err) {
    alert(err.message);
  }
}

document.getElementById('bookingSearchBtn').addEventListener('click', () => {
  bookingPage = 1;
  loadBookings();
});

function renderPagination(total, pageSize, currentPage, onChange) {
  const pages = Math.ceil(total / pageSize) || 1;
  const container = document.getElementById('bookingsPagination');
  container.innerHTML = '';
  for (let i = 1; i <= pages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    if (i === currentPage) btn.style.fontWeight = 'bold';
    btn.addEventListener('click', () => onChange(i));
    container.appendChild(btn);
  }
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ---------------------------------------------------------------
// Room Types & Rate Plans
// ---------------------------------------------------------------
async function loadRoomTypesAndRates() {
  try {
    const { roomTypes } = await apiFetch('/api/room-types');
    const list = document.getElementById('roomTypeList');
    list.innerHTML = roomTypes
      .map(
        (rt) => `<div class="room-type-card">
          <h4>${rt.name}</h4>
          <p class="muted">${rt.bedrooms} BR · ${rt.bathrooms} bath · sleeps ${rt.maxOccupancy}</p>
          <p>Base rate: ₹${Number(rt.basePrice).toLocaleString('en-IN')}/night</p>
        </div>`
      )
      .join('');

    const select = document.getElementById('rateRoomTypeSelect');
    select.innerHTML = roomTypes.map((rt) => `<option value="${rt.id}">${rt.name}</option>`).join('');
    select.onchange = () => loadRatePlans(select.value);
    if (roomTypes.length) loadRatePlans(roomTypes[0].id);
  } catch (err) {
    alert(err.message);
  }
}

async function loadRatePlans(roomTypeId) {
  const { ratePlans } = await apiFetch(`/api/rate-plans?roomTypeId=${roomTypeId}`);
  const tbody = document.getElementById('ratePlanTableBody');
  tbody.innerHTML = ratePlans
    .map(
      (rp) => `<tr>
        <td>${rp.name}</td>
        <td>${formatDate(rp.startDate)}</td>
        <td>${formatDate(rp.endDate)}</td>
        <td>₹${Number(rp.nightlyRate).toLocaleString('en-IN')}</td>
        <td>${rp.priority}</td>
        <td><button class="danger" data-id="${rp.id}">Delete</button></td>
      </tr>`
    )
    .join('');

  tbody.querySelectorAll('button[data-id]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this rate plan?')) return;
      await apiFetch(`/api/rate-plans/${btn.dataset.id}`, { method: 'DELETE' });
      loadRatePlans(roomTypeId);
    });
  });
}

document.getElementById('newRatePlanForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const roomTypeId = document.getElementById('rateRoomTypeSelect').value;
  try {
    await apiFetch('/api/rate-plans', {
      method: 'POST',
      body: JSON.stringify({
        roomTypeId,
        name: document.getElementById('rpName').value,
        startDate: document.getElementById('rpStart').value,
        endDate: document.getElementById('rpEnd').value,
        nightlyRate: Number(document.getElementById('rpRate').value),
        priority: Number(document.getElementById('rpPriority').value || 0),
      }),
    });
    e.target.reset();
    loadRatePlans(roomTypeId);
  } catch (err) {
    alert(err.message);
  }
});

// ---------------------------------------------------------------
// Media (images & video, per section)
// ---------------------------------------------------------------
document.getElementById('mediaUploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const statusEl = document.getElementById('mediaUploadStatus');
  const fileInput = document.getElementById('mediaFile');
  const section = document.getElementById('mediaSection').value;
  const altText = document.getElementById('mediaAlt').value;

  if (!fileInput.files[0]) return;

  const formData = new FormData();
  formData.append('file', fileInput.files[0]);
  formData.append('section', section);
  formData.append('altText', altText);

  statusEl.textContent = 'Uploading…';
  try {
    await apiFetch('/api/media/upload', { method: 'POST', body: formData });
    statusEl.textContent = 'Uploaded.';
    e.target.reset();
    loadMedia();
  } catch (err) {
    statusEl.textContent = `Failed: ${err.message}`;
  }
});

document.getElementById('mediaSectionFilter').addEventListener('change', loadMedia);

async function loadMedia() {
  const section = document.getElementById('mediaSectionFilter').value;
  const params = section ? `?section=${section}` : '';
  const { media } = await apiFetch(`/api/media${params}`);
  const grid = document.getElementById('mediaGrid');

  grid.innerHTML = media
    .map(
      (m) => `<div class="media-item">
        ${
          m.type === 'VIDEO'
            ? `<video src="${m.url}" muted></video>`
            : `<img src="${m.url}" alt="${m.altText || ''}" />`
        }
        <div class="media-meta">
          <strong>${m.section}</strong>
          <span class="muted">${m.altText || 'No caption'}</span>
          <span class="muted">order: ${m.sortOrder}</span>
        </div>
        <div class="media-actions">
          <button data-action="up" data-id="${m.id}" data-order="${m.sortOrder}">↑ Order</button>
          <button class="danger" data-action="delete" data-id="${m.id}">Delete</button>
        </div>
      </div>`
    )
    .join('');

  grid.querySelectorAll('button[data-action]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      if (btn.dataset.action === 'delete') {
        if (!confirm('Remove this media item?')) return;
        await apiFetch(`/api/media/${id}`, { method: 'DELETE' });
      } else if (btn.dataset.action === 'up') {
        const newOrder = Math.max(0, Number(btn.dataset.order) - 1);
        await apiFetch(`/api/media/${id}`, { method: 'PATCH', body: JSON.stringify({ sortOrder: newOrder }) });
      }
      loadMedia();
    });
  });
}

// ---------------------------------------------------------------
// Add-ons
// ---------------------------------------------------------------
async function loadAddOns() {
  const { addOns } = await apiFetch('/api/add-ons');
  document.getElementById('addonsTableBody').innerHTML = addOns
    .map(
      (a) => `<tr>
        <td>${a.name}</td>
        <td>${a.unit.replace('_', ' ')}</td>
        <td>₹${Number(a.price).toLocaleString('en-IN')}</td>
        <td>${a.taxRate}%</td>
        <td>${a.isActive ? 'Yes' : 'No'}</td>
      </tr>`
    )
    .join('');
}

document.getElementById('newAddonForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await apiFetch('/api/add-ons', {
      method: 'POST',
      body: JSON.stringify({
        name: document.getElementById('addonName').value,
        unit: document.getElementById('addonUnit').value,
        price: Number(document.getElementById('addonPrice').value),
        taxRate: Number(document.getElementById('addonTax').value || 18),
      }),
    });
    e.target.reset();
    loadAddOns();
  } catch (err) {
    alert(err.message);
  }
});

// ---------------------------------------------------------------
// Boot
// ---------------------------------------------------------------
if (TOKEN) {
  showApp();
} else {
  showLogin();
}
