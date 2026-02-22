/**
 * Contact form - submits to /api/contact and stores in database
 */
(function () {
  'use strict';

  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const requestType = document.getElementById('request-type').value;
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const subject = document.getElementById('subject').value.trim();
    const message = document.getElementById('message').value.trim();

    if (!requestType || !name || !email || !message) {
      showMessage('Please fill in all required fields.', 'error');
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Sending…';

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType,
          name,
          email,
          subject: subject || null,
          message,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Failed to send message');
      }

      showMessage('Thank you for your message. We\'ll get back to you soon.', 'success');
      form.reset();
    } catch (err) {
      showMessage(err.message || 'Something went wrong. Please try again.', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });

  function showMessage(text, type) {
    let el = document.getElementById('contact-form-message');
    if (!el) {
      el = document.createElement('p');
      el.id = 'contact-form-message';
      el.setAttribute('role', 'alert');
      form.insertBefore(el, form.querySelector('button[type="submit"]'));
    }
    el.textContent = text;
    el.className = type === 'success' ? 'contact-success' : 'contact-error';
    el.style.display = 'block';
  }
})();
