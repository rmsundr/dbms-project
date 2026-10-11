/**
 * ClinicRx — E-Prescription Workflow System
 * Now includes Fetch wrapper with automatic fallback to local Dummy Data.
 */

// ── Initial Seed Data (Kerala Clinic Multi-Specialty Formulary) ──────────────
const INITIAL_DATA = {
  specialities: [
    { speciality_id: 1, speciality_name: "Cardiology" },
    { speciality_id: 2, speciality_name: "Endocrinology" },
    { speciality_id: 3, speciality_name: "General Medicine" },
    { speciality_id: 4, speciality_name: "Geriatrics" },
    { speciality_id: 5, speciality_name: "Nephrology" },
  ],

  doctors: [
    {
      doctor_id: 1,
      doctor_name: "Dr. Anitha Menon",
      contact_no: "9876543210",
      speciality_id: 1,
      speciality_name: "Cardiology",
      qualifications: ["MD Cardiology", "DM Interventional Cardiology"],
    },
    {
      doctor_id: 2,
      doctor_name: "Dr. Rajesh Kumar",
      contact_no: "9876543211",
      speciality_id: 2,
      speciality_name: "Endocrinology",
      qualifications: ["MD Medicine", "DM Endocrinology"],
    },
    {
      doctor_id: 3,
      doctor_name: "Dr. Sreelatha Nair",
      contact_no: "9876543212",
      speciality_id: 3,
      speciality_name: "General Medicine",
      qualifications: ["MBBS", "MD General Medicine"],
    },
    {
      doctor_id: 4,
      doctor_name: "Dr. Mohammed Ali",
      contact_no: "9876543213",
      speciality_id: 4,
      speciality_name: "Geriatrics",
      qualifications: ["MD Geriatrics"],
    },
    {
      doctor_id: 5,
      doctor_name: "Dr. Priya Varma",
      contact_no: "9876543214",
      speciality_id: 5,
      speciality_name: "Nephrology",
      qualifications: ["MD Medicine", "DM Nephrology"],
    },
  ],

  patients: [
    { patient_id: 1, patient_name: "K. Krishnan", dob: "1952-03-14", contact_no: "9447001001", gender: "M" },
    { patient_id: 2, patient_name: "Lakshmi Amma", dob: "1948-07-22", contact_no: "9447001002", gender: "F" },
    { patient_id: 3, patient_name: "Thomas Varghese", dob: "1955-11-05", contact_no: "9447001003", gender: "M" },
    { patient_id: 4, patient_name: "Fatima Beevi", dob: "1960-01-18", contact_no: "9447001004", gender: "F" },
    { patient_id: 5, patient_name: "P. Narayanan", dob: "1958-09-30", contact_no: "9447001005", gender: "M" },
    { patient_id: 6, patient_name: "Saraswathy Pillai", dob: "1963-04-12", contact_no: "9447001006", gender: "F" },
  ],

  medicines: [
    { medicine_id: 1, medicine_name: "Aspirin", type: "Antiplatelet", manufacturer: "Bayer", unit_price: 12.50 },
    { medicine_id: 2, medicine_name: "Clopidogrel", type: "Antiplatelet", manufacturer: "Sanofi", unit_price: 45.00 },
    { medicine_id: 3, medicine_name: "Atorvastatin", type: "Statin", manufacturer: "Pfizer", unit_price: 38.00 },
    { medicine_id: 4, medicine_name: "Metoprolol", type: "Beta-blocker", manufacturer: "AstraZeneca", unit_price: 22.00 },
    { medicine_id: 5, medicine_name: "Amlodipine", type: "Calcium channel", manufacturer: "Pfizer", unit_price: 18.00 },
    { medicine_id: 6, medicine_name: "Enalapril", type: "ACE inhibitor", manufacturer: "Cipla", unit_price: 15.00 },
    { medicine_id: 7, medicine_name: "Warfarin", type: "Anticoagulant", manufacturer: "Bristol-Myers", unit_price: 55.00 },
    { medicine_id: 8, medicine_name: "Metformin", type: "Antidiabetic", manufacturer: "USV", unit_price: 8.00 },
    { medicine_id: 9, medicine_name: "Glimepiride", type: "Sulfonylurea", manufacturer: "Sanofi", unit_price: 14.00 },
    { medicine_id: 10, medicine_name: "Insulin Glargine", type: "Insulin", manufacturer: "Sanofi", unit_price: 480.00 },
    { medicine_id: 11, medicine_name: "Sitagliptin", type: "DPP-4 inhibitor", manufacturer: "MSD", unit_price: 95.00 },
    { medicine_id: 12, medicine_name: "Paracetamol", type: "Analgesic", manufacturer: "GSK", unit_price: 5.00 },
    { medicine_id: 13, medicine_name: "Amoxicillin", type: "Antibiotic", manufacturer: "Cipla", unit_price: 28.00 },
    { medicine_id: 14, medicine_name: "Omeprazole", type: "PPI", manufacturer: "Dr Reddy's", unit_price: 16.00 },
    { medicine_id: 15, medicine_name: "Ibuprofen", type: "NSAID", manufacturer: "Abbott", unit_price: 10.00 },
    { medicine_id: 16, medicine_name: "Diclofenac", type: "NSAID", manufacturer: "Novartis", unit_price: 12.00 },
    { medicine_id: 17, medicine_name: "Spironolactone", type: "Diuretic", manufacturer: "RPG Life", unit_price: 20.00 },
    { medicine_id: 18, medicine_name: "Furosemide", type: "Loop diuretic", manufacturer: "Sanofi", unit_price: 9.00 },
    { medicine_id: 19, medicine_name: "Losartan", type: "ARB", manufacturer: "Torrent", unit_price: 24.00 },
    { medicine_id: 20, medicine_name: "Allopurinol", type: "Uric acid", manufacturer: "Zyloric", unit_price: 18.00 },
  ],

  substitutes: [
    { original_id: 15, substitute_id: 16 }, // Ibuprofen -> Diclofenac
    { original_id: 6, substitute_id: 19 },  // Enalapril -> Losartan
    { original_id: 1, substitute_id: 2 },   // Aspirin -> Clopidogrel
  ],

  interactions: [
    {
      drug_a_id: 1,
      drug_b_id: 7,
      severity: "high",
      notes: "Bleeding risk",
      description: "Aspirin + Warfarin greatly increases risk of major bleeding.",
    },
    {
      drug_a_id: 1,
      drug_b_id: 15,
      severity: "high",
      notes: "GI bleed / renal risk",
      description: "Aspirin + Ibuprofen raises gastrointestinal bleeding risk and may reduce antiplatelet effect.",
    },
    {
      drug_a_id: 1,
      drug_b_id: 16,
      severity: "high",
      notes: "GI bleed risk",
      description: "Aspirin + Diclofenac increases bleeding and ulcer risk.",
    },
    {
      drug_a_id: 7,
      drug_b_id: 15,
      severity: "high",
      notes: "Severe bleeding",
      description: "Warfarin + Ibuprofen can cause life-threatening haemorrhage.",
    },
    {
      drug_a_id: 7,
      drug_b_id: 16,
      severity: "high",
      notes: "Severe bleeding",
      description: "Warfarin + Diclofenac significantly elevates bleeding risk.",
    },
    {
      drug_a_id: 6,
      drug_b_id: 17,
      severity: "high",
      notes: "Hyperkalemia",
      description: "Enalapril + Spironolactone may cause dangerous hyperkalemia.",
    },
    {
      drug_a_id: 8,
      drug_b_id: 9,
      severity: "moderate",
      notes: "Hypoglycemia",
      description: "Metformin + Glimepiride can cause additive hypoglycemia; monitor glucose closely.",
    },
    {
      drug_a_id: 4,
      drug_b_id: 5,
      severity: "moderate",
      notes: "Bradycardia / hypotension",
      description: "Metoprolol + Amlodipine may cause excessive blood-pressure drop or bradycardia.",
    },
    {
      drug_a_id: 15,
      drug_b_id: 18,
      severity: "high",
      notes: "Nephrotoxicity",
      description: "Ibuprofen + Furosemide can worsen kidney function, especially in elderly patients.",
    },
    {
      drug_a_id: 16,
      drug_b_id: 18,
      severity: "high",
      notes: "Nephrotoxicity",
      description: "Diclofenac + Furosemide increases risk of acute kidney injury.",
    },
    {
      drug_a_id: 3,
      drug_b_id: 7,
      severity: "moderate",
      notes: "INR fluctuation",
      description: "Atorvastatin may potentiate Warfarin effect; monitor INR.",
    },
    {
      drug_a_id: 17,
      drug_b_id: 19,
      severity: "high",
      notes: "Hyperkalemia",
      description: "Spironolactone + Losartan can elevate serum potassium.",
    },
  ],

  prescriptions: [
    {
      prescription_no: 1,
      patient_id: 1,
      doctor_id: 1,
      date: "2026-08-10",
      items: [
        { item_no: 1, medicine_id: 1, dosage: "75 mg", frequency: "Once daily", duration: "Ongoing", status: "active", alerts: [] },
        { item_no: 2, medicine_id: 3, dosage: "10 mg", frequency: "Once daily", duration: "Ongoing", status: "active", alerts: [] },
        { item_no: 3, medicine_id: 4, dosage: "25 mg", frequency: "Twice daily", duration: "Ongoing", status: "active", alerts: [] },
      ],
    },
    {
      prescription_no: 2,
      patient_id: 1,
      doctor_id: 2,
      date: "2026-09-02",
      items: [
        {
          item_no: 1,
          medicine_id: 8,
          dosage: "500 mg",
          frequency: "Twice daily",
          duration: "Ongoing",
          status: "active",
          alerts: [{ alert_id: 1, message: "Metformin ↔ Glimepiride: Metformin + Glimepiride can cause additive hypoglycemia; monitor glucose closely." }],
        },
        {
          item_no: 2,
          medicine_id: 9,
          dosage: "1 mg",
          frequency: "Once daily",
          duration: "Ongoing",
          status: "active",
          alerts: [{ alert_id: 1, message: "Metformin ↔ Glimepiride: Metformin + Glimepiride can cause additive hypoglycemia; monitor glucose closely." }],
        },
      ],
    },
    {
      prescription_no: 3,
      patient_id: 2,
      doctor_id: 4,
      date: "2026-09-15",
      items: [
        { item_no: 1, medicine_id: 5, dosage: "5 mg", frequency: "Once daily", duration: "Ongoing", status: "active", alerts: [] },
        { item_no: 2, medicine_id: 12, dosage: "500 mg", frequency: "As needed", duration: "7 days", status: "past", alerts: [] },
      ],
    },
    {
      prescription_no: 4,
      patient_id: 3,
      doctor_id: 3,
      date: "2026-09-20",
      items: [
        { item_no: 1, medicine_id: 14, dosage: "20 mg", frequency: "Once daily", duration: "14 days", status: "active", alerts: [] },
      ],
    },
    {
      prescription_no: 5,
      patient_id: 4,
      doctor_id: 3,
      date: "2026-10-04",
      items: [
        { item_no: 1, medicine_id: 12, dosage: "500 mg", frequency: "SOS", duration: "3 days", status: "active", alerts: [] },
      ],
    },
  ],
};

