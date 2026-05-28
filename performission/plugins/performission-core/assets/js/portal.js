/**
 * PerforMission — Portal tab navigation & UX
 * Handles tab switching on all portal dashboards.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const dashboard = document.getElementById('pm-dashboard');
    if (!dashboard) return;

    // ── Tab navigation ────────────────────────────────────────────────────
    const tabs   = dashboard.querySelectorAll('.pm-tab');
    const panels = dashboard.querySelectorAll('.pm-panel');

    tabs.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.target;
        if (!target) return;

        tabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        panels.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        const panel = document.getElementById('pm-panel-' + target);
        if (panel) panel.classList.add('active');

        // Notify other scripts (e.g. dashboard.js) that the tab changed.
        dashboard.dispatchEvent(new CustomEvent('pm:tab-changed', {
          bubbles: true,
          detail: { target }
        }));

        // Persist selected tab in sessionStorage so a page refresh keeps it.
        try { sessionStorage.setItem('pm_active_tab', target); } catch (_) {}
      });
    });

    // Restore previously selected tab.
    try {
      const saved = sessionStorage.getItem('pm_active_tab');
      if (saved) {
        const savedTab = dashboard.querySelector(`.pm-tab[data-target="${saved}"]`);
        if (savedTab) savedTab.click();
      }
    } catch (_) {}

    // ── Trigger initial client load if clients tab is active ─────────────
    const activeTab = dashboard.querySelector('.pm-tab.active');
    if (activeTab && activeTab.dataset.target === 'clients') {
      dashboard.dispatchEvent(new CustomEvent('pm:tab-changed', {
        bubbles: true,
        detail: { target: 'clients' }
      }));
    }
  });
})();
