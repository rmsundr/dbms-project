# ClinicRx — E-Prescription Workflow System (Pure JavaScript)

Specialty-based relational clinic prescribing application running **100% in JavaScript** without external database or backend API dependencies.

**Team:** Ramsunder Harikumar · Adith N · Hiba Fathima K · Haripriya N S

---

## Features

- **Shared medicine list** — all doctors can prescribe any medicine from the master formulary
- **Automated conflict detection** — checks new prescriptions against the patient’s active medicines and flags high/moderate drug–drug interactions
- **One source of truth** — single unified master medicine collection; no duplicates
- **Unified patient record** — full prescription history and active treatments across all specialties
- **Active / past status** — toggle treatments between active and past; conflict checking only tests against active treatments
- **Substitute medicines** — suggests alternate medications based on predefined substitution rules
- **Zero backend dependencies** — no Python, Flask, MariaDB, or API server needed; runs directly in the browser with `localStorage` persistence

---

## Quick Start

### Option 1: Open Directly in Your Web Browser
Simply open [`index.html`](index.html) in any browser (Chrome, Firefox, Safari, Edge).

```bash
xdg-open index.html
# or double-click index.html in your file manager
```

### Option 2: Run with Any Static Server (Optional)
If you prefer running via `localhost`:
```bash
# Using Node / npx
npx serve .

# Or using Python's built-in static server (no dependencies)
python3 -m http.server 5000
```
Then visit `http://127.0.0.1:5000`.

---

## Architecture & Code Organization

```
project/
├── index.html           # Main application entry point (relative assets)
├── static/
│   ├── css/
│   │   └── style.css    # Responsive clinic UI theme
│   └── js/
│       └── app.js       # Complete JavaScript application & data layer:
│                        #   - Seed dataset (doctors, patients, meds, rules)
│                        #   - ClinicService (in-memory & localStorage store)
│                        #   - Drug conflict & prescription safety engine
│                        #   - UI controllers and view routing
├── templates/
│   └── index.html       # Standalone template copy
└── sql/                 # Reference SQL schema and seed files
```

---

## Try the Conflict Flow

1. Choose **Dr. Sreelatha Nair** (General Medicine) from the "Signed in as" dropdown.
2. Under **Prescribe**, select patient **K. Krishnan** (who is already on Aspirin from Cardiology).
3. Click **Ibuprofen** from the medicine formulary and click **Check conflicts**.
4. The system flags **Aspirin ↔ Ibuprofen (high severity)** and blocks saving until you click **Override & save anyway**.
5. Go to the **Patients** tab and select **K. Krishnan** to view his updated cross-specialty history.