// ── In-Memory Store with LocalStorage Persistence ────────────────────────────
const STORAGE_KEY = "clinic_rx_js_db";

function cloneDeep(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function loadDatabase() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Could not read localStorage:", e);
  }
  return cloneDeep(INITIAL_DATA);
}

let db = loadDatabase();

function saveDatabase() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    console.warn("Could not write localStorage:", e);
  }
}

// ── Date and Age Utilities ───────────────────────────────────────────────────
function calculateAge(dobStr) {
  if (!dobStr) return 0;
  const parts = String(dobStr).split("-").map(Number);
  if (parts.length < 3 || isNaN(parts[0])) return 0;
  const birthDate = new Date(parts[0], parts[1] - 1, parts[2]);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : 0;
}

// ── NETWORK LAYER WITH FALLBACK ──────────────────────────────────────────────
const API_BASE = "http://localhost:5000/api";

async function request(endpoint, options = {}, fallbackFn = null) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
    
  } catch (err) {
    console.warn(`Backend unavailable for ${endpoint}, using dummy data.`);
    if (fallbackFn) return fallbackFn();
    throw err;
  }
}

// ── Hybrid Services (Backend First, Fallback to Dummy) ─────────────────────

const ClinicService = {
  async getDoctors() {
    return request("/doctors", { method: "GET" }, () => {
      return db.doctors.map((d) => ({ ...d }));
    });
  },

  async getPatients() {
    return request("/patients", { method: "GET" }, () => {
      return db.patients
        .map((p) => ({
          ...p,
          age: calculateAge(p.dob),
        }))
        .sort((a, b) => a.patient_name.localeCompare(b.patient_name));
    });
  },

  async createPatient({ patient_name, dob, contact_no, gender }) {
    return request(
      "/patients", 
      { method: "POST", body: JSON.stringify({ patient_name, dob, contact_no, gender }) }, 
      () => {
        if (!patient_name || !dob || !gender) {
          throw new Error("patient_name, dob, and gender are required");
        }
        if (!["M", "F", "O"].includes(gender)) {
          throw new Error("gender must be M, F, or O");
        }
        const nextId = (db.patients.reduce((max, p) => Math.max(max, p.patient_id), 0) || 0) + 1;
        const newPatient = {
          patient_id: nextId,
          patient_name: patient_name.trim(),
          dob,
          contact_no: contact_no ? contact_no.trim() : null,
          gender,
        };
        db.patients.push(newPatient);
        saveDatabase();
        return { ...newPatient, age: calculateAge(newPatient.dob) };
    });
  },

  async getPatientDetail(patientId) {
    return request(`/patients/${patientId}`, { method: "GET" }, () => {
      const patient = db.patients.find((p) => p.patient_id === patientId);
      if (!patient) throw new Error("Patient not found");

      const patientWithAge = { ...patient, age: calculateAge(patient.dob) };

      // Find all prescriptions for this patient
      const history = db.prescriptions
        .filter((rx) => rx.patient_id === patientId)
        .sort((a, b) => {
          if (b.date !== a.date) return b.date.localeCompare(a.date);
          return b.prescription_no - a.prescription_no;
        })
        .map((rx) => {
          const doctor = db.doctors.find((d) => d.doctor_id === rx.doctor_id);
          const speciality = doctor
            ? db.specialities.find((s) => s.speciality_id === doctor.speciality_id)
            : null;

          const items = rx.items.map((item) => {
            const med = db.medicines.find((m) => m.medicine_id === item.medicine_id);
            return {
              ...item,
              medicine_name: med ? med.medicine_name : `Medicine #${item.medicine_id}`,
              type: med ? med.type : "",
              alerts: item.alerts || [],
            };
          });

          return {
            prescription_no: rx.prescription_no,
            date: rx.date,
            doctor_id: rx.doctor_id,
            doctor_name: doctor ? doctor.doctor_name : "Doctor",
            speciality_name: speciality ? speciality.speciality_name : "General",
            items,
          };
        });

      // Determine currently active medications
      const activeMap = new Map();
      history.forEach((rx) => {
        rx.items.forEach((item) => {
          if (item.status === "active" && !activeMap.has(item.medicine_id)) {
            const med = db.medicines.find((m) => m.medicine_id === item.medicine_id);
            activeMap.set(item.medicine_id, {
              medicine_id: item.medicine_id,
              medicine_name: med ? med.medicine_name : `Medicine #${item.medicine_id}`,
              type: med ? med.type : "",
              dosage: item.dosage,
              frequency: item.frequency,
              duration: item.duration,
              prescribed_on: rx.date,
              doctor_name: rx.doctor_name,
              speciality_name: rx.speciality_name,
            });
          }
        });
      });

      const activeList = Array.from(activeMap.values()).sort((a, b) =>
        a.medicine_name.localeCompare(b.medicine_name)
      );

      return {
        patient: patientWithAge,
        active_medications: activeList,
        prescriptions: history,
      };
    });
  },

  async getMedicines() {
    return request("/medicines", { method: "GET" }, () => {
      return db.medicines
        .map((m) => ({ ...m }))
        .sort((a, b) => a.medicine_name.localeCompare(b.medicine_name));
    });
  },

  async getMedicineSubstitutes(medicineId) {
    return request(`/medicines/${medicineId}/substitutes`, { method: "GET" }, () => {
      const subs = db.substitutes.filter((s) => s.original_id === medicineId);
      return subs
        .map((s) => db.medicines.find((m) => m.medicine_id === s.substitute_id))
        .filter(Boolean)
        .map((m) => ({
          medicine_id: m.medicine_id,
          medicine_name: m.medicine_name,
          type: m.type,
          unit_price: m.unit_price,
        }));
    });
  },

  async getInteractions() {
    return request("/interactions", { method: "GET" }, () => {
      return db.interactions
        .map((ix) => {
          const a = db.medicines.find((m) => m.medicine_id === ix.drug_a_id);
          const b = db.medicines.find((m) => m.medicine_id === ix.drug_b_id);
          return {
            drug_a_id: ix.drug_a_id,
            drug_a: a ? a.medicine_name : `Drug #${ix.drug_a_id}`,
            drug_b_id: ix.drug_b_id,
            drug_b: b ? b.medicine_name : `Drug #${ix.drug_b_id}`,
            notes: ix.notes,
            description: ix.description,
            severity: ix.severity,
          };
        })
        .sort((a, b) => {
          if (a.severity !== b.severity) return a.severity === "high" ? -1 : 1;
          return a.drug_a.localeCompare(b.drug_a);
        });
    });
  },

  async checkConflicts(patientId, newMedicineIds) {
    return request(
      "/conflicts/check", 
      { method: "POST", body: JSON.stringify({ patientId, newMedicineIds }) }, 
      async () => {
        const patientDetail = await this.getPatientDetail(patientId);
        const activeMedMap = new Map();
        patientDetail.active_medications.forEach((m) => {
          activeMedMap.set(m.medicine_id, m.medicine_name);
        });

        const newMedMap = new Map();
        newMedicineIds.forEach((id) => {
          const med = db.medicines.find((m) => m.medicine_id === id);
          if (med) newMedMap.set(med.medicine_id, med.medicine_name);
        });

        const candidates = Array.from(
          new Set([...activeMedMap.keys(), ...newMedicineIds])
        ).sort((a, b) => a - b);

        const conflicts = [];
        const seen = new Set();

        for (let i = 0; i < candidates.length; i++) {
          for (let j = i + 1; j < candidates.length; j++) {
            const a = candidates[i];
            const b = candidates[j];

            if (!newMedicineIds.includes(a) && !newMedicineIds.includes(b)) {
              continue;
            }

            const key = `${a}_${b}`;
            if (seen.has(key)) continue;
            seen.add(key);

            const match = db.interactions.find(
              (ix) =>
                (ix.drug_a_id === a && ix.drug_b_id === b) ||
                (ix.drug_a_id === b && ix.drug_b_id === a)
            );

            if (match) {
              conflicts.push({
                drug_a_id: a,
                drug_b_id: b,
                drug_a: activeMedMap.get(a) || newMedMap.get(a),
                drug_b: activeMedMap.get(b) || newMedMap.get(b),
                notes: match.notes,
                description: match.description,
                severity: match.severity,
                against_active: activeMedMap.has(a) || activeMedMap.has(b),
              });
            }
          }
        }

        return {
          safe: conflicts.length === 0,
          conflicts,
        };
    });
  },

  async createPrescription({ patient_id, doctor_id, force = false, items = [] }) {
    return request(
      "/prescriptions",
      { method: "POST", body: JSON.stringify({ patient_id, doctor_id, force, items }) },
      async () => {
        if (!patient_id || !doctor_id) {
          throw new Error("patient_id and doctor_id are required");
        }
        if (!items.length) {
          throw new Error("At least one medicine item is required");
        }

        const medicineIds = items.map((it) => Number(it.medicine_id));
        const conflictResult = await this.checkConflicts(patient_id, medicineIds);
        const hasHighConflict = conflictResult.conflicts.some((c) => c.severity === "high");

        if (hasHighConflict && !force) {
          const err = new Error("Dangerous drug interactions detected");
          err.status = 409;
          err.conflicts = conflictResult.conflicts;
          throw err;
        }

        const nextRxNo = (db.prescriptions.reduce((max, r) => Math.max(max, r.prescription_no), 0) || 0) + 1;
        const today = new Date().toISOString().slice(0, 10);
        
        const createdItems = items.map((item, idx) => {
          const mid = Number(item.medicine_id);
          const related = conflictResult.conflicts.filter(
            (c) => mid === c.drug_a_id || mid === c.drug_b_id
          );
          const alerts = related.map((c, aIdx) => ({
            alert_id: aIdx + 1,
            alert_type: `drug_interaction_${c.severity}`,
            message: `${c.drug_a} ↔ ${c.drug_b}: ${c.description}`,
          }));

          return {
            item_no: idx + 1,
            medicine_id: mid,
            dosage: item.dosage || "",
            frequency: item.frequency || "",
            duration: item.duration || "",
            status: "active",
            alerts,
          };
        });

        const newRx = {
          prescription_no: nextRxNo,
          patient_id,
          doctor_id,
          date: today,
          items: createdItems,
        };

        db.prescriptions.unshift(newRx);
        saveDatabase();

        return {
          prescription_no: nextRxNo,
          conflicts: conflictResult.conflicts,
          forced: Boolean(force && conflictResult.conflicts.length),
        };
    });
  },

  async updateItemStatus(rxNo, itemNo, status) {
    return request(
      `/prescriptions/${rxNo}/items/${itemNo}/status`,
      { method: "PATCH", body: JSON.stringify({ status }) },
      () => {
        if (!["active", "past"].includes(status)) {
          throw new Error("status must be 'active' or 'past'");
        }
        const rx = db.prescriptions.find((r) => r.prescription_no === rxNo);
        if (!rx) throw new Error("Prescription not found");
        const item = rx.items.find((it) => it.item_no === itemNo);
        if (!item) throw new Error("Item not found");

        item.status = status;
        saveDatabase();
        return { ok: true, status };
    });
  },

  async getStats() {
    return request("/stats", { method: "GET" }, () => {
      let activeMeds = 0;
      db.prescriptions.forEach((rx) => {
        rx.items.forEach((it) => {
          if (it.status === "active") activeMeds++;
        });
      });

      return {
        patients: db.patients.length,
        doctors: db.doctors.length,
        medicines: db.medicines.length,
        prescriptions: db.prescriptions.length,
        interactions: db.interactions.length,
        active_meds: activeMeds,
      };
    });
  },
};

