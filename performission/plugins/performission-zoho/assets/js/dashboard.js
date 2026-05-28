/**
 * PerforMission — Ambassador Zoho Dashboard
 * Handles client list rendering, monthly records, and add/edit modal.
 * All data fetched from /wp-json/pm/v1/ endpoints (server enforces ambassador isolation).
 */
(function () {
  'use strict';

  const { restUrl, restNonce } = window.pmZoho || {};

  // ── State ──────────────────────────────────────────────────────────────────
  let clientsData = [];
  let activeClient = null;
  let editingRecord = null;  // null = new record, object = existing record

  // ── Bootstrap ──────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    const dashboard = document.getElementById('pm-dashboard');
    if (!dashboard || dashboard.dataset.role !== 'ambassador') return;

    // Wire up tab navigation (handled by portal.js but guard here too).
    initTabs(dashboard);

    // Auto-load clients when the clients tab is active.
    const clientsPanel = document.getElementById('pm-panel-clients');
    if (clientsPanel && clientsPanel.classList.contains('active')) {
      loadClients();
    }

    // Load when user switches to clients tab.
    dashboard.addEventListener('pm:tab-changed', (e) => {
      if (e.detail.target === 'clients' && clientsData.length === 0) {
        loadClients();
      }
    });
  });

  // ── Tab wiring (fallback if portal.js not loaded) ─────────────────────────
  function initTabs(root) {
    root.querySelectorAll('.pm-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        root.querySelectorAll('.pm-tab').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        root.querySelectorAll('.pm-panel').forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        const target = btn.dataset.target;
        const panel = document.getElementById('pm-panel-' + target);
        if (panel) panel.classList.add('active');

        root.dispatchEvent(new CustomEvent('pm:tab-changed', { detail: { target } }));
      });
    });
  }

  // ── API helpers ────────────────────────────────────────────────────────────
  async function apiFetch(path, options = {}) {
    const res = await fetch(restUrl + path, {
      headers: {
        'X-WP-Nonce': restNonce,
        'Content-Type': 'application/json',
        ...((options.headers) || {}),
      },
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    return res.json();
  }

  // ── Clients list ───────────────────────────────────────────────────────────
  async function loadClients() {
    const container = document.getElementById('pm-clients-container');
    if (!container) return;

    container.innerHTML = '<div class="pm-loading"><span class="pm-spinner"></span> Loading clients…</div>';

    try {
      clientsData = await apiFetch('clients');
      renderClientList(container);
    } catch (err) {
      container.innerHTML = `<div class="pm-error">Failed to load clients: ${escHtml(err.message)}</div>`;
    }
  }

  function renderClientList(container) {
    if (!clientsData.length) {
      container.innerHTML = '<div class="pm-no-records"><p>No clients assigned yet. Contact your admin to get clients assigned.</p></div>';
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'pm-clients-grid';

    clientsData.forEach(client => {
      const card = document.createElement('div');
      card.className = 'pm-client-card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', 'View records for ' + client.name);
      card.dataset.zohoId = client.zoho_id;

      card.innerHTML = `
        <h3 class="pm-client-card__name">${escHtml(client.name)}</h3>
        <p class="pm-client-card__business">${escHtml(client.business || 'No business name')}</p>
        <div class="pm-client-card__meta">
          ${client.email ? `<span class="pm-client-card__tag">${escHtml(client.email)}</span>` : ''}
          ${client.status ? `<span class="pm-client-card__tag">${escHtml(client.status)}</span>` : ''}
        </div>
        <span class="pm-client-card__cta">View records →</span>
      `;

      card.addEventListener('click', () => openClientDetail(client));
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter') openClientDetail(client); });
      grid.appendChild(card);
    });

    container.innerHTML = '';
    container.appendChild(grid);
  }

  // ── Client detail + monthly records ───────────────────────────────────────
  async function openClientDetail(client) {
    activeClient = client;
    const container = document.getElementById('pm-clients-container');

    container.innerHTML = `
      <div id="pm-client-detail">
        <div class="pm-detail-header">
          <button class="pm-back-btn" id="pm-back-btn">← Back</button>
          <h4>${escHtml(client.name)}${client.business ? ' — ' + escHtml(client.business) : ''}</h4>
        </div>
        <div class="pm-records-actions">
          <button class="pm-btn pm-btn--primary pm-btn--sm" id="pm-add-record-btn">+ Add Monthly Record</button>
        </div>
        <div class="pm-records-wrap">
          <div class="pm-loading"><span class="pm-spinner"></span> Loading records…</div>
        </div>
      </div>
    `;

    document.getElementById('pm-back-btn').addEventListener('click', () => {
      activeClient = null;
      renderClientList(container);
    });

    document.getElementById('pm-add-record-btn').addEventListener('click', () => {
      openRecordModal(null);
    });

    try {
      const records = await apiFetch(`clients/${client.zoho_id}/records`);
      renderRecordsTable(records);
    } catch (err) {
      container.querySelector('.pm-records-wrap').innerHTML =
        `<div class="pm-error">Failed to load records: ${escHtml(err.message)}</div>`;
    }
  }

  function renderRecordsTable(records) {
    const wrap = document.querySelector('#pm-client-detail .pm-records-wrap');
    if (!wrap) return;

    if (!records.length) {
      wrap.innerHTML = '<div class="pm-no-records">No records yet. Add the first monthly record above.</div>';
      return;
    }

    const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    let rows = records.map(r => {
      const profitClass = r.profit > 0
        ? 'pm-profit-positive'
        : r.profit < 0 ? 'pm-profit-negative' : 'pm-profit-zero';

      return `
        <tr>
          <td>${monthNames[r.month] || r.month} ${r.year}</td>
          <td>${fmtCurrency(r.ad_spend)}</td>
          <td>${fmtCurrency(r.client_payment)}</td>
          <td class="${profitClass}">${fmtCurrency(r.profit)}</td>
          <td><button class="pm-edit-btn" data-record='${JSON.stringify(r)}'>Edit</button></td>
        </tr>`;
    }).join('');

    wrap.innerHTML = `
      <table class="pm-records-table">
        <thead>
          <tr>
            <th>Period</th>
            <th>Ad Spend</th>
            <th>Client Payment</th>
            <th>Profit</th>
            <th></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;

    wrap.querySelectorAll('.pm-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const record = JSON.parse(btn.dataset.record);
        openRecordModal(record);
      });
    });
  }

  // ── Add / Edit modal ───────────────────────────────────────────────────────
  function openRecordModal(record) {
    editingRecord = record;
    const isEdit  = !!record;
    const now     = new Date();

    const monthOptions = [
      'January','February','March','April','May','June',
      'July','August','September','October','November','December'
    ].map((m, i) => {
      const val   = i + 1;
      const sel   = isEdit && record.month === val ? ' selected' : '';
      return `<option value="${val}"${sel}>${m}</option>`;
    }).join('');

    let yearOptions = '';
    for (let y = now.getFullYear() + 1; y >= 2020; y--) {
      const sel = isEdit && record.year === y ? ' selected' : '';
      yearOptions += `<option value="${y}"${sel}>${y}</option>`;
    }

    const overlay = document.createElement('div');
    overlay.className = 'pm-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = `
      <div class="pm-modal">
        <button class="pm-modal-close" aria-label="Close">&times;</button>
        <h3>${isEdit ? 'Edit Record' : 'Add Monthly Record'}</h3>
        <div id="pm-form-error" class="pm-form-error" style="display:none"></div>
        <form class="pm-record-form" id="pm-record-form" novalidate>
          <div class="pm-form-row">
            <div class="pm-field">
              <label for="pm-month">Month</label>
              <select id="pm-month" name="month" ${isEdit ? 'disabled' : ''}>${monthOptions}</select>
            </div>
            <div class="pm-field">
              <label for="pm-year">Year</label>
              <select id="pm-year" name="year" ${isEdit ? 'disabled' : ''}>${yearOptions}</select>
            </div>
          </div>
          <div class="pm-field">
            <label for="pm-ad-spend">Ad Spend ($)</label>
            <input type="number" id="pm-ad-spend" name="ad_spend" min="0" step="0.01"
              value="${isEdit ? record.ad_spend : ''}" placeholder="0.00" />
          </div>
          <div class="pm-field">
            <label for="pm-client-payment">Client Payment ($)</label>
            <input type="number" id="pm-client-payment" name="client_payment" min="0" step="0.01"
              value="${isEdit ? record.client_payment : ''}" placeholder="0.00" />
          </div>
          <div class="pm-field">
            <label for="pm-profit">Profit ($)</label>
            <input type="number" id="pm-profit" name="profit" step="0.01"
              value="${isEdit ? record.profit : ''}" placeholder="0.00" />
          </div>
          <div class="pm-form-actions">
            <button type="button" class="pm-btn--cancel">Cancel</button>
            <button type="submit" class="pm-btn--save" id="pm-save-btn">
              ${isEdit ? 'Save Changes' : 'Add Record'}
            </button>
          </div>
        </form>
      </div>`;

    document.body.appendChild(overlay);

    const close = () => { overlay.remove(); editingRecord = null; };

    overlay.querySelector('.pm-modal-close').addEventListener('click', close);
    overlay.querySelector('.pm-btn--cancel').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    overlay.querySelector('#pm-record-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleRecordSubmit(overlay, isEdit, close);
    });

    // Focus first field.
    setTimeout(() => overlay.querySelector('#pm-ad-spend').focus(), 50);
  }

  async function handleRecordSubmit(overlay, isEdit, close) {
    const btn      = overlay.querySelector('#pm-save-btn');
    const errEl    = overlay.querySelector('#pm-form-error');
    const adSpend  = parseFloat(overlay.querySelector('#pm-ad-spend').value);
    const payment  = parseFloat(overlay.querySelector('#pm-client-payment').value);
    const profit   = parseFloat(overlay.querySelector('#pm-profit').value);

    errEl.style.display = 'none';

    if (isNaN(adSpend) || isNaN(payment) || isNaN(profit)) {
      errEl.textContent = 'Please fill in all monetary fields.';
      errEl.style.display = 'block';
      return;
    }

    btn.disabled  = true;
    btn.textContent = 'Saving…';

    try {
      if (isEdit) {
        await apiFetch(`records/${editingRecord.record_id}`, {
          method: 'PUT',
          body: JSON.stringify({ month: editingRecord.month, year: editingRecord.year, ad_spend: adSpend, client_payment: payment, profit }),
        });
      } else {
        const month = parseInt(overlay.querySelector('#pm-month').value, 10);
        const year  = parseInt(overlay.querySelector('#pm-year').value, 10);
        await apiFetch(`clients/${activeClient.zoho_id}/records`, {
          method: 'POST',
          body: JSON.stringify({ month, year, ad_spend: adSpend, client_payment: payment, profit }),
        });
      }
      close();
      // Reload records table.
      const records = await apiFetch(`clients/${activeClient.zoho_id}/records`);
      renderRecordsTable(records);
    } catch (err) {
      errEl.textContent = err.message;
      errEl.style.display = 'block';
      btn.disabled    = false;
      btn.textContent = isEdit ? 'Save Changes' : 'Add Record';
    }
  }

  // ── Utilities ──────────────────────────────────────────────────────────────
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function fmtCurrency(val) {
    return '$' + parseFloat(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
})();
