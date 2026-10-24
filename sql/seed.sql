-- Seed data: small Kerala multi-specialty clinic
-- MariaDB / MySQL compatible (includes live clinic.db rows)

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
    (5, 1, 12, '500 mg', 'SOS',         '3 days',  'active');   -- Paracetamol

-- Clinic User Authentication & Specialty Logins
INSERT INTO clinic_user (username, password_hash, full_name, role, speciality_id, doctor_id) VALUES
    ('login.general',      '$2y$10$general_hash',      'Dr. Sreelatha Nair',  'doctor', 3, 3),
    ('login.cardiology',   '$2y$10$cardiology_hash',   'Dr. Anitha Menon',    'doctor', 1, 1),
    ('login.endocrinology','$2y$10$endocrinology_hash','Dr. Rajesh Kumar',    'doctor', 2, 2),
    ('login.geriatrics',   '$2y$10$geriatrics_hash',   'Dr. Mohammed Ali',    'doctor', 4, 4),
    ('login.nephrology',   '$2y$10$nephrology_hash',   'Dr. Priya Varma',     'doctor', 5, 5),
    ('staff.reception',    '$2y$10$staff_hash',        'Anjali Staff',        'staff',  NULL, NULL),
    ('admin.root',         '$2y$10$admin_hash',        'System Admin',        'admin',  NULL, NULL);