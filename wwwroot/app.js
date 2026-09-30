const API_BASE = '';

const state = {
  phase: 'idle',
  tokenData: null,
  timerInterval: null,
  clients: [
    { id: 'client-1', name: 'Andrei Popescu', phone: '0742 123 456', status: 'VIP', score: 9.2, lastOrder: '#10482 - Livrata' },
    { id: 'client-2', name: 'Maria Ionescu', phone: '0721 334 890', status: 'Restant', score: 6.4, lastOrder: '#10477 - In tranzit' },
    { id: 'client-3', name: 'Nordic Design SRL', phone: '0733 884 221', status: 'Normal', score: 8.1, lastOrder: '#10465 - Procesare' }
  ],
  activities: []
};

const els = {
  tokenView: document.getElementById('token-view'),
  dashboardView: document.getElementById('dashboard-view'),
  generateBtn: document.getElementById('generate-btn'),
  tokenResult: document.getElementById('token-result'),
  qrCanvas: document.getElementById('qr-canvas'),
  expiryTimer: document.getElementById('expiry-timer'),
  tokenValue: document.getElementById('token-value'),
  apiUrlValue: document.getElementById('api-url-value'),
  companyValue: document.getElementById('company-value'),
  expiresValue: document.getElementById('expires-value'),
  copyTokenBtn: document.getElementById('copy-token-btn'),
  connectionStatus: document.getElementById('connection-status'),
  logoutBtn: document.getElementById('logout-btn'),
  clientsList: document.getElementById('clients-list'),
  activityList: document.getElementById('activity-list'),
  callModal: document.getElementById('call-modal'),
  modalClientName: document.getElementById('modal-client-name'),
  modalClientDetails: document.getElementById('modal-client-details'),
  callAcceptBtn: document.getElementById('call-accept-btn'),
  callCancelBtn: document.getElementById('call-cancel-btn'),
  callStatus: document.getElementById('call-status'),
  currentClient: null
};

function showView(viewId) {
  els.tokenView.classList.toggle('active', viewId === 'token');
  els.dashboardView.classList.toggle('active', viewId === 'dashboard');
  els.tokenView.classList.toggle('hidden', viewId !== 'token');
  els.dashboardView.classList.toggle('hidden', viewId !== 'dashboard');
}

function setConnection(status) {
  els.connectionStatus.className = `status-indicator ${status}`;
  const label = els.connectionStatus.querySelector('.label');
  label.textContent = status === 'connected' ? 'Connected' : 'Not Connected';
}

async function generateToken() {
  els.generateBtn.disabled = true;
  els.generateBtn.innerHTML = '<span class="spinner" style="border-color:rgba(255,255,255,0.3);border-top-color:white;"></span> Generating...';

  try {
    const res = await fetch(API_BASE + '/demo/pairing-token', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to generate token');
    const data = await res.json();
    state.tokenData = data;
    showTokenResult(data);
  } catch (err) {
    els.generateBtn.disabled = false;
    els.generateBtn.innerHTML = '<span class="btn-icon">⚡</span> Generate Token';
    alert('Failed to generate token. Is the API running at localhost:5144?');
    console.error(err);
  }
}

function showTokenResult(data) {
  els.tokenResult.classList.remove('hidden');
  els.generateBtn.classList.add('hidden');

  const qrPayload = JSON.stringify({ token: data.token, api_url: data.api_url, company_id: data.company_id });
  if (typeof QRCode === 'undefined') {
    els.qrCanvas.innerHTML = '<p style="color:red">QR library failed to load. Check internet connection.</p>';
  } else {
    new QRCode(els.qrCanvas, {
      text: qrPayload,
      width: 200,
      height: 200,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });
  }

  const expiresAt = new Date(data.expires_at);
  els.tokenValue.textContent = data.token;
  els.apiUrlValue.textContent = data.api_url;
  els.companyValue.textContent = data.company_id;
  els.expiresValue.textContent = expiresAt.toLocaleTimeString();

  startExpiryTimer(expiresAt);
  setConnection('connected');
  state.phase = 'token-generated';
}

function startExpiryTimer(expiresAt) {
  if (state.timerInterval) clearInterval(state.timerInterval);

  function update() {
    const now = new Date();
    const diff = Math.max(0, expiresAt - now);
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    els.expiryTimer.textContent = `Expires in ${mins}:${secs.toString().padStart(2, '0')}`;

    if (diff <= 0) {
      clearInterval(state.timerInterval);
      els.expiryTimer.textContent = 'Expired';
      els.expiryTimer.style.background = 'rgba(234, 67, 53, 0.15)';
      els.expiryTimer.style.color = 'var(--accent-red)';
    }
  }

  update();
  state.timerInterval = setInterval(update, 1000);
}

async function copyToken() {
  if (!state.tokenData) return;
  try {
    await navigator.clipboard.writeText(state.tokenData.token);
    els.copyTokenBtn.textContent = 'Copied!';
    setTimeout(() => { els.copyTokenBtn.textContent = 'Copy Token'; }, 2000);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = state.tokenData.token;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    els.copyTokenBtn.textContent = 'Copied!';
    setTimeout(() => { els.copyTokenBtn.textContent = 'Copy Token'; }, 2000);
  }
}

function renderClients() {
  els.clientsList.innerHTML = state.clients.map(c => {
    const initial = c.name.charAt(0).toUpperCase();
    const avatarClass = `avatar-${c.status.toLowerCase()}`;
    return `
      <div class="client-card">
        <div class="client-avatar ${avatarClass}">${initial}</div>
        <div class="client-info">
          <h3>${c.name}</h3>
          <span class="client-phone">${c.phone}</span>
        </div>
        <div class="client-meta">
          <span class="status-badge ${c.status.toLowerCase()}">${c.status}</span>
          <div class="client-score">Score: ${c.score}</div>
          <button class="call-btn" data-client-id="${c.id}">Call</button>
        </div>
      </div>
    `;
  }).join('');

  els.clientsList.querySelectorAll('.call-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const clientId = e.target.dataset.clientId;
      const client = state.clients.find(c => c.id === clientId);
      if (client) openCallModal(client);
    });
  });
}

