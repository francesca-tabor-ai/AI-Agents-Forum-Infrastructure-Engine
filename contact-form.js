/**
 * Contact form - pre-fills mailto to info@francescatabor.com
 * Submits via mailto with structured subject and body
 */
(function () {
  'use strict';

  const RECIPIENT = 'info@francescatabor.com';

  document.getElementById('contact-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const requestType = document.getElementById('request-type').value;
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const subject = document.getElementById('subject').value.trim();
    const message = document.getElementById('message').value.trim();

    const subjectLine = subject
      ? `[${requestType}] ${subject}`
      : `[${requestType}] Contact form submission`;

    const body = [
      `Request Type: ${requestType}`,
      `Name: ${name}`,
      `Email: ${email}`,
      '',
      message
    ].join('\n');

    const mailto = `mailto:${encodeURIComponent(RECIPIENT)}?subject=${encodeURIComponent(subjectLine)}&body=${encodeURIComponent(body)}`;

    window.location.href = mailto;
  });
})();
