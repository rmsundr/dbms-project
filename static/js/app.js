/* ClinicRx frontend */

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

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || res.statusText);
    err.data = data;
    err.status = res.status;
    throw err;
  }
  return data;
}

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

/* ── Boot ─────────────────────────────────────────────────────────────── */

async function boot() {
  state.doctors = await api("/api/doctors");
  state.patients = await api("/api/patients");

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
  document.getElementById("btn-save").addEventListener("click", savePrescription);
  document.getElementById("btn-toggle-form").addEventListener("click", () => {
    document.getElementById("patient-form").classList.toggle("hidden");
  });
  document.getElementById("patient-form").addEventListener("submit", registerPatient);

  await loadStats();
}

/* ── Dashboard ────────────────────────────────────────────────────────── */

async function loadStats() {
  const s = await api("/api/stats");
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

/* ── Prescribe ────────────────────────────────────────────────────────── */

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

  const data = await api(`/api/patients/${id}`);
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

  const meds = await api("/api/medicines");
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

  const data = await api("/api/conflicts/check", {
    method: "POST",
    body: JSON.stringify({
      patient_id,
      medicine_ids: state.draft.map((d) => d.medicine_id),
    }),
  });
  state.conflicts = data.conflicts;
  renderConflicts(data.conflicts, data.safe);
}

async function savePrescription(force = false) {
  const patient_id = Number(document.getElementById("rx-patient").value);
  if (!patient_id) return toast("Select a patient first");
  if (!state.draft.length) return toast("Add at least one medicine");

  // sync input values
  document.querySelectorAll(".draft-item").forEach((row) => {
    const i = Number(row.dataset.i);
    row.querySelectorAll("input").forEach((inp) => {
      state.draft[i][inp.dataset.field] = inp.value;
    });
  });

  try {
    const result = await api("/api/prescriptions", {
      method: "POST",
      body: JSON.stringify({
        patient_id,
        doctor_id: doctorId(),
        force: !!force,
        items: state.draft.map(({ medicine_id, dosage, frequency, duration }) => ({
          medicine_id,
          dosage,
          frequency,
          duration,
        })),
      }),
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
    document.getElementById("btn-save").disabled = true;
  } catch (err) {
    if (err.status === 409 && err.data?.conflicts) {
      state.conflicts = err.data.conflicts;
      renderConflicts(err.data.conflicts, false);
      toast("Blocked: resolve or override high-severity conflicts");
    } else {
      toast(err.message || "Could not save prescription");
    }
  }
}

/* ── Patients ─────────────────────────────────────────────────────────── */

function renderPatientList() {
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
  const data = await api(`/api/patients/${id}`);
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
      const [rx, item] = btn.dataset.markPast.split(":");
      await api(`/api/prescriptions/${rx}/items/${item}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "past" }),
      });
      toast("Marked as past");
      loadPatientDetail(id);
    });
  });
}

async function registerPatient(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const body = Object.fromEntries(fd.entries());
  const created = await api("/api/patients", {
    method: "POST",
    body: JSON.stringify(body),
  });
  state.patients = await api("/api/patients");
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
}

/* ── Medicines & interactions ─────────────────────────────────────────── */

async function loadMedicines() {
  const meds = await api("/api/medicines");
  const rows = await Promise.all(
    meds.map(async (m) => {
      const subs = await api(`/api/medicines/${m.medicine_id}/substitutes`);
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
  const list = await api("/api/interactions");
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

boot().catch((err) => {
  console.error(err);
  toast("Failed to load clinic data");
});