// ── Application UI State ─────────────────────────────────────────────────────
const state = {
  doctors: [],
  patients: [],
  draft: [], // { medicine_id, medicine_name, dosage, frequency, duration }
  conflicts: null,
  selectedPatientId: null,
};

const titles = {
  dashboard: ["Dashboard", "Clinic overview and safety signals"],
  prescribe: ["Prescribe", "Full medicine list with live conflict checks"],
  patients: ["Patients", "Unified records shared across all specialties"],
  medicines: ["Medicines", "Single master list — one source of truth"],
  interactions: ["Conflicts", "Predefined drug–drug interaction rules"],
};

function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.add("hidden"), 3200);
}

function doctorId() {
  return Number(document.getElementById("session-doctor").value);
}

function showView(name) {
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  document.getElementById(`view-${name}`).classList.add("active");
  document.querySelectorAll(".nav-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.view === name);
  });
  const [t, s] = titles[name];
  document.getElementById("view-title").textContent = t;
  document.getElementById("view-subtitle").textContent = s;

  if (name === "prescribe") loadFormulary();
  if (name === "patients") renderPatientList();
  if (name === "medicines") loadMedicines();
  if (name === "interactions") loadInteractions();
  if (name === "dashboard") loadStats();
}

// ── Boot ─────────────────────────────────────────────────────────────────────
async function boot() {
  state.doctors = await ClinicService.getDoctors();
  state.patients = await ClinicService.getPatients();

  const sel = document.getElementById("session-doctor");
  sel.innerHTML = state.doctors
    .map(
      (d) =>
        `<option value="${d.doctor_id}">${d.doctor_name} · ${d.speciality_name}</option>`
    )
    .join("");

  const rxPatient = document.getElementById("rx-patient");
  rxPatient.innerHTML =
    `<option value="">Select patient…</option>` +
    state.patients
      .map(
        (p) =>
          `<option value="${p.patient_id}">${p.patient_name} (${p.age}y)</option>`
      )
      .join("");

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => showView(btn.dataset.view));
  });
  document.querySelectorAll("[data-goto]").forEach((btn) => {
    btn.addEventListener("click", () => showView(btn.dataset.goto));
  });

  sel.addEventListener("change", () => {
    state.draft = [];
    state.conflicts = null;
    renderDraft();
    hideConflicts();
    if (document.getElementById("view-prescribe").classList.contains("active")) {
      loadFormulary();
    }
  });

  rxPatient.addEventListener("change", onPatientChange);
  document.getElementById("btn-check").addEventListener("click", checkConflicts);
  document.getElementById("btn-save").addEventListener("click", () => savePrescription(false));
  document.getElementById("btn-toggle-form").addEventListener("click", () => {
    document.getElementById("patient-form").classList.toggle("hidden");
  });
  document.getElementById("patient-form").addEventListener("submit", registerPatient);

  loadStats();
}

