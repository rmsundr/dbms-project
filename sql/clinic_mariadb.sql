-- Clinic E-Prescription Workflow System
-- Specialty-Based Relational Database Architecture
-- MariaDB / MySQL compatible (Combined Schema & Seed Data)

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS item_alert;
DROP TABLE IF EXISTS warning_alert;
DROP TABLE IF EXISTS prescription_item;
DROP TABLE IF EXISTS prescription;
DROP TABLE IF EXISTS medicine_interaction;
DROP TABLE IF EXISTS medicine_substitute;
DROP TABLE IF EXISTS master_medicine;
DROP TABLE IF EXISTS doctor_qualification;
DROP TABLE IF EXISTS doctor;
DROP TABLE IF EXISTS patient;
DROP TABLE IF EXISTS speciality;
-- login(updated content)
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ── SCHEMA ───────────────────────────────────────────────────────────────────

CREATE TABLE speciality (
    speciality_id   INT AUTO_INCREMENT PRIMARY KEY,
    speciality_name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE doctor (
    doctor_id      INT AUTO_INCREMENT PRIMARY KEY,
    doctor_name    VARCHAR(150) NOT NULL,
    contact_no     VARCHAR(20),
    speciality_id  INT NOT NULL,
    CONSTRAINT fk_doctor_speciality
        FOREIGN KEY (speciality_id) REFERENCES speciality(speciality_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Multi-valued attribute: doctor.qualification
CREATE TABLE doctor_qualification (
    doctor_id     INT NOT NULL,
    qualification VARCHAR(100) NOT NULL,
    PRIMARY KEY (doctor_id, qualification),
    CONSTRAINT fk_dq_doctor
        FOREIGN KEY (doctor_id) REFERENCES doctor(doctor_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE patient (
    patient_id   INT AUTO_INCREMENT PRIMARY KEY,
    patient_name VARCHAR(150) NOT NULL,
    dob          DATE NOT NULL,
    contact_no   VARCHAR(20),
    gender       CHAR(1) NOT NULL,
    CONSTRAINT chk_patient_gender CHECK (gender IN ('M', 'F', 'O'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Single medicine master (one source of truth)
CREATE TABLE master_medicine (
    medicine_id   INT AUTO_INCREMENT PRIMARY KEY,
    medicine_name VARCHAR(150) NOT NULL UNIQUE,
    `type`        VARCHAR(50),
    manufacturer  VARCHAR(100),
    unit_price    DECIMAL(10, 2),
    CONSTRAINT chk_medicine_price CHECK (unit_price IS NULL OR unit_price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Alternate / substitute medicines (1 original → M substitutes)
CREATE TABLE medicine_substitute (
    original_id   INT NOT NULL,
    substitute_id INT NOT NULL,
    PRIMARY KEY (original_id, substitute_id),
    CONSTRAINT fk_ms_original
        FOREIGN KEY (original_id) REFERENCES master_medicine(medicine_id) ON DELETE CASCADE,
    CONSTRAINT fk_ms_substitute
        FOREIGN KEY (substitute_id) REFERENCES master_medicine(medicine_id) ON DELETE CASCADE,
    CONSTRAINT chk_ms_distinct CHECK (original_id <> substitute_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Drug–drug interaction pairs (predefined conflict rules)
CREATE TABLE medicine_interaction (
    drug_a_id   INT NOT NULL,
    drug_b_id   INT NOT NULL,
    notes       VARCHAR(255),
    description TEXT,
    severity    VARCHAR(20) NOT NULL DEFAULT 'high',
    PRIMARY KEY (drug_a_id, drug_b_id),
    CONSTRAINT fk_mi_drug_a
        FOREIGN KEY (drug_a_id) REFERENCES master_medicine(medicine_id) ON DELETE CASCADE,
    CONSTRAINT fk_mi_drug_b
        FOREIGN KEY (drug_b_id) REFERENCES master_medicine(medicine_id) ON DELETE CASCADE,
    CONSTRAINT chk_mi_severity CHECK (severity IN ('low', 'moderate', 'high')),
    CONSTRAINT chk_mi_ordered CHECK (drug_a_id < drug_b_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE prescription (
    prescription_no INT AUTO_INCREMENT PRIMARY KEY,
    patient_id      INT NOT NULL,
    doctor_id       INT NOT NULL,
    `date`          DATE NOT NULL DEFAULT (CURRENT_DATE),
    CONSTRAINT fk_rx_patient
        FOREIGN KEY (patient_id) REFERENCES patient(patient_id),
    CONSTRAINT fk_rx_doctor
        FOREIGN KEY (doctor_id) REFERENCES doctor(doctor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Weak entity: identified by (prescription_no, item_no)
CREATE TABLE prescription_item (
    prescription_no INT NOT NULL,
    item_no         INT NOT NULL,
    medicine_id     INT NOT NULL,
    dosage          VARCHAR(100),
    frequency       VARCHAR(100),
    duration        VARCHAR(100),
    status          VARCHAR(20) NOT NULL DEFAULT 'active',
    PRIMARY KEY (prescription_no, item_no),
    CONSTRAINT fk_pi_rx
        FOREIGN KEY (prescription_no) REFERENCES prescription(prescription_no) ON DELETE CASCADE,
    CONSTRAINT fk_pi_medicine
        FOREIGN KEY (medicine_id) REFERENCES master_medicine(medicine_id),
    CONSTRAINT chk_pi_status CHECK (status IN ('active', 'past'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE warning_alert (
    alert_id   INT AUTO_INCREMENT PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL,
    message    TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- M:N between prescription_item and warning_alert
CREATE TABLE item_alert (
    prescription_no INT NOT NULL,
    item_no         INT NOT NULL,
    alert_id        INT NOT NULL,
    PRIMARY KEY (prescription_no, item_no, alert_id),
    CONSTRAINT fk_ia_item
        FOREIGN KEY (prescription_no, item_no)
            REFERENCES prescription_item(prescription_no, item_no) ON DELETE CASCADE,
    CONSTRAINT fk_ia_alert
        FOREIGN KEY (alert_id) REFERENCES warning_alert(alert_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Helpful indexes
CREATE INDEX idx_doctor_speciality ON doctor(speciality_id);
CREATE INDEX idx_rx_patient ON prescription(patient_id);
CREATE INDEX idx_rx_doctor ON prescription(doctor_id);
CREATE INDEX idx_item_medicine ON prescription_item(medicine_id);
CREATE INDEX idx_item_status ON prescription_item(status);

-- login(updated content)
CREATE TABLE users (
    user_id    INT AUTO_INCREMENT PRIMARY KEY,
    username   VARCHAR(100) NOT NULL UNIQUE,
    password   VARCHAR(100) NOT NULL,
    role       VARCHAR(20) NOT NULL,
    CONSTRAINT chk_user_role CHECK (role IN ('owner', 'staff', 'doctor'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── SEED DATA ────────────────────────────────────────────────────────────────

INSERT INTO speciality (speciality_name) VALUES
    ('Cardiology'),
    ('Endocrinology'),
    ('General Medicine'),
    ('Geriatrics'),
    ('Nephrology');

INSERT INTO doctor (doctor_name, contact_no, speciality_id) VALUES
    ('Dr. Anitha Menon',   '9876543210', 1),
    ('Dr. Rajesh Kumar',   '9876543211', 2),
    ('Dr. Sreelatha Nair', '9876543212', 3),
    ('Dr. Mohammed Ali',   '9876543213', 4),
    ('Dr. Priya Varma',    '9876543214', 5);

INSERT INTO doctor_qualification VALUES
    (1, 'MD Cardiology'),
    (1, 'DM Interventional Cardiology'),
    (2, 'MD Medicine'),
    (2, 'DM Endocrinology'),
    (3, 'MBBS'),
    (3, 'MD General Medicine'),
    (4, 'MD Geriatrics'),
    (5, 'MD Medicine'),
    (5, 'DM Nephrology');

INSERT INTO patient (patient_name, dob, contact_no, gender) VALUES
    ('K. Krishnan',        '1952-03-14', '9447001001', 'M'),
    ('Lakshmi Amma',       '1948-07-22', '9447001002', 'F'),
    ('Thomas Varghese',    '1955-11-05', '9447001003', 'M'),
    ('Fatima Beevi',       '1960-01-18', '9447001004', 'F'),
    ('P. Narayanan',       '1958-09-30', '9447001005', 'M'),
    ('Saraswathy Pillai',  '1963-04-12', '9447001006', 'F');

INSERT INTO master_medicine (medicine_name, `type`, manufacturer, unit_price) VALUES
    ('Aspirin',           'Antiplatelet',     'Bayer',           12.50),
    ('Clopidogrel',       'Antiplatelet',     'Sanofi',          45.00),
    ('Atorvastatin',      'Statin',           'Pfizer',          38.00),
    ('Metoprolol',        'Beta-blocker',     'AstraZeneca',     22.00),
    ('Amlodipine',        'Calcium channel',  'Pfizer',          18.00),
    ('Enalapril',         'ACE inhibitor',    'Cipla',           15.00),
    ('Warfarin',          'Anticoagulant',    'Bristol-Myers',   55.00),
    ('Metformin',         'Antidiabetic',     'USV',             8.00),
    ('Glimepiride',       'Sulfonylurea',     'Sanofi',          14.00),
    ('Insulin Glargine',  'Insulin',          'Sanofi',          480.00),
    ('Sitagliptin',       'DPP-4 inhibitor',  'MSD',             95.00),
    ('Paracetamol',       'Analgesic',        'GSK',             5.00),
    ('Amoxicillin',       'Antibiotic',       'Cipla',           28.00),
    ('Omeprazole',        'PPI',              'Dr Reddy''s',     16.00),
    ('Ibuprofen',         'NSAID',            'Abbott',          10.00),
    ('Diclofenac',        'NSAID',            'Novartis',        12.00),
    ('Spironolactone',    'Diuretic',         'RPG Life',        20.00),
    ('Furosemide',        'Loop diuretic',    'Sanofi',          9.00),
    ('Losartan',          'ARB',              'Torrent',         24.00),
    ('Allopurinol',       'Uric acid',        'Zyloric',         18.00);

-- Substitutes (alternate relationship)
INSERT INTO medicine_substitute VALUES
    (15, 16),  -- Ibuprofen → Diclofenac
    (6, 19),   -- Enalapril → Losartan
    (1, 2);    -- Aspirin → Clopidogrel

-- Known dangerous / notable interactions (drug_a_id < drug_b_id)
INSERT INTO medicine_interaction (drug_a_id, drug_b_id, notes, description, severity) VALUES
    (1, 7,  'Bleeding risk',
     'Aspirin + Warfarin greatly increases risk of major bleeding.', 'high'),
    (1, 15, 'GI bleed / renal risk',
     'Aspirin + Ibuprofen raises gastrointestinal bleeding risk and may reduce antiplatelet effect.', 'high'),
    (1, 16, 'GI bleed risk',
     'Aspirin + Diclofenac increases bleeding and ulcer risk.', 'high'),
    (7, 15, 'Severe bleeding',
     'Warfarin + Ibuprofen can cause life-threatening haemorrhage.', 'high'),
    (7, 16, 'Severe bleeding',
     'Warfarin + Diclofenac significantly elevates bleeding risk.', 'high'),
    (6, 17, 'Hyperkalemia',
     'Enalapril + Spironolactone may cause dangerous hyperkalemia.', 'high'),
    (8, 9,  'Hypoglycemia',
     'Metformin + Glimepiride can cause additive hypoglycemia; monitor glucose closely.', 'moderate'),
    (4, 5,  'Bradycardia / hypotension',
     'Metoprolol + Amlodipine may cause excessive blood-pressure drop or bradycardia.', 'moderate'),
    (15, 18, 'Nephrotoxicity',
     'Ibuprofen + Furosemide can worsen kidney function, especially in elderly patients.', 'high'),
    (16, 18, 'Nephrotoxicity',
     'Diclofenac + Furosemide increases risk of acute kidney injury.', 'high'),
    (3, 7,  'INR fluctuation',
     'Atorvastatin may potentiate Warfarin effect; monitor INR.', 'moderate'),
    (17, 19, 'Hyperkalemia',
     'Spironolactone + Losartan can elevate serum potassium.', 'high');

-- Sample past / active prescriptions showing cross-department history
INSERT INTO prescription (patient_id, doctor_id, `date`) VALUES
    (1, 1, '2026-08-10'),  -- Krishnan seen by Cardiology
    (1, 2, '2026-09-02'),  -- same patient later by Endocrinology
    (2, 4, '2026-09-15'),  -- Lakshmi Amma / Geriatrics
    (3, 3, '2026-09-20'),  -- Thomas / General Medicine
    (4, 3, '2026-10-04');  -- Fatima Beevi / General Medicine (from live clinic.db)

INSERT INTO prescription_item (prescription_no, item_no, medicine_id, dosage, frequency, duration, status) VALUES
    (1, 1, 1,  '75 mg',  'Once daily',  'Ongoing', 'active'),   -- Aspirin
    (1, 2, 3,  '10 mg',  'Once daily',  'Ongoing', 'active'),   -- Atorvastatin
    (1, 3, 4,  '25 mg',  'Twice daily', 'Ongoing', 'active'),   -- Metoprolol
    (2, 1, 8,  '500 mg', 'Twice daily', 'Ongoing', 'active'),   -- Metformin
    (2, 2, 9,  '1 mg',   'Once daily',  'Ongoing', 'active'),   -- Glimepiride
    (3, 1, 5,  '5 mg',   'Once daily',  'Ongoing', 'active'),   -- Amlodipine
    (3, 2, 12, '500 mg', 'As needed',   '7 days',  'past'),     -- Paracetamol
    (4, 1, 14, '20 mg',  'Once daily',  '14 days', 'active'),   -- Omeprazole
    (5, 1, 12, '500 mg', 'SOS',         '3 days',  'active');   -- Paracetamolx