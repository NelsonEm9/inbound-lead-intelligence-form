# Lead Intake, Qualification & Routing System

```markdown
# Lead Gen Automation System

A production-grade, fully automated lead capture pipeline built with **n8n**, **Airtable**, and **GitHub Pages**.  
It validates, enriches, scores, stores, and routes inbound leads with zero backend code and zero manual triage.

This repository contains the public-facing form hosted on GitHub Pages.  
All automation logic lives inside n8n.

---

## 🧩 Architecture

The system is composed of **four loosely coupled workflows**, each with a single responsibility:

GitHub Pages Form
      │  POST JSON
      ▼
WF‑1  Lead Intake & Validation
      — Validates fields
      — Sanitizes input
      — Dedupes against Airtable
      — Returns 200 immediately
      │  async HTTP
      ▼
WF‑2  Enrichment & Lead Scoring
      — Brandfetch domain enrichment
      — Abstract API email reputation
      — Combines API responses
      — Builds lead object
      — Scores lead (0–100)
      — Assigns label (Hot/Warm/Cold)
      │  async HTTP
      ▼
WF‑3  CRM Sync & Notifications
      — **Creates** new Airtable record (no updates)
      — Routes by score
      — Sends Telegram alerts
      │
      ▼
WF‑E  Global Error Handler
      — Catches failures across all workflows
      — Sends Telegram error alerts


### Why this architecture works

- **WF‑1** is fast and returns immediately → perfect for public forms  
- **WF‑2** is isolated → scoring logic can evolve independently  
- **WF‑3** is write-only → avoids race conditions and simplifies CRM logic  
- **WF‑E** ensures nothing fails silently  

Each workflow can be paused, replaced, or upgraded without breaking the others.

---

## 🛠 Stack

| Layer | Tool |
|--------------|--------------|
| Form hosting | GitHub Pages |
| Automation | n8n (self-hosted on DigitalOcean) |
| CRM | Airtable |
| Notifications | Telegram Bot |
| Reverse proxy | Caddy |
| Containerization | Docker Compose |

---

## 🧪 WF‑1: Lead Intake & Validation

WF‑1 performs:

- Field validation  
- Email normalization  
- Domain extraction  
- Duplicate detection (Airtable search)  
- Data correction  
- Error routing (422, 409, 500)  
- Forwarding to WF‑2  

If duplicate → returns **409 Duplicate**  
If invalid → returns **422 Validation Error**  
If valid → forwards to WF‑2 and returns **200 Accepted**

---

## 🔍 WF‑2: Enrichment & Lead Scoring

WF‑2 enriches and scores the lead using two APIs:

### Enrichment Sources
- **Brandfetch** — company domain → logo, colors, metadata  
- **Abstract API** — email reputation → deliverability, risk score  

### Steps
1. Triggered by WF‑1  
2. Brandfetch enrichment  
3. Abstract API enrichment  
4. Combine API responses  
5. Build unified lead object  
6. Score lead  
7. Assign label  
8. Forward to WF‑3  

### Scoring Model (0–100)

| Signal | Max Points | Notes |
|--------------|----|---------------------------------|
| Company size | 30 | 51–200 employees scores highest |
| Job title seniority | 25 | Founder/C‑suite = 25 pts |
| Use case quality | 25 | Based on character length |
| Data completeness | 20 | 5 pts per optional field |

### Labels

| Label | Score Range | Action |
|--------|--------|---------------------|
| 🔥 Hot | 70–100 | Rich Telegram alert |
| 🌡 Warm | 40–69 | Standard Telegram alert |
| ❄ Cold | 0–39 | Low Telegram Alert (Could just be added to CRM) |

WF‑2 outputs:

- `lead_score`
- `lead_label`
- `score_reasons[]`
- `scored_at`
- `enrichment_source`

---

## 📬 WF‑3: CRM Sync & Notifications

WF‑3 is **create-only** — it does NOT update existing leads.

### Steps
1. Triggered by WF‑2  
2. Create new Airtable record  
3. Route by score  
4. Send Telegram alert  

### Routing Logic


If Hot → Telegram: Hot Lead Alert
Else If Warm → Telegram: Warm Lead Alert
Else → Telegram: Cold Lead (or no alert)


This workflow is intentionally simple and write-only to avoid race conditions.

---

## 🧨 WF‑E: Global Error Handler

Catches failures from:

- WF‑1  
- WF‑2  
- WF‑3  

Sends a Telegram alert containing:

- Workflow name  
- Failed node  
- Execution ID  
- Error message  

This ensures **no silent failures**.

---

## 📝 Form Fields

| Field | Required | Used in Scoring |
|------------|-----|----|
| first_name | Yes | No |
| last_name | Yes | No |
| email | Yes | No |
| company | Yes | No |
| job_title | Yes | Yes — seniority |
| company_size | Yes | Yes — company size |
| phone | Optional | Yes — completeness |
| use_case | Optional | Yes — intent quality |
| utm_* | Auto | Yes — completeness |

### UTM Auto‑Population  
The form automatically reads:

- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_term`
- `utm_content`

…from the URL and includes them in every submission.

---

## 🛡 Spam & Bot Protection

The form includes:

- HTML5 validation  
- Custom JavaScript validation  
- Disposable domain blocking  
- Fake domain blocking  
- Invalid TLD blocking  
- Keyboard-smash detection  
- Name sanity checks  
- Phone sanity checks  
- Honeypot field  

Invalid submissions never reach n8n.

---

## ⚙️ Setup Instructions

### 1. Airtable

Create a base named **Lead Gen CRM** with a table named **Leads**.

Recommended fields:

```
Email
First Name
Last Name
Full Name
Company
Domain
Job Title
Company Size
Phone
Use Case
UTM Source
UTM Medium
UTM Campaign
UTM Term
UTM Content
Lead Score
Lead Label
Score Reasons
Submitted At
Scored At
Created At
```

### 2. n8n Setup

Import workflows in this order:

1. `WF‑E` — Global Error Handler  
2. `WF‑3` — CRM Sync & Notifications  
3. `WF‑2` — Enrichment & Lead Scoring  
4. `WF‑1` — Lead Intake & Validation  

Set n8n Variables:

AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
WF2_WEBHOOK_URL=https://your-n8n/webhook/lead-score
WF3_WEBHOOK_URL=https://your-n8n/webhook/lead-crm
TELEGRAM_LEADS_CHAT_ID=123456
TELEGRAM_ERRORS_CHAT_ID=123456


### 3. GitHub Pages Form

Update the webhook URL in `index.html`:

```html
<form id="lead-form"
  method="POST"
  action="https://your-n8n-domain/webhook/lead-intake">
```

Push to `main`, then enable GitHub Pages:

**Settings → Pages → Deploy from branch → main**

Your form is now live at:

```
https://YOUR-USERNAME.github.io/REPO/
```

---

## 📁 Repository Structure

```
/
├── index.html     — Public-facing form
├── script.js      — Validation + UTM logic
├── styles.css     — Styling
└── README.md      — Documentation
```

This repo intentionally contains **only the form**.  
All automation lives in n8n.

---

## 📄 License

MIT License
