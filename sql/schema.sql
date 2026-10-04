-- Clinic E-Prescription Workflow System
-- Specialty-Based Relational Database Architecture

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS speciality (
    speciality_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    speciality_name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS doctor (
    doctor_id      INTEGER PRIMARY KEY AUTOINCREMENT,
    doctor_name    TEXT NOT NULL,
    contact_no     TEXT,
    speciality_id  INTEGER NOT NULL,
    FOREIGN KEY (speciality_id) REFERENCES speciality(speciality_id)
);

-- Multi-valued attribute: doctor.qualification
CREATE TABLE IF NOT EXISTS doctor_qualification (
    doctor_id     INTEGER NOT NULL,
    qualification TEXT NOT NULL,
    PRIMARY KEY (doctor_id, qualification),
    FOREIGN KEY (doctor_id) REFERENCES doctor(doctor_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS patient (
    patient_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_name TEXT NOT NULL,
    dob          DATE NOT NULL,
    contact_no   TEXT,
    gender       TEXT NOT NULL CHECK (gender IN ('M', 'F', 'O'))
);

-- Single medicine master (one source of truth)
CREATE TABLE IF NOT EXISTS master_medicine (
    medicine_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    medicine_name TEXT NOT NULL UNIQUE,
    type          TEXT,
    manufacturer  TEXT,
    unit_price    REAL CHECK (unit_price >= 0)
);

-- Specialty ↔ Medicine (M:N) — smart filtering
CREATE TABLE IF NOT EXISTS specialty_medicine (
    speciality_id INTEGER NOT NULL,
    medicine_id   INTEGER NOT NULL,
    PRIMARY KEY (speciality_id, medicine_id),
    FOREIGN KEY (speciality_id) REFERENCES speciality(speciality_id) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id)   REFERENCES master_medicine(medicine_id) ON DELETE CASCADE
);

-- Alternate / substitute medicines (1 original → M substitutes)
CREATE TABLE IF NOT EXISTS medicine_substitute (
    original_id   INTEGER NOT NULL,
    substitute_id INTEGER NOT NULL,
    PRIMARY KEY (original_id, substitute_id),
    FOREIGN KEY (original_id)   REFERENCES master_medicine(medicine_id) ON DELETE CASCADE,
    FOREIGN KEY (substitute_id) REFERENCES master_medicine(medicine_id) ON DELETE CASCADE,
    CHECK (original_id <> substitute_id)
);

-- Drug–drug interaction pairs (predefined conflict rules)
CREATE TABLE IF NOT EXISTS medicine_interaction (
    drug_a_id   INTEGER NOT NULL,
    drug_b_id   INTEGER NOT NULL,
    notes       TEXT,
    description TEXT,
    severity    TEXT NOT NULL DEFAULT 'high'
                CHECK (severity IN ('low', 'moderate', 'high')),
    PRIMARY KEY (drug_a_id, drug_b_id),
    FOREIGN KEY (drug_a_id) REFERENCES master_medicine(medicine_id) ON DELETE CASCADE,
    FOREIGN KEY (drug_b_id) REFERENCES master_medicine(medicine_id) ON DELETE CASCADE,
    CHECK (drug_a_id < drug_b_id)
);

CREATE TABLE IF NOT EXISTS prescription (
    prescription_no INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id      INTEGER NOT NULL,
    doctor_id       INTEGER NOT NULL,
    date            DATE NOT NULL DEFAULT (date('now')),
    FOREIGN KEY (patient_id) REFERENCES patient(patient_id),
    FOREIGN KEY (doctor_id)  REFERENCES doctor(doctor_id)
);

-- Weak entity: identified by (prescription_no, item_no)
CREATE TABLE IF NOT EXISTS prescription_item (
    prescription_no INTEGER NOT NULL,
    item_no         INTEGER NOT NULL,
    medicine_id     INTEGER NOT NULL,
    dosage          TEXT,
    frequency       TEXT,
    duration        TEXT,
    status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'past')),
    PRIMARY KEY (prescription_no, item_no),
    FOREIGN KEY (prescription_no) REFERENCES prescription(prescription_no) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id)     REFERENCES master_medicine(medicine_id)
);

CREATE TABLE IF NOT EXISTS warning_alert (
    alert_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_type TEXT NOT NULL,
    message    TEXT NOT NULL
);

-- M:N between prescription_item and warning_alert
CREATE TABLE IF NOT EXISTS item_alert (
    prescription_no INTEGER NOT NULL,
    item_no         INTEGER NOT NULL,
    alert_id        INTEGER NOT NULL,
    PRIMARY KEY (prescription_no, item_no, alert_id),
    FOREIGN KEY (prescription_no, item_no)
        REFERENCES prescription_item(prescription_no, item_no) ON DELETE CASCADE,
    FOREIGN KEY (alert_id) REFERENCES warning_alert(alert_id) ON DELETE CASCADE
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_doctor_speciality ON doctor(speciality_id);
CREATE INDEX IF NOT EXISTS idx_rx_patient ON prescription(patient_id);
CREATE INDEX IF NOT EXISTS idx_rx_doctor ON prescription(doctor_id);
CREATE INDEX IF NOT EXISTS idx_item_medicine ON prescription_item(medicine_id);
CREATE INDEX IF NOT EXISTS idx_item_status ON prescription_item(status);