// ── Dashboard ────────────────────────────────────────────────────────────────
async function loadStats() {
  const s = await ClinicService.getStats();
  const labels = {
    patients: "Patients",
    doctors: "Doctors",
    medicines: "Medicines",
    prescriptions: "Prescriptions",
    interactions: "Conflict rules",
    active_meds: "Active meds",
  };
  document.getElementById("stat-row").innerHTML = Object.entries(labels)
    .map(
      ([k, label]) =>
        `<div class="stat"><div class="n">${s[k]}</div><div class="l">${label}</div></div>`
    )
    .join("");
}

// ── Prescribe ────────────────────────────────────────────────────────────────
async function onPatientChange() {
  const id = Number(document.getElementById("rx-patient").value);
  state.draft = [];
  state.conflicts = null;
  renderDraft();
  hideConflicts();
  document.getElementById("btn-save").disabled = true;

  const box = document.getElementById("active-meds");
  if (!id) {
    box.className = "active-meds empty";
    box.innerHTML = `<p class="muted">Active medications will appear here.</p>`;
    return;
  }

  const data = await ClinicService.getPatientDetail(id);
  if (!data.active_medications.length) {
    box.className = "active-meds empty";
    box.innerHTML = `<p class="muted">No active medications on record.</p>`;
    return;
  }
  box.className = "active-meds";
  box.innerHTML = data.active_medications
    .map(
      (m) => `
      <div class="med-chip">
        <strong>${m.medicine_name}</strong>
        <span>${m.dosage || ""} ${m.frequency || ""} · ${m.speciality_name} · ${m.doctor_name}</span>
      </div>`
    )
    .join("");
}

