// ── CONFIG ──────────────────────────────────────────────────────
const WEBHOOK_URL = 'https://workspace.nelsonemerson.com/webhook/lead-intake';
// ────────────────────────────────────────────────────────────────

const form   = document.getElementById('lead-form');
const btn    = document.getElementById('submit-btn');
const status = document.getElementById('status');

// Populate hidden UTM fields from URL parameters on page load

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('lead-form');
  if (!form) return;

  const p = new URLSearchParams(window.location.search);

  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']
    .forEach(key => {
      const el = form.querySelector(`[name="${key}"]`);
      if (el) el.value = p.get(key) || '';
    });
});

// const populateUTM = () => {
//   const p = new URLSearchParams(window.location.search);
//   ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(key => {
//     const el = form.querySelector(`[name="${key}"]`);
//     if (el) el.value = p.get(key) || '';
//   });
// };
// populateUTM();

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

  // Disposable email domains (expand as needed)
  const disposableDomains = [
    "mailinator.com", "tempmail.com", "10minutemail.com",
    "guerrillamail.com", "trashmail.com", "yopmail.com"
  ];

  // Specific fake domains that pass regular syntax checks
  const fakeDomains = ["test.com", "example.com", "fake.com", "asdf.com", "none.com", "nowhere.com"];

  // Fake / invalid TLDs you want to block
  const invalidTLDs = ["invalid", "test", "example", "localhost"];

  // Helper: show error
  const showError = (msg) => {
    status.className = "status error";
    status.textContent = msg;
    submitBtn.disabled = false;
  };

  // Helper: clear error
  const clearError = () => {
    status.className = "status";
    status.textContent = "";
  };

  form.addEventListener("submit", (e) => {
    clearError();

    // Grab values
    const first = form.first_name.value.trim();
    const last = form.last_name.value.trim();
    const email = form.email.value.trim();
    const job = form.job_title.value.trim();
    const size = form.company_size.value.trim();
    const phone = form.phone.value.trim();

    // === 1. Required fields ===
    if (!first || !last || !email || !job || !size) {
      e.preventDefault();
      showError("Please fill in all required fields.");
      return;
    }

    // === 2. Email format check ===
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
      e.preventDefault();
      showError("Please enter a valid email address.");
      return;
    }

    // Split email elements for targeted checking
    const emailParts = email.split("@");
    const handle = emailParts[0].toLowerCase();
    const domain = emailParts[1].toLowerCase();
    const tld = domain.split(".").pop();

    // === 3. Block blatantly fake handles / keyboard smashes ===
    // Catches repetitive strings (aaaa@, 1111@) or common lazy entries
    const repetitiveCharRe = /^(.)\1{3,}$/; 
    const commonFakeHandles = ["test", "asdf", "none", "admin", "noreply", "fake", "testing"];
    
    if (repetitiveCharRe.test(handle) || commonFakeHandles.includes(handle)) {
      e.preventDefault();
      showError("Please enter a valid email address.");
      return;
    }

    // === 4. Block disposable & specific fake domains ===
    if (disposableDomains.includes(domain) || fakeDomains.includes(domain)) {
      e.preventDefault();
      showError("This email domain is not accepted.");
      return;
    }

    // === 5. Block invalid / fake TLDs ===
    if (invalidTLDs.includes(tld)) {
      e.preventDefault();
      showError("Please use a real, valid email address.");
      return;
    }

    // === 6. Block extremely short names ===
    if (first.length < 2 || last.length < 2) {
      e.preventDefault();
      showError("Please enter your full name.");
      return;
    }

    // === 7. Keyboard smash detection on names ===
    // Catches users typing "asdf" or "qwer" for names
    if (["asdf", "qwer", "zxcv", "jkl;"].includes(first.toLowerCase()) || ["asdf", "qwer", "zxcv"].includes(last.toLowerCase())) {
      e.preventDefault();
      showError("Please enter a valid first and last name.");
      return;
    }

    // === 8. Block phone numbers that are too short ===
    if (phone && phone.length < 7) {
      e.preventDefault();
      showError("Please enter a valid phone number.");
      return;
    }

    // === 9. Honeypot check (bots fill this in) ===
    if (form.website.value.trim() !== "") {
      e.preventDefault();
      showError("Something went wrong. Please try again.");
      return;
    }

    // === If everything is valid, disable button to prevent double-submit ===
    submitBtn.disabled = true;
  });
});

