// ── CONFIG ──────────────────────────────────────────────────────
const WEBHOOK_URL = 'https://thelanderholmscam.org/webhook/lead-intake';
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

// ── CLIENT-SIDE HONEYPOT (Option B) ─────────────────────────────
form.addEventListener("submit", () => {
  const hp = form.querySelector('[name="website"]').value;
  if (hp) {
    // Bot detected — redirect instead of POST
    window.location.href = "/thank-you.html";
  }
});

// Remove error state on input
form.querySelectorAll('input, select, textarea').forEach(el => {
  el.addEventListener('input', () => el.classList.remove('error'));
});