async function loadFormulary() {
  document.getElementById("formulary-label").textContent =
    "All medicines available to every doctor";

  const meds = await ClinicService.getMedicines();
  const wrap = document.getElementById("formulary");
  wrap.innerHTML = meds
    .map((m) => {
      const selected = state.draft.some((d) => d.medicine_id === m.medicine_id);
      return `
        <button type="button" class="med-btn ${selected ? "selected" : ""}"
                data-id="${m.medicine_id}" data-name="${m.medicine_name}">
          ${m.medicine_name}
          <span class="type">${m.type || ""} · ₹${Number(m.unit_price).toFixed(2)}</span>
        </button>`;
    })
    .join("");

  wrap.querySelectorAll(".med-btn").forEach((btn) => {
    btn.addEventListener("click", () => toggleDraft(Number(btn.dataset.id), btn.dataset.name));
  });
}

function toggleDraft(id, name) {
  const idx = state.draft.findIndex((d) => d.medicine_id === id);
  if (idx >= 0) {
    state.draft.splice(idx, 1);
  } else {
    state.draft.push({
      medicine_id: id,
      medicine_name: name,
      dosage: "",
      frequency: "Once daily",
      duration: "Ongoing",
    });
  }
  state.conflicts = null;
  hideConflicts();
  renderDraft();
  loadFormulary();
  document.getElementById("btn-save").disabled = state.draft.length === 0;
}

