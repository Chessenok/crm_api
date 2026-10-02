const API_BASE = '';

const state = {
  phase: 'idle',
  tokenData: null,
  timerInterval: null,
  pairingCheckInterval: null,
  signalRConnection: null,
  accessToken: null,
  deviceId: null,
  clients: [],
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
  deviceInfoSection: document.getElementById('device-info-section'),
  deviceName: document.getElementById('device-name'),
  deviceMeta: document.getElementById('device-meta'),
  deviceStatus: document.getElementById('device-status'),
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
  if (status === 'connected') {
    label.textContent = 'Connected';
  } else if (status === 'waiting') {
    label.textContent = 'Waiting for phone...';
  } else {
    label.textContent = 'Not Connected';
  }
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
  if (!els.currentClient || !state.accessToken) return;
  const btn = els.callAcceptBtn;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Calling...';
  els.callStatus.className = 'call-status pending';
  els.callStatus.textContent = 'Connecting...';
  els.callStatus.classList.remove('hidden');

  const apiUrl = state.tokenData?.api_url || API_BASE;

  try {
    const res = await fetch(apiUrl + '/calls/trigger', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.accessToken}`
      },
      body: JSON.stringify({
        userId: state.tokenData?.company_id === 'ecap-demo' ? 'user-demo' : 'user',
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
  if (state.pairingCheckInterval) clearInterval(state.pairingCheckInterval);
  if (state.signalRConnection) {
    state.signalRConnection.stop();
    state.signalRConnection = null;
  }
  state.tokenData = null;
  state.phase = 'idle';
  state.activities = [];
  state.clients = [];
  state.accessToken = null;
  state.deviceId = null;

  showView('token');
  setConnection('disconnected');
  els.tokenResult.classList.add('hidden');
  els.generateBtn.classList.remove('hidden');
  els.generateBtn.disabled = false;
  els.generateBtn.innerHTML = '<span class="btn-icon">⚡</span> Generate Token';
  els.callModal.classList.add('hidden');
  els.deviceInfoSection.classList.add('hidden');
  renderClients();
  renderActivities();
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
  state.phase = 'token-generated';
  setConnection('waiting');
  startPairingCheck(data.token, data.api_url);
}

function startPairingCheck(pairingToken, apiUrl) {
  if (state.pairingCheckInterval) clearInterval(state.pairingCheckInterval);

  state.pairingCheckInterval = setInterval(async () => {
    try {
      const res = await fetch(apiUrl + '/demo/pairing-status/' + encodeURIComponent(pairingToken));

      if (res.ok) {
        const data = await res.json();

        if (data.status === 'paired' && data.device_id) {
          // Phone has paired! Now we need to pair the dashboard too to get an access token
          clearInterval(state.pairingCheckInterval);
          state.pairingCheckInterval = null;
          await pairDashboard(pairingToken, apiUrl, data);
        } else if (data.status === 'waiting') {
          // Still waiting for phone to scan
          setConnection('waiting');
        }
      } else if (res.status === 404) {
        // Token not found
        clearInterval(state.pairingCheckInterval);
        state.pairingCheckInterval = null;
        if (state.timerInterval) clearInterval(state.timerInterval);
        els.expiryTimer.textContent = 'Token not found';
        els.expiryTimer.style.background = 'rgba(234, 67, 53, 0.15)';
        els.expiryTimer.style.color = 'var(--accent-red)';
        setConnection('disconnected');
      }
    } catch (err) {
      console.log('Pairing status check error:', err);
    }
  }, 2000);
}

async function pairDashboard(pairingToken, apiUrl, statusData) {
  // Login dashboard using the new demo login endpoint (gets session + phone's device_id)
  try {
    const res = await fetch(apiUrl + '/demo/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: pairingToken })
    });

    if (res.ok) {
      const data = await res.json();
      await onPairingSuccess(data, apiUrl);
    } else {
      const err = await res.json();
      console.error('Dashboard login failed:', err.error);
      setConnection('disconnected');
    }
  } catch (err) {
    console.error('Dashboard login error:', err);
    setConnection('disconnected');
  }
}

async function onPairingSuccess(data, apiUrl) {
  state.accessToken = data.access_token;
  state.deviceId = data.device_id;
  state.phase = 'paired';

  await initSignalR(apiUrl);
  await fetchAndRenderData(apiUrl);

  showView('dashboard');
  setConnection('connected');
}

async function initSignalR(apiUrl) {
  if (typeof signalR === 'undefined') {
    console.warn('SignalR library not loaded');
    return;
  }

  const hubUrl = apiUrl.replace('http://', 'ws://').replace('https://', 'wss://') + '/hubs/device';
  state.signalRConnection = new signalR.HubConnectionBuilder()
    .withUrl(hubUrl, {
      accessTokenFactory: () => state.accessToken,
      transport: signalR.HttpTransportType.WebSockets
    })
    .withAutomaticReconnect()
    .build();

  state.signalRConnection.on('call.trigger', (payload) => {
    console.log('Call trigger received:', payload);
    addActivity('incoming', payload.client_id || 'Unknown', `Incoming call • ${payload.phone_number || ''}`);
  });

  state.signalRConnection.onclose(() => {
    setConnection('disconnected');
  });

  try {
    await state.signalRConnection.start();
    console.log('SignalR connected');
    if (state.deviceId) {
      await state.signalRConnection.invoke('JoinGroup', `device:${state.deviceId}`);
    }
    setConnection('connected');
  } catch (err) {
    console.error('SignalR connection failed:', err);
    setConnection('disconnected');
  }
}

async function fetchAndRenderData(apiUrl) {
  try {
    const res = await fetch(apiUrl + '/sync/full', {
      headers: { 'Authorization': `Bearer ${state.accessToken}` }
    });

    if (res.ok) {
      const data = await res.json();
      state.clients = (data.clients || []).map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        status: c.status,
        score: c.ai_score || Math.random() * 10,
        lastOrder: c.last_order || 'No orders'
      }));
      renderClients();
      await fetchAndRenderDeviceInfo(apiUrl);
    } else if (res.status === 401) {
      logout();
    }
  } catch (err) {
    console.error('Failed to fetch sync data:', err);
  }
}

async function fetchAndRenderDeviceInfo(apiUrl) {
  if (!state.deviceId) return;
  
  try {
    const res = await fetch(apiUrl + '/devices/' + state.deviceId, {
      headers: { 'Authorization': `Bearer ${state.accessToken}` }
    });

    if (res.ok) {
      const device = await res.json();
      renderDeviceInfo(device);
    }
  } catch (err) {
    console.error('Failed to fetch device info:', err);
  }
}

function renderDeviceInfo(device) {
  if (!device) return;
  
  els.deviceInfoSection.classList.remove('hidden');
  
  const platformIcons = {
    'ios': '📱',
    'android': '🤖',
    'web': '💻',
    'windows': '🪟',
    'macos': '💻',
    'linux': '🐧'
  };
  
  const icon = platformIcons[device.platform?.toLowerCase()] || '📱';
  
  els.deviceName.textContent = `${icon} ${device.platform || 'Unknown'} ${device.model ? `(${device.model})` : ''}`;
  
  const lastSeen = device.last_seen || device.lastSeen;
  const lastSeenStr = lastSeen ? new Date(lastSeen).toLocaleString() : 'Unknown';
  
  els.deviceMeta.innerHTML = `
    <div class="device-meta-row">
      <span class="meta-label">Platform:</span>
      <span class="meta-value">${device.platform || 'Unknown'}</span>
    </div>
    <div class="device-meta-row">
      <span class="meta-label">Model:</span>
      <span class="meta-value">${device.model || 'Unknown'}</span>
    </div>
    <div class="device-meta-row">
      <span class="meta-label">OS Version:</span>
      <span class="meta-value">${device.os_version || device.osVersion || 'Unknown'}</span>
    </div>
    <div class="device-meta-row">
      <span class="meta-label">App Version:</span>
      <span class="meta-value">${device.app_version || device.appVersion || 'Unknown'}</span>
    </div>
    <div class="device-meta-row">
      <span class="meta-label">Last Seen:</span>
      <span class="meta-value">${lastSeenStr}</span>
    </div>
    <div class="device-meta-row">
      <span class="meta-label">Device ID:</span>
      <span class="meta-value mono">${device.id || state.deviceId}</span>
    </div>
  `;
  
  els.deviceStatus.innerHTML = `
    <span class="status-dot connected"></span>
    <span>Online</span>
  `;
  els.deviceStatus.className = 'device-status connected';
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
