/**
 * PerforMission KPI Calculator — front-end logic.
 * Sends form data to the WordPress REST proxy; never calls the AI API directly.
 */
(function () {
  'use strict';

  const { ajaxUrl, nonce } = window.pmKpi || {};

  document.addEventListener('DOMContentLoaded', () => {
    const form      = document.getElementById('pm-kpi-form');
    const resultBox = document.getElementById('pm-kpi-result');
    const resultTxt = document.getElementById('pm-kpi-result-text');
    const errBox    = document.getElementById('pm-kpi-error');
    const submitBtn = document.getElementById('pm-kpi-submit');
    const btnText   = document.getElementById('pm-kpi-btn-text');
    const btnLoad   = document.getElementById('pm-kpi-btn-loading');
    const resetBtn  = document.getElementById('pm-kpi-reset');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errBox.style.display = 'none';

      const inputs  = form.querySelectorAll('input[type="number"]');
      const metrics = {};
      let   hasData = false;

      inputs.forEach(inp => {
        const val = parseFloat(inp.value);
        if (!isNaN(val) && val >= 0) {
          metrics[inp.name] = val;
          hasData = true;
        }
      });

      if (!hasData) {
        errBox.textContent = 'Please enter at least one metric.';
        errBox.style.display = 'block';
        return;
      }

      // Compute derived metrics client-side before sending.
      if (metrics.clicks && metrics.impressions) {
        metrics.ctr_percent = ((metrics.clicks / metrics.impressions) * 100).toFixed(2);
      }
      if (metrics.conversions && metrics.clicks) {
        metrics.conversion_rate_percent = ((metrics.conversions / metrics.clicks) * 100).toFixed(2);
      }
      if (metrics.revenue && metrics.ad_spend) {
        metrics.roas = (metrics.revenue / metrics.ad_spend).toFixed(2);
      }

      setLoading(true);

      try {
        const res = await fetch(ajaxUrl, {
          method: 'POST',
          headers: {
            'X-WP-Nonce':  nonce,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ metrics }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Request failed');
        }

        resultTxt.textContent = data.result || 'No analysis returned.';
        form.style.display    = 'none';
        resultBox.style.display = 'block';
      } catch (err) {
        errBox.textContent = 'Error: ' + err.message;
        errBox.style.display = 'block';
      } finally {
        setLoading(false);
      }
    });

    resetBtn && resetBtn.addEventListener('click', () => {
      form.reset();
      form.style.display    = '';
      resultBox.style.display = 'none';
      errBox.style.display  = 'none';
    });

    function setLoading(loading) {
      submitBtn.disabled   = loading;
      btnText.style.display  = loading ? 'none' : '';
      btnLoad.style.display  = loading ? '' : 'none';
    }
  });
})();
