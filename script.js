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


// --------------------------------------------------------------------------

// BLOCK INVALID DOMAINS/SPAM

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("lead-form");
  const status = document.getElementById("status");
  const submitBtn = document.getElementById("submit-btn");

  // Disposable email domains
  const disposableDomains = [
    "mailinator.com", "tempmail.com", "10minutemail.com",
    "guerrillamail.com", "trashmail.com", "yopmail.com"
  ];

  // Fake / invalid TLDs
  const invalidTLDs = ["invalid", "test", "example", "localhost"];

  const showError = (msg) => {
    status.className = "status error";
    status.textContent = msg;
    submitBtn.disabled = false;
  };

  const clearError = () => {
    status.className = "status";
    status.textContent = "";
  };

  form.addEventListener("submit", (e) => {
    clearError();

    const first = form.first_name.value.trim();
    const last = form.last_name.value.trim();
    const email = form.email.value.trim();
    const job = form.job_title.value.trim();
    const size = form.company_size.value.trim();
    const phone = form.phone.value.trim();

    // 1. Required fields
    if (!first || !last || !email || !job || !size) {
      e.preventDefault();
      showError("Please fill in all required fields.");
      return;
    }

    // 2. Email format
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
      e.preventDefault();
      showError("Please enter a valid email address.");
      return;
    }

    // 3. Disposable email domains
    const domain = email.split("@")[1].toLowerCase();
    if (disposableDomains.includes(domain)) {
      e.preventDefault();
      showError("Disposable email addresses are not allowed.");
      return;
    }

    // 4. Fake TLDs
    const tld = domain.split(".").pop();
    if (invalidTLDs.includes(tld)) {
      e.preventDefault();
      showError("Please use a real business email address.");
      return;
    }

    // 5. Name sanity
    if (first.length < 2 || last.length < 2) {
      e.preventDefault();
      showError("Please enter your full name.");
      return;
    }

    // 6. Phone sanity
    if (phone && phone.length < 7) {
      e.preventDefault();
      showError("Please enter a valid phone number.");
      return;
    }

    // 7. Honeypot (you already have it)
    if (form.website.value.trim() !== "") {
      e.preventDefault();
      showError("Something went wrong. Please try again.");
      return;
    }

    // 8. Prevent double-submit
    submitBtn.disabled = true;
  });
});
