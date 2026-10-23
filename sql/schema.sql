-- Clinic E-Prescription Workflow System
-- Specialty-Based Relational Database Architecture
-- MariaDB / MySQL compatible

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