function openCallModal(client) {
  els.currentClient = client;
  els.modalClientName.textContent = `Call ${client.name}`;
  els.modalClientDetails.innerHTML = `
    <p><strong>Phone:</strong> ${client.phone}</p>
    <p><strong>Status:</strong> ${client.status}</p>
    <p><strong>Last Order:</strong> ${client.lastOrder}</p>
  `;
  els.callStatus.classList.add('hidden');
  els.callModal.classList.remove('hidden');
}

function closeCallModal() {
  els.callModal.classList.add('hidden');
  els.currentClient = null;
}

async function makeCall() {
  if (!els.currentClient) return;
  const btn = els.callAcceptBtn;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Calling...';
  els.callStatus.className = 'call-status pending';
  els.callStatus.textContent = 'Connecting...';
  els.callStatus.classList.remove('hidden');

  try {
    const res = await fetch(API_BASE + '/calls/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user-demo',
        clientId: els.currentClient.id,
        phoneNumber: els.currentClient.phone
      })
    });

    if (res.ok) {
      const data = await res.json();
      els.callStatus.className = 'call-status success';
      els.callStatus.textContent = `Call triggered via ${data.delivery_method || 'websocket'}!`;
      addActivity('outgoing', els.currentClient.name, `Call initiated • ${els.currentClient.phone}`);
    } else if (res.status === 401) {
      els.callStatus.className = 'call-status error';
      els.callStatus.textContent = 'Not authenticated. Please pair your device first.';
    } else {
      const data = await res.json();
      if (data.device_found === false) {
        els.callStatus.className = 'call-status pending';
        els.callStatus.textContent = 'No device connected. Scan a token with your phone first.';
      } else {
        els.callStatus.className = 'call-status error';
        els.callStatus.textContent = 'Failed to trigger call.';
      }
    }
  } catch (err) {
    els.callStatus.className = 'call-status pending';
    els.callStatus.textContent = 'API unavailable — call will be queued when connection is restored.';
    addActivity('outgoing', els.currentClient.name, `Call queued • ${els.currentClient.phone}`);
  }

  setTimeout(() => {
    closeCallModal();
    renderClients();
  }, 2500);
}

function addActivity(type, clientName, detail) {
  const icons = { outgoing: '📞', incoming: '📱', missed: '❌' };
  state.activities.unshift({ type, clientName, detail, time: new Date() });
  renderActivities();
}

function renderActivities() {
  if (state.activities.length === 0) {
    els.activityList.innerHTML = '<p class="empty-state">No activity yet. Make a call to get started.</p>';
    return;
  }
  els.activityList.innerHTML = state.activities.map(a => {
    const icons = { outgoing: '📞', incoming: '📱', missed: '❌' };
    const timeStr = a.time.toLocaleTimeString();
    return `
      <div class="activity-item">
        <div class="activity-icon ${a.type}">${icons[a.type]}</div>
        <div class="activity-text">
          <div class="client-name">${a.clientName}</div>
          <div class="activity-detail">${a.detail}</div>
        </div>
        <span class="activity-time">${timeStr}</span>
      </div>
    `;
  }).join('');
}

function logout() {
  if (state.timerInterval) clearInterval(state.timerInterval);
  state.tokenData = null;
  state.phase = 'idle';
  state.activities = [];

  showView('token');
  setConnection('disconnected');
  els.tokenResult.classList.add('hidden');
  els.generateBtn.disabled = false;
  els.generateBtn.innerHTML = '<span class="btn-icon">⚡</span> Generate Token';
  els.callModal.classList.add('hidden');
  renderActivities();
}

els.generateBtn.addEventListener('click', generateToken);
els.copyTokenBtn.addEventListener('click', copyToken);
els.logoutBtn.addEventListener('click', logout);
els.callAcceptBtn.addEventListener('click', makeCall);
els.callCancelBtn.addEventListener('click', closeCallModal);

els.callModal.addEventListener('click', (e) => {
  if (e.target === els.callModal) closeCallModal();
});

renderClients();
renderActivities();
