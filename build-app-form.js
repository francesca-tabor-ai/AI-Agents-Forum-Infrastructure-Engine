/**
 * Build an App form - submits to /api/app-submission
 */
(function () {
  'use strict';

  const form = document.getElementById('build-app-form');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const integrationCheckboxes = form.querySelectorAll('input[name="integrationAreas"]:checked');
    const integrationAreas = Array.from(integrationCheckboxes).map((cb) => cb.value);

    if (integrationAreas.length === 0) {
      alert('Please select at least one API or platform area you will integrate with.');
      return;
    }

    const data = {
      firstName: document.getElementById('firstName').value.trim(),
      lastName: document.getElementById('lastName').value.trim(),
      companyName: document.getElementById('companyName').value.trim(),
      workEmail: document.getElementById('workEmail').value.trim(),
      companyWebsite: document.getElementById('companyWebsite').value.trim() || undefined,
      appName: document.getElementById('appName').value.trim(),
      appDescription: document.getElementById('appDescription').value.trim(),
      integrationAreas,
      partnershipModel: document.getElementById('partnershipModel').value,
      timeline: document.getElementById('timeline').value || undefined,
      whyPartner: document.getElementById('whyPartner').value.trim(),
      marketingOptIn: document.getElementById('marketingOptIn').checked,
    };

    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Submitting…';

    try {
      const base = window.location.origin;
      const res = await fetch(`${base}/api/app-submission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Submission failed');
      }

      form.style.display = 'none';
      document.getElementById('form-success').classList.add('visible');
    } catch (err) {
      alert(err.message || 'Something went wrong. Please try again.');
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });
})();
