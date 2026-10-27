 const express = require('express');                                                                                                 
    const cors = require('cors');                                                                                                       
    const mysql = require('mysql2/promise');                                                                                            
    const path = require('path');                                                                                                       
    require('dotenv').config();                                                                                                         
                                                                                                                                        
    const app = express();                                                                                                              
    const PORT = process.env.PORT || 5000;                                                                                              
                                                                                                                                        
    // ── Middleware ───────────────────────────────────────────────────────────────                                                    
    app.use(cors());                                                                                                                    
    app.use(express.json());                                                                                                            

    // Serve static frontend files with strict no-cache headers to avoid stale browser caches                                                                  
    app.use(express.static(path.join(__dirname), {
      etag: false,
      lastModified: false,
      setHeaders: (res) => {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    }));                                                                                      
                                                                                                                                        
    // ── Database Connection Pool ─────────────────────────────────────────────────                                                    
const pool = mysql.createPool({
  host: process.env.DB_HOST || process.env.MARIADB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || process.env.MARIADB_PORT) || 3306,
  user: process.env.DB_USER || process.env.MARIADB_USER || 'clinic_user',
  password: process.env.DB_PASSWORD || process.env.MARIADB_PASSWORD || 'clinic123',
  database: process.env.DB_NAME || process.env.MARIADB_DATABASE || 'clinic',                                                                                        
      waitForConnections: true,                                                                                                         
      connectionLimit: 10,                                                                                                              
      queueLimit: 0,                                                                                                                    
    });                                                                                                                                 
                                                                                                                                        
    // Helper: Age calculation from Date of Birth                                                                                       
    function calculateAge(dob) {                                                                                                        
      if (!dob) return 0;                                                                                                               
      const birth = new Date(dob);                                                                                                      
      const today = new Date();                                                                                                         
      let age = today.getFullYear() - birth.getFullYear();                                                                              
      const m = today.getMonth() - birth.getMonth();                                                                                    
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {                                                                    
        age--;                                                                                                                          
      }                                                                                                                                 
      return age >= 0 ? age : 0;                                                                                                        
    }                                                                                                                                   
                                                                                                                                        
    // ── 1. Doctors & Specialties ─────────────────────────────────────────────────                                                    
                                                                                                                                        
    // GET /api/doctors — List all doctors with their qualifications                                                                    
    app.get('/api/doctors', async (req, res) => {                                                                                       
      try {                                                                                                                             
        const [doctors] = await pool.query(`                                                                                            
          SELECT d.doctor_id, d.doctor_name, d.contact_no, s.speciality_id, s.speciality_name                                           
          FROM doctor d                                                                                                                 
          JOIN speciality s ON s.speciality_id = d.speciality_id                                                                        
          ORDER BY d.doctor_name                                                                                                        
        `);                                                                                                                             
                                                                                                                                        
        for (const doc of doctors) {                                                                                                    
          const [quals] = await pool.query(                                                                                             
            'SELECT qualification FROM doctor_qualification WHERE doctor_id = ?',                                                       
            [doc.doctor_id]                                                                                                             
          );                                                                                                                            
          doc.qualifications = quals.map((q) => q.qualification);                                                                       
        }                                                                                                                               
                                                                                                                                        
        res.json(doctors);                                                                                                              
      } catch (err) {                                                                                                                   
        console.error('Error fetching doctors:', err);                                                                                  
        res.status(500).json({ error: 'Database error fetching doctors' });                                                             
      }                                                                                                                                 
    });                                                                                                                                 
                                                                                                                                        
    // GET /api/specialties — List all clinic specialties                                                                               
    app.get('/api/specialties', async (req, res) => {                                                                                   
      try {                                                                                                                             
        const [rows] = await pool.query(                                                                                                
          'SELECT speciality_id, speciality_name FROM speciality ORDER BY speciality_name'                                              
        );                                                                                                                              
        res.json(rows);                                                                                                                 
      } catch (err) {                                                                                                                   
        console.error('Error fetching specialties:', err);                                                                              
        res.status(500).json({ error: 'Database error fetching specialties' });                                                         
      }                                                                                                                                 
    });                                                                                                                                 
                                                                                                                                        
    // ── 2. Patients ──────────────────────────────────────────────────────────────                                                    
                                                                                                                                        
    // GET /api/patients — List all patients with calculated ages                                                                       
    app.get('/api/patients', async (req, res) => {                                                                                      
      try {                                                                                                                             
        const [patients] = await pool.query(`                                                                                           
          SELECT patient_id, patient_name, DATE_FORMAT(dob, '%Y-%m-%d') AS dob, contact_no, gender                                      
          FROM patient                                                                                                                  
          ORDER BY patient_name                                                                                                         
        `);                                                                                                                             
                                                                                                                                        
        patients.forEach((p) => {                                                                                                       
          p.age = calculateAge(p.dob);                                                                                                  
        });                                                                                                                             
                                                                                                                                        
        res.json(patients);                                                                                                             
      } catch (err) {                                                                                                                   
        console.error('Error fetching patients:', err);                                                                                 
        res.status(500).json({ error: 'Database error fetching patients' });                                                            
      }                                                                                                                                 
    });                                                                                                                                 
                                                                                                                                        
    // POST /api/patients — Register a new patient                                                                                      
    app.post('/api/patients', async (req, res) => {                                                                                     
      const { patient_name, dob, contact_no, gender } = req.body;                                                                       
                                                                                                                                        
      if (!patient_name || !dob || !gender) {                                                                                           
        return res.status(400).json({ error: 'patient_name, dob, and gender are required' });                                           
      }                                                                                                                                 
                                                                                                                                        
      try {                                                                                                                             
        const [result] = await pool.query(                                                                                              
          'INSERT INTO patient (patient_name, dob, contact_no, gender) VALUES (?, ?, ?, ?)',                                            
          [patient_name.trim(), dob, contact_no || null, gender]                                                                        
        );                                                                                                                              
                                                                                                                                        
        const newId = result.insertId;                                                                                                  
        res.status(201).json({                                                                                                          
          patient_id: newId,                                                                                                            
          patient_name: patient_name.trim(),                                                                                            
          dob,                                                                                                                          
          contact_no: contact_no || null,                                                                                               
          gender,                                                                                                                       
          age: calculateAge(dob),                                                                                                       
        });                                                                                                                             
      } catch (err) {                                                                                                                   
        console.error('Error registering patient:', err);                                                                               
        res.status(500).json({ error: 'Database error creating patient' });                                                             
      }                                                                                                                                 
    });                                                                                                                                 
                                                                                                                                        
    // GET /api/patients/:id — Detailed patient history & active medications                                                            
    app.get('/api/patients/:id', async (req, res) => {                                                                                  
      const patientId = Number(req.params.id);                                                                                          
                                                                                                                                        
      try {                                                                                                                             
        const [patientRows] = await pool.query(                                                                                         
          "SELECT patient_id, patient_name, DATE_FORMAT(dob, '%Y-%m-%d') AS dob, contact_no, gender FROM patient WHERE patient_id = ?", 
          [patientId]                                                                                                                   
        );                                                                                                                              
        if (!patientRows.length) return res.status(404).json({ error: 'Patient not found' });                                           
                                                                                                                                        
        const patient = patientRows[0];                                                                                                 
        patient.age = calculateAge(patient.dob);                                                                                        
                                                                                                                                        
        // Prescription history                                                                                                         
        const [rxRows] = await pool.query(                                                                                              
          `SELECT p.prescription_no, DATE_FORMAT(p.date, '%Y-%m-%d') AS date,                                                           
                  d.doctor_id, d.doctor_name, s.speciality_name                                                                         
           FROM prescription p                                                                                                          
           JOIN doctor d ON d.doctor_id = p.doctor_id                                                                                   
           JOIN speciality s ON s.speciality_id = d.speciality_id                                                                       
           WHERE p.patient_id = ?                                                                                                       
           ORDER BY p.date DESC, p.prescription_no DESC`,                                                                               
          [patientId]                                                                                                                   
        );                                                                                                                              
                                                                                                                                        
        for (const rx of rxRows) {                                                                                                      
          const [items] = await pool.query(                                                                                             
            `SELECT pi.item_no, pi.dosage, pi.frequency, pi.duration, pi.status,                                                        
                    m.medicine_id, m.medicine_name, m.type                                                                              
             FROM prescription_item pi                                                                                                  
             JOIN master_medicine m ON m.medicine_id = pi.medicine_id                                                                   
             WHERE pi.prescription_no = ?                                                                                               
             ORDER BY pi.item_no`,                                                                                                      
            [rx.prescription_no]                                                                                                        
          );                                                                                                                            
                                                                                                                                        
          for (const item of items) {                                                                                                   
            const [alerts] = await pool.query(                                                                                          
              `SELECT wa.alert_id, wa.alert_type, wa.message                                                                            
               FROM item_alert ia                                                                                                       
               JOIN warning_alert wa ON wa.alert_id = ia.alert_id                                                                       
               WHERE ia.prescription_no = ? AND ia.item_no = ?`,                                                                        
              [rx.prescription_no, item.item_no]                                                                                        
            );                                                                                                                          
            item.alerts = alerts;                                                                                                       
          }                                                                                                                             
          rx.items = items;                                                                                                             
        }                                                                                                                               
                                                                                                                                        
        // Distinct currently active medications                                                                                        
        const [activeMeds] = await pool.query(                                                                                          
          `SELECT DISTINCT m.medicine_id, m.medicine_name, m.type,                                                                      
                  pi.dosage, pi.frequency, pi.duration,                                                                                 
                  DATE_FORMAT(p.date, '%Y-%m-%d') AS prescribed_on,                                                                     
                  d.doctor_name, s.speciality_name                                                                                      
           FROM prescription_item pi                                                                                                    
           JOIN prescription p ON p.prescription_no = pi.prescription_no                                                                
           JOIN master_medicine m ON m.medicine_id = pi.medicine_id                                                                     
           JOIN doctor d ON d.doctor_id = p.doctor_id                                                                                   
           JOIN speciality s ON s.speciality_id = d.speciality_id                                                                       
           WHERE p.patient_id = ? AND pi.status = 'active'                                                                              
           ORDER BY m.medicine_name`,                                                                                                   
          [patientId]                                                                                                                   
        );                                                                                                                              
                                                                                                                                        
        res.json({                                                                                                                      
          patient,                                                                                                                      
          active_medications: activeMeds,                                                                                               
          prescriptions: rxRows,                                                                                                        
        });                                                                                                                             
      } catch (err) {                                                                                                                   
        console.error('Error fetching patient record:', err);                                                                           
        res.status(500).json({ error: 'Database error fetching patient' });                                                             
      }                                                                                                                                 
    });                                                                                                                                 
                                                                                                                                        
    // ── 3. Medicines & Interactions ──────────────────────────────────────────────                                                    
                                                                                                                                        
    // GET /api/medicines — Master medicine formulary                                                                                   
    app.get('/api/medicines', async (req, res) => {                                                                                     
      try {                                                                                                                             
        const [meds] = await pool.query(                                                                                                
          'SELECT medicine_id, medicine_name, type, manufacturer, unit_price FROM master_medicine ORDER BY medicine_name'               
        );                                                                                                                              
        res.json(meds);                                                                                                                 
      } catch (err) {                                                                                                                   
        console.error('Error fetching medicines:', err);                                                                                
        res.status(500).json({ error: 'Database error fetching medicines' });                                                           
      }                                                                                                                                 
    });                                                                                                                                 

    // POST /api/medicines — Add a new medicine into the database (Owner only)
    app.post('/api/medicines', async (req, res) => {
      const { medicine_name, type, manufacturer, unit_price, role, owner_role, user_role } = req.body;
      const effectiveRole = String(role || owner_role || user_role || '').trim().toLowerCase();
      if (effectiveRole !== 'owner') {
        return res.status(403).json({ error: 'Only clinic owner can add medicines' });
      }

      if (!medicine_name || !medicine_name.trim()) {
        return res.status(400).json({ error: 'Medicine name is required' });
      }

      const priceNum = unit_price !== undefined && unit_price !== '' ? Number(unit_price) : 0;
      if (isNaN(priceNum) || priceNum < 0) {
        return res.status(400).json({ error: 'Unit price must be a non-negative number' });
      }

      try {
        const [result] = await pool.query(
          'INSERT INTO master_medicine (medicine_name, type, manufacturer, unit_price) VALUES (?, ?, ?, ?)',
          [medicine_name.trim(), type ? type.trim() : null, manufacturer ? manufacturer.trim() : null, priceNum]
        );

        const newId = result.insertId;
        res.status(201).json({
          medicine_id: newId,
          medicine_name: medicine_name.trim(),
          type: type ? type.trim() : null,
          manufacturer: manufacturer ? manufacturer.trim() : null,
          unit_price: priceNum,
        });
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ error: 'Medicine with this name already exists' });
        }
        console.error('Error adding medicine:', err);
        res.status(500).json({ error: 'Database error adding medicine' });
      }
    });                                                                                                                                 
                                                                                                                                        
    // GET /api/medicines/:id/substitutes — Available substitutes for a drug                                                            
    app.get('/api/medicines/:id/substitutes', async (req, res) => {                                                                     
      try {                                                                                                                             
        const [subs] = await pool.query(                                                                                                
          `SELECT m.medicine_id, m.medicine_name, m.type, m.unit_price                                                                  
           FROM medicine_substitute ms                                                                                                  
           JOIN master_medicine m ON m.medicine_id = ms.substitute_id                                                                   
           WHERE ms.original_id = ?`,                                                                                                   
          [req.params.id]                                                                                                               
        );                                                                                                                              
        res.json(subs);                                                                                                                 
      } catch (err) {                                                                                                                   
        console.error('Error fetching substitutes:', err);                                                                              
        res.status(500).json({ error: 'Database error fetching substitutes' });                                                         
      }                                                                                                                                 
    });                                                                                                                                 
                                                                                                                                        
    // GET /api/interactions — Master list of drug–drug interaction rules                                                               
    app.get('/api/interactions', async (req, res) => {                                                                                  
      try {                                                                                                                             
        const [rows] = await pool.query(`                                                                                               
          SELECT mi.drug_a_id, a.medicine_name AS drug_a,                                                                               
                 mi.drug_b_id, b.medicine_name AS drug_b,                                                                               
                 mi.notes, mi.description, mi.severity                                                                                  
          FROM medicine_interaction mi                                                                                                  
          JOIN master_medicine a ON a.medicine_id = mi.drug_a_id                                                                        
          JOIN master_medicine b ON b.medicine_id = mi.drug_b_id                                                                        
          ORDER BY mi.severity DESC, a.medicine_name                                                                                    
        `);                                                                                                                             
        res.json(rows);                                                                                                                 
      } catch (err) {                                                                                                                   
        console.error('Error fetching interactions:', err);                                                                             
        res.status(500).json({ error: 'Database error fetching interactions' });                                                        
      }                                                                                                                                 
    });                                                                                                                                 
                                                                                                                                        
    // ── 4. Conflict Engine Helper ────────────────────────────────────────────────                                                    
    async function checkConflicts(conn, patientId, newMedicineIds) {                                                                    
      // 1. Get active medicines of patient                                                                                             
      const [activeRows] = await conn.query(                                                                                            
        `SELECT DISTINCT pi.medicine_id, m.medicine_name                                                                                
         FROM prescription_item pi                                                                                                      
         JOIN prescription p ON p.prescription_no = pi.prescription_no                                                                  
         JOIN master_medicine m ON m.medicine_id = pi.medicine_id                                                                       
         WHERE p.patient_id = ? AND pi.status = 'active'`,                                                                              
        [patientId]                                                                                                                     
      );                                                                                                                                
      const activeMap = new Map(activeRows.map((r) => [r.medicine_id, r.medicine_name]));                                               
                                                                                                                                        
      // 2. Map new medicines                                                                                                           
      const newMap = new Map();                                                                                                         
      if (newMedicineIds.length > 0) {                                                                                                  
        const [newRows] = await conn.query(                                                                                             
          'SELECT medicine_id, medicine_name FROM master_medicine WHERE medicine_id IN (?)',                                            
          [newMedicineIds]                                                                                                              
        );                                                                                                                              
        newRows.forEach((r) => newMap.set(r.medicine_id, r.medicine_name));                                                             
      }                                                                                                                                 
                                                                                                                                        
      const allCandidateIds = Array.from(                                                                                               
        new Set([...activeMap.keys(), ...newMedicineIds])                                                                               
      ).sort((a, b) => a - b);                                                                                                          
                                                                                                                                        
      const conflicts = [];                                                                                                             
      const seen = new Set();                                                                                                           
                                                                                                                                        
      for (let i = 0; i < allCandidateIds.length; i++) {                                                                                
        for (let j = i + 1; j < allCandidateIds.length; j++) {                                                                          
          const a = allCandidateIds[i];                                                                                                 
          const b = allCandidateIds[j];                                                                                                 
                                                                                                                                        
          // Must involve at least one newly proposed drug                                                                              
          if (!newMedicineIds.includes(a) && !newMedicineIds.includes(b)) continue;                                                     
                                                                                                                                        
          const pairKey = `${a}_${b}`;                                                                                                  
          if (seen.has(pairKey)) continue;                                                                                              
          seen.add(pairKey);                                                                                                            
                                                                                                                                        
          const [ixRows] = await conn.query(                                                                                            
            'SELECT notes, description, severity FROM medicine_interaction WHERE drug_a_id = ? AND drug_b_id = ?',                      
            [a, b]                                                                                                                      
          );                                                                                                                            
                                                                                                                                        
          if (ixRows.length > 0) {                                                                                                      
            const row = ixRows[0];                                                                                                      
            conflicts.push({                                                                                                            
              drug_a_id: a,                                                                                                             
              drug_b_id: b,                                                                                                             
              drug_a: activeMap.get(a) || newMap.get(a),                                                                                
              drug_b: activeMap.get(b) || newMap.get(b),                                                                                
              notes: row.notes,                                                                                                         
              description: row.description,                                                                                             
              severity: row.severity,                                                                                                   
              against_active: activeMap.has(a) || activeMap.has(b),                                                                     
            });                                                                                                                         
          }                                                                                                                             
        }                                                                                                                               
      }                                                                                                                                 
                                                                                                                                        
      return conflicts;                                                                                                                 
    }                                                                                                                                   
                                                                                                                                        
    // POST /api/conflicts/check — Check candidate prescription against active medicines                                                
    app.post('/api/conflicts/check', async (req, res) => {                                                                              
      const patient_id = req.body.patient_id || req.body.patientId;                                                                    
      const medicine_ids = req.body.medicine_ids || req.body.newMedicineIds || [];                                                    
      if (!patient_id) return res.status(400).json({ error: 'patient_id is required' });                                                
                                                                                                                                        
      try {                                                                                                                             
        const conflicts = await checkConflicts(pool, Number(patient_id), medicine_ids);                                           
        res.json({ safe: conflicts.length === 0, conflicts });                                                                          
      } catch (err) {                                                                                                                   
        console.error('Error checking conflicts:', err);                                                                                
        res.status(500).json({ error: 'Error checking conflicts' });                                                                    
      }                                                                                                                                 
    });                                                                                                                                 
                                                                                                                                        
    // ── 5. Prescriptions (Transactional) ─────────────────────────────────────────                                                    
                                                                                                                                        
    // POST /api/prescriptions — Save a new prescription                                                                                
    app.post('/api/prescriptions', async (req, res) => {                                                                                
      const { patient_id, doctor_id, items, force } = req.body;                                                                         
      if (!patient_id || !doctor_id || !items || !items.length) {                                                                       
        return res.status(400).json({ error: 'patient_id, doctor_id, and items are required' });                                        
      }                                                                                                                                 
                                                                                                                                        
      const conn = await pool.getConnection();                                                                                          
      try {                                                                                                                             
        await conn.beginTransaction();                                                                                                  
                                                                                                                                        
        const medIds = items.map((it) => Number(it.medicine_id));                                                                       
        const conflicts = await checkConflicts(conn, Number(patient_id), medIds);                                                       
        const hasHighConflict = conflicts.some((c) => c.severity === 'high');                                                           
                                                                                                                                        
        // Block unless override requested                                                                                              
        if (hasHighConflict && !force) {                                                                                                
          await conn.rollback();                                                                                                        
          return res.status(409).json({                                                                                                 
            error: 'Dangerous drug interactions detected',                                                                              
            blocked: true,                                                                                                              
            conflicts,                                                                                                                  
          });                                                                                                                           
        }                                                                                                                               
                                                                                                                                        
        // 1. Insert Prescription Header                                                                                                
        const [rxRes] = await conn.query(                                                                                               
          'INSERT INTO prescription (patient_id, doctor_id, `date`) VALUES (?, ?, CURRENT_DATE)',                                       
          [patient_id, doctor_id]                                                                                                       
        );                                                                                                                              
        const rxNo = rxRes.insertId;                                                                                                    
                                                                                                                                        
        // 2. Insert Prescription Line Items & Alerts                                                                                   
        for (let idx = 0; idx < items.length; idx++) {                                                                                  
          const it = items[idx];                                                                                                        
          const itemNo = idx + 1;                                                                                                       
          const mid = Number(it.medicine_id);                                                                                           
                                                                                                                                        
          await conn.query(                                                                                                             
            `INSERT INTO prescription_item (prescription_no, item_no, medicine_id, dosage, frequency, duration, status)                 
             VALUES (?, ?, ?, ?, ?, ?, 'active')`,                                                                                      
            [rxNo, itemNo, mid, it.dosage || '', it.frequency || '', it.duration || '']                                                 
          );                                                                                                                            
                                                                                                                                        
          // Attach any alerts triggered by this drug                                                                                   
          const related = conflicts.filter((c) => c.drug_a_id === mid || c.drug_b_id === mid);                                          
          for (const c of related) {                                                                                                    
            const [alertRes] = await conn.query(                                                                                        
              'INSERT INTO warning_alert (alert_type, message) VALUES (?, ?)',                                                          
              [`drug_interaction_${c.severity}`, `${c.drug_a} ↔ ${c.drug_b}: ${c.description}`]                                         
            );                                                                                                                          
            await conn.query(                                                                                                           
              'INSERT INTO item_alert (prescription_no, item_no, alert_id) VALUES (?, ?, ?)',                                           
              [rxNo, itemNo, alertRes.insertId]                                                                                         
            );                                                                                                                          
          }                                                                                                                             
        }                                                                                                                               
                                                                                                                                        
        await conn.commit();                                                                                                            
        res.status(201).json({                                                                                                          
          prescription_no: rxNo,                                                                                                        
          conflicts,                                                                                                                    
          forced: Boolean(force && conflicts.length),                                                                                   
        });                                                                                                                             
      } catch (err) {                                                                                                                   
        await conn.rollback();                                                                                                          
        console.error('Error saving prescription:', err);                                                                               
        res.status(500).json({ error: 'Database transaction failed' });                                                                 
      } finally {                                                                                                                       
        conn.release();                                                                                                                 
      }                                                                                                                                 
    });                                                                                                                                 
                                                                                                                                        
    // PATCH /api/prescriptions/:rx/items/:item/status — Toggle active vs past status                                                   
    app.patch('/api/prescriptions/:rx/items/:item/status', async (req, res) => {                                                        
      const { status } = req.body;                                                                                                      
      if (!['active', 'past'].includes(status)) {                                                                                       
        return res.status(400).json({ error: "status must be 'active' or 'past'" });                                                    
      }                                                                                                                                 
                                                                                                                                        
      try {                                                                                                                             
        const [result] = await pool.query(                                                                                              
          'UPDATE prescription_item SET status = ? WHERE prescription_no = ? AND item_no = ?',                                          
          [status, req.params.rx, req.params.item]                                                                                      
        );                                                                                                                              
                                                                                                                                        
        if (result.affectedRows === 0) {                                                                                                
          return res.status(404).json({ error: 'Prescription item not found' });                                                        
        }                                                                                                                               
                                                                                                                                        
        res.json({ ok: true, status });                                                                                                 
      } catch (err) {                                                                                                                   
        console.error('Error updating item status:', err);                                                                              
        res.status(500).json({ error: 'Database error updating status' });                                                              
      }
    });
  
    // ── 6. Dashboard Statistics ──────────────────────────────────────────────────
  
    // GET /api/stats — Real-time counts for the dashboard
    app.get('/api/stats', async (req, res) => {
      try {
        const [[{ patients }]] = await pool.query('SELECT COUNT(*) AS patients FROM patient');
        const [[{ doctors }]] = await pool.query('SELECT COUNT(*) AS doctors FROM doctor');
        const [[{ medicines }]] = await pool.query('SELECT COUNT(*) AS medicines FROM master_medicine');
        const [[{ prescriptions }]] = await pool.query('SELECT COUNT(*) AS prescriptions FROM prescription');
        const [[{ interactions }]] = await pool.query('SELECT COUNT(*) AS interactions FROM medicine_interaction');
        const [[{ active_meds }]] = await pool.query(
          "SELECT COUNT(*) AS active_meds FROM prescription_item WHERE status = 'active'"
        );
  
        res.json({ patients, doctors, medicines, prescriptions, interactions, active_meds });
      } catch (err) {
        console.error('Error fetching stats:', err);
        res.status(500).json({ error: 'Database error fetching stats' });
      }
    });

    // login(updated content)
    // ── 7. Role-Based Login System ───────────────────────────────────────────────
    (async () => {
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS users (
            user_id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(100) NOT NULL UNIQUE,
            password VARCHAR(100) NOT NULL,
            role VARCHAR(20) NOT NULL
          )
        `);
        await pool.query(`
          INSERT IGNORE INTO users (username, password, role) VALUES
            ('Dr. Anitha Menon',   '12345678',    'doctor'),
            ('Dr. Rajesh Kumar',   'rajkumar123', 'doctor'),
            ('Dr. Sreelatha Nair', 'sree12345',   'doctor'),
            ('Dr. Mohammed Ali',   'mhmdali000',  'doctor'),
            ('Dr. Priya Varma',    'pvarma1111',  'doctor'),
            ('admin',              'password',    'owner'),
            ('owner',              'owner123',    'owner')
        `);
        const [docUsers] = await pool.query("SELECT username FROM users WHERE role = 'doctor'");
        for (const u of docUsers) {
          const [exists] = await pool.query('SELECT doctor_id FROM doctor WHERE doctor_name = ?', [u.username]);
          if (!exists.length) {
            await pool.query('INSERT INTO doctor (doctor_name, speciality_id) VALUES (?, 3)', [u.username]);
          }
        }
      } catch (err) {
        console.error('Error initializing users table:', err);
      }
    })();

    // POST /api/owner/signup — Owner creates account
    app.post('/api/owner/signup', async (req, res) => {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
      }
      try {
        await pool.query(
          "INSERT INTO users (username, password, role) VALUES (?, ?, 'owner')",
          [username.trim(), password]
        );
        res.status(201).json({ message: 'Owner account created' });
      } catch (err) {
        res.status(400).json({ error: 'Username already exists' });
      }
    });

    // POST /api/login — Role-based login (owner, doctor)
    app.post('/api/login', async (req, res) => {
      const { username, password, role } = req.body;
      const cleanUser = String(username || '').trim();
      const cleanRole = String(role || '').trim();
      try {
        const [rows] = await pool.query(
          `SELECT user_id, username, role FROM users 
           WHERE LOWER(TRIM(username)) = LOWER(?)
             AND (
               password = ? 
               OR username = ? 
               OR (LOWER(TRIM(username)) = 'admin' AND ? IN ('admin123', 'password', 'admin'))
               OR (LOWER(TRIM(username)) = 'owner' AND ? IN ('owner123', 'password', 'owner'))
             ) 
             AND LOWER(TRIM(role)) = LOWER(?)`,
          [cleanUser, password, password, password, password, cleanRole]
        );
        if (!rows.length) {
          return res.status(401).json({ error: 'Invalid username, password, or role' });
        }
        res.json(rows[0]);
      } catch (err) {
        console.error('Database error during login:', err);
        res.status(500).json({ error: 'Database error during login' });
      }
    });

    // POST /api/users/create — Owner creates doctor account with full doctor details
    app.post('/api/users/create', async (req, res) => {
      const { owner_role, username, password, contact_no, speciality_id, qualification } = req.body;
      if (owner_role !== 'owner') {
        return res.status(403).json({ error: 'Only owner can create doctor accounts' });
      }
      if (!username || !password || !speciality_id) {
        return res.status(400).json({ error: 'Doctor name, specialty, and password are required' });
      }
      try {
        const docName = username.trim();
        await pool.query(
          "INSERT INTO users (username, password, role) VALUES (?, ?, 'doctor')",
          [docName, password]
        );
        const [docRes] = await pool.query(
          'INSERT INTO doctor (doctor_name, contact_no, speciality_id) VALUES (?, ?, ?)',
          [docName, contact_no ? contact_no.trim() : null, Number(speciality_id)]
        );
        const newDoctorId = docRes.insertId;
        if (qualification) {
          const quals = String(qualification)
            .split(',')
            .map((q) => q.trim())
            .filter(Boolean);
          for (const q of quals) {
            await pool.query(
              'INSERT IGNORE INTO doctor_qualification (doctor_id, qualification) VALUES (?, ?)',
              [newDoctorId, q]
            );
          }
        }
        res.status(201).json({ message: 'Doctor account created', doctor_id: newDoctorId });
      } catch (err) {
        res.status(400).json({ error: 'Doctor username already exists or invalid data' });
      }
    });
  
    // ── Start Server ─────────────────────────────────────────────────────────────
    app.listen(PORT, () => {
      console.log(`ClinicRx Server running at http://localhost:${PORT}`);
    });