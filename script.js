// ── CONFIG ──────────────────────────────────────────────────────
  // Replace this with your WF-1 production webhook URL
  const WEBHOOK_URL = 'YOUR_WF1_WEBHOOK_URL_HERE';
  // ────────────────────────────────────────────────────────────────
 
  const form   = document.getElementById('lead-form');
  const btn    = document.getElementById('submit-btn');
  const status = document.getElementById('status');
 
  // Populate hidden UTM fields from URL parameters on page load
  const populateUTM = () => {
    const p = new URLSearchParams(window.location.search);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(key => {
      const el = form.querySelector(`[name="${key}"]`);
      if (el) el.value = p.get(key) || '';
    });
  };
  populateUTM();
 
  // Client-side validation — only required fields
  const validate = (data) => {
    const errors = [];
    if (!data.first_name.trim())   errors.push('first_name');
    if (!data.last_name.trim())    errors.push('last_name');
    if (!data.email.trim())        errors.push('email');
    if (!data.job_title.trim())    errors.push('job_title');
    if (!data.company_size.trim()) errors.push('company_size');
 
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (data.email && !emailRe.test(data.email)) errors.push('email');
 
    return errors;
  };
 
  const setStatus = (type, message) => {
    status.className = `status ${type}`;
    status.textContent = message;
  };
 
  const clearErrors = () => {
    form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
  };
 
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();
    status.className = 'status';
 
    const raw = Object.fromEntries(new FormData(form).entries());
 
    // Honeypot check — if website field has a value it is a bot
    if (raw.website) return;
 
    const data = {
      first_name:   raw.first_name   || '',
      last_name:    raw.last_name    || '',
      email:        raw.email        || '',
      company:      raw.company      || '',
      job_title:    raw.job_title    || '',
      company_size: raw.company_size || '',
      phone:        raw.phone        || '',
      use_case:     raw.use_case     || '',
      utm_source:   raw.utm_source   || '',
      utm_medium:   raw.utm_medium   || '',
      utm_campaign: raw.utm_campaign || '',
      utm_term:     raw.utm_term     || '',
      utm_content:  raw.utm_content  || '',
      source_page:  window.location.href,
      submitted_at: new Date().toISOString(),
    };
 
    // Client-side validation
    const errors = validate(data);
    if (errors.length) {
      errors.forEach(field => {
        const el = form.querySelector(`[name="${field}"]`);
        if (el) el.classList.add('error');
      });
      setStatus('error', 'Please fill in all required fields.');
      return;
    }
 
    // Submit
    btn.disabled = true;
    btn.classList.add('loading');
 
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
 
      if (res.ok) {
        form.reset();
        populateUTM(); // re-populate UTM after reset clears hidden fields
        setStatus('success', "✓ You're on the list! We'll be in touch within one business day.");
        btn.disabled = true;
        btn.querySelector('.btn-text').textContent = 'Submitted ✓';
        btn.classList.remove('loading');
      } else {
        const body = await res.json().catch(() => ({}));
        if (res.status === 409) {
          setStatus('error', 'This email is already registered. Check your inbox for our previous message.');
        } else {
          throw new Error(body.message || `Error ${res.status}`);
        }
        btn.disabled = false;
        btn.classList.remove('loading');
      }
 
    } catch (err) {
      setStatus('error', 'Something went wrong. Please try again in a moment.');
      btn.disabled = false;
      btn.classList.remove('loading');
    }
  });
 
  // Remove error state on input
  form.querySelectorAll('input, select, textarea').forEach(el => {
    el.addEventListener('input', () => el.classList.remove('error'));
  });