function renderDraft() {
  const el = document.getElementById("draft-items");
  if (!state.draft.length) {
    el.className = "draft empty";
    el.innerHTML = `<p class="muted">Add medicines from the formulary.</p>`;
    return;
  }
  el.className = "draft";
  el.innerHTML = state.draft
    .map(
      (d, i) => `
      <div class="draft-item" data-i="${i}">
        <strong>${d.medicine_name}</strong>
        <input placeholder="Dosage" value="${d.dosage}" data-field="dosage" />
        <input placeholder="Frequency" value="${d.frequency}" data-field="frequency" />
        <input placeholder="Duration" value="${d.duration}" data-field="duration" />
        <button type="button" class="icon-btn" data-remove="${i}" title="Remove">×</button>
      </div>`
    )
    .join("");

  el.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", (e) => {
      const i = Number(e.target.closest(".draft-item").dataset.i);
      state.draft[i][e.target.dataset.field] = e.target.value;
    });
  });
  el.querySelectorAll("[data-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.draft.splice(Number(btn.dataset.remove), 1);
      renderDraft();
      loadFormulary();
      document.getElementById("btn-save").disabled = state.draft.length === 0;
    });
  });
}

function hideConflicts() {
  document.getElementById("conflict-box").classList.add("hidden");
}

