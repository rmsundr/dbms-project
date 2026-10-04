# ClinicRx — E-Prescription Workflow System

Specialty-based relational database architecture for safer clinic prescribing.

**Team:** Ramsunder Harikumar · Adith N · Hiba Fathima K · Haripriya N S

## Features

- **Smart filtering** — doctors only see medicines mapped to their specialty
- **Automated conflict detection** — checks new Rx against the patient’s active medicines
- **One source of truth** — single `master_medicine` table; no per-department duplicates
- **Unified patient record** — prescriptions from all specialties in one history
- **Active / past status** — conflict checks use only currently active medications
- **Substitute medicines** — alternate drug links from the ER design
- **Warning alerts** — interaction alerts stored against prescription items

## Quick start

```bash
cd /home/ramsunder/Documents/project
python3 app.py
```

Open [http://127.0.0.1:5000](http://127.0.0.1:5000)

To rebuild the database from scratch:

```bash
python3 -c "from database import init_db; init_db(force=True)"
```

## Schema (from the ER diagram)

| Table | Role |
|---|---|
| `speciality` | Cardiology, Endocrinology, … |
| `doctor` + `doctor_qualification` | Doctor belongs to one specialty; multi-valued qualifications |
| `patient` | Shared across departments (`age` derived from `dob`) |
| `master_medicine` | Unified medicine master |
| `specialty_medicine` | M:N specialty formulary (smart filter) |
| `medicine_interaction` | Predefined drug–drug conflict pairs |
| `medicine_substitute` | Alternate / substitute relationship |
| `prescription` / `prescription_item` | Rx header + weak-entity line items |
| `warning_alert` / `item_alert` | Alerts triggered by prescription items |

## Try the conflict flow

1. Sign in as **Dr. Sreelatha Nair** (General Medicine)
2. Select patient **K. Krishnan** (already on Aspirin from Cardiology)
3. Add **Ibuprofen** from the formulary and click **Check conflicts**
4. The system flags Aspirin ↔ Ibuprofen (high severity) and blocks save unless overridden