function renderConflicts(conflicts, safe) {
  const box = document.getElementById("conflict-box");
  box.classList.remove("hidden");
  if (safe) {
    box.className = "conflict-box ok";
    box.innerHTML = `<h4>✓ No conflicts detected</h4><p class="muted">Safe to save against the patient’s active medicines.</p>`;
    return;
  }
  box.className = "conflict-box";
  box.innerHTML =
    `<h4>⚠ Drug interactions flagged</h4>` +
    conflicts
      .map(
        (c) => `
      <div class="conflict-item">
        <span class="sev ${c.severity}">${c.severity}</span>
        <strong>${c.drug_a} ↔ ${c.drug_b}</strong>
        <div>${c.description}</div>
      </div>`
      )
      .join("") +
    (conflicts.some((c) => c.severity === "high")
      ? `<div class="actions" style="justify-content:flex-start;margin-top:.8rem">
           <button class="btn danger small" id="btn-force">Override &amp; save anyway</button>
         </div>`
      : "");

  const forceBtn = document.getElementById("btn-force");
  if (forceBtn) forceBtn.addEventListener("click", () => savePrescription(true));
}

async function checkConflicts() {
  const patient_id = Number(document.getElementById("rx-patient").value);
  if (!patient_id) return toast("Select a patient first");
  if (!state.draft.length) return toast("Add at least one medicine");

  const data = await ClinicService.checkConflicts(
    patient_id,
    state.draft.map((d) => d.medicine_id)
  );
  state.conflicts = data.conflicts;
  renderConflicts(data.conflicts, data.safe);
}

async function savePrescription(force = false) {
  const patient_id = Number(document.getElementById("rx-patient").value);
  if (!patient_id) return toast("Select a patient first");
  if (!state.draft.length) return toast("Add at least one medicine");

  // Sync draft input values
  document.querySelectorAll(".draft-item").forEach((row) => {
    const i = Number(row.dataset.i);
    row.querySelectorAll("input").forEach((inp) => {
      state.draft[i][inp.dataset.field] = inp.value;
    });
  });

  try {
    const result = await ClinicService.createPrescription({
      patient_id,
      doctor_id: doctorId(),
      force,
      items: state.draft.map(({ medicine_id, dosage, frequency, duration }) => ({
        medicine_id,
        dosage,
        frequency,
        duration,
      })),
    });

    toast(
      result.forced
        ? `Prescription #${result.prescription_no} saved with override warnings`
        : `Prescription #${result.prescription_no} saved`
    );
    state.draft = [];
    state.conflicts = null;
    renderDraft();
    hideConflicts();
    loadFormulary();
    onPatientChange();
    loadStats();
    document.getElementById("btn-save").disabled = true;
  } catch (err) {
    if (err.status === 409 && err.conflicts) {
      state.conflicts = err.conflicts;
      renderConflicts(err.conflicts, false);
      toast("Blocked: resolve or override high-severity conflicts");
    } else {
      toast(err.message || "Could not save prescription");
    }
  }
}

// ── Patients ─────────────────────────────────────────────────────────────────
async function renderPatientList() {
  state.patients = await ClinicService.getPatients();
  const ul = document.getElementById("patient-list");
  ul.innerHTML = state.patients
    .map(
      (p) => `
      <li>
        <button type="button" data-pid="${p.patient_id}"
                class="${state.selectedPatientId === p.patient_id ? "active" : ""}">
          ${p.patient_name}
          <span class="meta">${p.age} yrs · ${p.gender} · ${p.contact_no || "—"}</span>
        </button>
      </li>`
    )
    .join("");
  ul.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => loadPatientDetail(Number(btn.dataset.pid)));
  });
}

async function loadPatientDetail(id) {
  state.selectedPatientId = id;
  renderPatientList();
  const data = await ClinicService.getPatientDetail(id);
  const p = data.patient;
  const detail = document.getElementById("patient-detail");

  const active = data.active_medications.length
    ? data.active_medications
        .map(
          (m) => `
        <div class="item-row">
          <div>
            <strong>${m.medicine_name}</strong>
            <div class="muted">${m.dosage || ""} ${m.frequency || ""} · via ${m.speciality_name}</div>
          </div>
          <span class="badge active">active</span>
        </div>`
        )
        .join("")
    : `<p class="muted">No active medications.</p>`;

  const history = data.prescriptions
    .map((rx) => {
      const items = rx.items
        .map(
          (it) => `
          <div class="item-row">
            <div>
              <strong>${it.medicine_name}</strong>
              <div class="muted">${it.dosage || ""} · ${it.frequency || ""} · ${it.duration || ""}</div>
              ${(it.alerts || [])
                .map((a) => `<div class="alert-note">⚠ ${a.message}</div>`)
                .join("")}
            </div>
            <div>
              <span class="badge ${it.status}">${it.status}</span>
              ${
                it.status === "active"
                  ? `<button class="btn small ghost" style="margin-left:.35rem"
                       data-mark-past="${rx.prescription_no}:${it.item_no}">Mark past</button>`
                  : ""
              }
            </div>
          </div>`
        )
        .join("");
      return `
        <div class="rx-card">
          <div class="rx-meta">Rx #${rx.prescription_no} · ${rx.date} · ${rx.doctor_name} (${rx.speciality_name})</div>
          ${items}
        </div>`;
    })
    .join("");

  detail.innerHTML = `
    <h3>${p.patient_name}</h3>
    <p class="muted">${p.age} years · DOB ${p.dob} · ${p.gender} · ${p.contact_no || "No contact"}</p>
    <h3 class="mt">Active medications</h3>
    ${active}
    <div class="history-block">
      <h3>Prescription history</h3>
      ${history || `<p class="muted">No prescriptions yet.</p>`}
    </div>`;

  detail.querySelectorAll("[data-mark-past]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const [rx, item] = btn.dataset.markPast.split(":").map(Number);
      await ClinicService.updateItemStatus(rx, item, "past");
      toast("Marked as past");
      loadPatientDetail(id);
      loadStats();
    });
  });
}

async function registerPatient(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const body = Object.fromEntries(fd.entries());

  try {
    const created = await ClinicService.createPatient(body);
    state.patients = await ClinicService.getPatients();
    e.target.reset();
    e.target.classList.add("hidden");
    renderPatientList();

    const rxPatient = document.getElementById("rx-patient");
    rxPatient.innerHTML =
      `<option value="">Select patient…</option>` +
      state.patients
        .map(
          (p) =>
            `<option value="${p.patient_id}">${p.patient_name} (${p.age}y)</option>`
        )
        .join("");

    toast(`Registered ${created.patient_name}`);
    loadPatientDetail(created.patient_id);
    loadStats();
  } catch (err) {
    toast(err.message || "Failed to register patient");
  }
}

// ── Medicines & Interactions ─────────────────────────────────────────────────
async function loadMedicines() {
  const meds = await ClinicService.getMedicines();
  const rows = await Promise.all(
    meds.map(async (m) => {
      const subs = await ClinicService.getMedicineSubstitutes(m.medicine_id);
      return `
        <tr>
          <td><strong>${m.medicine_name}</strong></td>
          <td>${m.type || "—"}</td>
          <td>${m.manufacturer || "—"}</td>
          <td>₹${Number(m.unit_price).toFixed(2)}</td>
          <td>${subs.map((s) => s.medicine_name).join(", ") || "—"}</td>
        </tr>`;
    })
  );
  document.getElementById("medicine-table").innerHTML = rows.join("");
}

async function loadInteractions() {
  const list = await ClinicService.getInteractions();
  document.getElementById("interaction-list").innerHTML = list
    .map(
      (ix) => `
      <div class="ix-item">
        <div class="pair">
          <span class="sev ${ix.severity}">${ix.severity}</span>
          ${ix.drug_a} ↔ ${ix.drug_b}
        </div>
        <div class="muted">${ix.notes || ""}</div>
        <div>${ix.description}</div>
      </div>`
    )
    .join("");
}

// ── Start Application ────────────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  boot().catch((err) => {
    console.error(err);
    toast("Failed to initialize clinic data");
  });
});