"""
Clinic E-Prescription Workflow System
Specialty-Based Relational Database Architecture
"""

from __future__ import annotations

from flask import Flask, jsonify, render_template, request

from database import get_connection, init_db, patient_age, rows_to_dicts

app = Flask(__name__)


# ── Pages ────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")


# ── Doctors / Specialties ────────────────────────────────────────────────────

@app.get("/api/doctors")
def list_doctors():
    conn = get_connection()
    doctors = rows_to_dicts(
        conn.execute(
            """
            SELECT d.doctor_id, d.doctor_name, d.contact_no,
                   s.speciality_id, s.speciality_name
            FROM doctor d
            JOIN speciality s ON s.speciality_id = d.speciality_id
            ORDER BY d.doctor_name
            """
        ).fetchall()
    )
    for doc in doctors:
        quals = conn.execute(
            "SELECT qualification FROM doctor_qualification WHERE doctor_id = ?",
            (doc["doctor_id"],),
        ).fetchall()
        doc["qualifications"] = [q["qualification"] for q in quals]
    conn.close()
    return jsonify(doctors)


@app.get("/api/specialties")
def list_specialties():
    conn = get_connection()
    rows = rows_to_dicts(
        conn.execute(
            "SELECT speciality_id, speciality_name FROM speciality ORDER BY speciality_name"
        ).fetchall()
    )
    conn.close()
    return jsonify(rows)


# ── Patients ─────────────────────────────────────────────────────────────────

@app.get("/api/patients")
def list_patients():
    conn = get_connection()
    rows = rows_to_dicts(
        conn.execute(
            """
            SELECT patient_id, patient_name, dob, contact_no, gender
            FROM patient ORDER BY patient_name
            """
        ).fetchall()
    )
    conn.close()
    for p in rows:
        p["age"] = patient_age(p["dob"])
    return jsonify(rows)


@app.post("/api/patients")
def create_patient():
    data = request.get_json(force=True)
    required = ("patient_name", "dob", "gender")
    if not all(data.get(k) for k in required):
        return jsonify({"error": "patient_name, dob, and gender are required"}), 400
    if data["gender"] not in ("M", "F", "O"):
        return jsonify({"error": "gender must be M, F, or O"}), 400

    conn = get_connection()
    cur = conn.execute(
        """
        INSERT INTO patient (patient_name, dob, contact_no, gender)
        VALUES (?, ?, ?, ?)
        """,
        (
            data["patient_name"].strip(),
            data["dob"],
            data.get("contact_no") or None,
            data["gender"],
        ),
    )
    conn.commit()
    pid = cur.lastrowid
    row = dict(
        conn.execute(
            "SELECT patient_id, patient_name, dob, contact_no, gender FROM patient WHERE patient_id = ?",
            (pid,),
        ).fetchone()
    )
    conn.close()
    row["age"] = patient_age(row["dob"])
    return jsonify(row), 201


@app.get("/api/patients/<int:patient_id>")
def get_patient(patient_id: int):
    conn = get_connection()
    row = conn.execute(
        "SELECT patient_id, patient_name, dob, contact_no, gender FROM patient WHERE patient_id = ?",
        (patient_id,),
    ).fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Patient not found"}), 404

    patient = dict(row)
    patient["age"] = patient_age(patient["dob"])

    history = rows_to_dicts(
        conn.execute(
            """
            SELECT p.prescription_no, p.date,
                   d.doctor_id, d.doctor_name,
                   s.speciality_name
            FROM prescription p
            JOIN doctor d ON d.doctor_id = p.doctor_id
            JOIN speciality s ON s.speciality_id = d.speciality_id
            WHERE p.patient_id = ?
            ORDER BY p.date DESC, p.prescription_no DESC
            """,
            (patient_id,),
        ).fetchall()
    )

    for rx in history:
        items = rows_to_dicts(
            conn.execute(
                """
                SELECT pi.item_no, pi.dosage, pi.frequency, pi.duration, pi.status,
                       m.medicine_id, m.medicine_name, m.type
                FROM prescription_item pi
                JOIN master_medicine m ON m.medicine_id = pi.medicine_id
                WHERE pi.prescription_no = ?
                ORDER BY pi.item_no
                """,
                (rx["prescription_no"],),
            ).fetchall()
        )
        for item in items:
            alerts = rows_to_dicts(
                conn.execute(
                    """
                    SELECT wa.alert_id, wa.alert_type, wa.message
                    FROM item_alert ia
                    JOIN warning_alert wa ON wa.alert_id = ia.alert_id
                    WHERE ia.prescription_no = ? AND ia.item_no = ?
                    """,
                    (rx["prescription_no"], item["item_no"]),
                ).fetchall()
            )
            item["alerts"] = alerts
        rx["items"] = items

    active = rows_to_dicts(
        conn.execute(
            """
            SELECT DISTINCT m.medicine_id, m.medicine_name, m.type,
                   pi.dosage, pi.frequency, pi.duration,
                   p.date AS prescribed_on, d.doctor_name, s.speciality_name
            FROM prescription_item pi
            JOIN prescription p ON p.prescription_no = pi.prescription_no
            JOIN master_medicine m ON m.medicine_id = pi.medicine_id
            JOIN doctor d ON d.doctor_id = p.doctor_id
            JOIN speciality s ON s.speciality_id = d.speciality_id
            WHERE p.patient_id = ? AND pi.status = 'active'
            ORDER BY m.medicine_name
            """,
            (patient_id,),
        ).fetchall()
    )
    conn.close()

    return jsonify(
        {
            "patient": patient,
            "active_medications": active,
            "prescriptions": history,
        }
    )


# ── Medicines ────────────────────────────────────────────────────────────────

@app.get("/api/medicines")
def list_medicines():
    """All master medicines, or specialty-filtered when ?doctor_id= is given."""
    doctor_id = request.args.get("doctor_id", type=int)
    conn = get_connection()

    if doctor_id:
        rows = rows_to_dicts(
            conn.execute(
                """
                SELECT m.medicine_id, m.medicine_name, m.type,
                       m.manufacturer, m.unit_price
                FROM master_medicine m
                JOIN specialty_medicine sm ON sm.medicine_id = m.medicine_id
                JOIN doctor d ON d.speciality_id = sm.speciality_id
                WHERE d.doctor_id = ?
                ORDER BY m.medicine_name
                """,
                (doctor_id,),
            ).fetchall()
        )
    else:
        rows = rows_to_dicts(
            conn.execute(
                """
                SELECT medicine_id, medicine_name, type, manufacturer, unit_price
                FROM master_medicine ORDER BY medicine_name
                """
            ).fetchall()
        )
    conn.close()
    return jsonify(rows)


@app.get("/api/medicines/<int:medicine_id>/substitutes")
def medicine_substitutes(medicine_id: int):
    conn = get_connection()
    rows = rows_to_dicts(
        conn.execute(
            """
            SELECT m.medicine_id, m.medicine_name, m.type, m.unit_price
            FROM medicine_substitute ms
            JOIN master_medicine m ON m.medicine_id = ms.substitute_id
            WHERE ms.original_id = ?
            """,
            (medicine_id,),
        ).fetchall()
    )
    conn.close()
    return jsonify(rows)


@app.get("/api/interactions")
def list_interactions():
    conn = get_connection()
    rows = rows_to_dicts(
        conn.execute(
            """
            SELECT mi.drug_a_id, a.medicine_name AS drug_a,
                   mi.drug_b_id, b.medicine_name AS drug_b,
                   mi.notes, mi.description, mi.severity
            FROM medicine_interaction mi
            JOIN master_medicine a ON a.medicine_id = mi.drug_a_id
            JOIN master_medicine b ON b.medicine_id = mi.drug_b_id
            ORDER BY mi.severity DESC, a.medicine_name
            """
        ).fetchall()
    )
    conn.close()
    return jsonify(rows)


# ── Conflict check ───────────────────────────────────────────────────────────

def _pair_key(a: int, b: int) -> tuple[int, int]:
    return (a, b) if a < b else (b, a)


def check_conflicts(conn, patient_id: int, new_medicine_ids: list[int]) -> list[dict]:
    """Compare proposed medicines against patient's active meds + each other."""
    active = conn.execute(
        """
        SELECT DISTINCT pi.medicine_id, m.medicine_name
        FROM prescription_item pi
        JOIN prescription p ON p.prescription_no = pi.prescription_no
        JOIN master_medicine m ON m.medicine_id = pi.medicine_id
        WHERE p.patient_id = ? AND pi.status = 'active'
        """,
        (patient_id,),
    ).fetchall()
    active_map = {r["medicine_id"]: r["medicine_name"] for r in active}

    new_rows = conn.execute(
        f"""
        SELECT medicine_id, medicine_name FROM master_medicine
        WHERE medicine_id IN ({",".join("?" * len(new_medicine_ids)) or "NULL"})
        """,
        new_medicine_ids,
    ).fetchall() if new_medicine_ids else []
    new_map = {r["medicine_id"]: r["medicine_name"] for r in new_rows}

    candidates = set(active_map) | set(new_medicine_ids)
    conflicts: list[dict] = []
    seen: set[tuple[int, int]] = set()

    # Check every pair among (active ∪ new)
    ids = sorted(candidates)
    for i, a in enumerate(ids):
        for b in ids[i + 1 :]:
            # Only flag if at least one drug is newly proposed
            if a not in new_medicine_ids and b not in new_medicine_ids:
                continue
            key = _pair_key(a, b)
            if key in seen:
                continue
            seen.add(key)
            row = conn.execute(
                """
                SELECT notes, description, severity
                FROM medicine_interaction
                WHERE drug_a_id = ? AND drug_b_id = ?
                """,
                key,
            ).fetchone()
            if row:
                conflicts.append(
                    {
                        "drug_a_id": key[0],
                        "drug_b_id": key[1],
                        "drug_a": active_map.get(key[0]) or new_map.get(key[0]),
                        "drug_b": active_map.get(key[1]) or new_map.get(key[1]),
                        "notes": row["notes"],
                        "description": row["description"],
                        "severity": row["severity"],
                        "against_active": key[0] in active_map or key[1] in active_map,
                    }
                )
    return conflicts


@app.post("/api/conflicts/check")
def api_check_conflicts():
    data = request.get_json(force=True)
    patient_id = data.get("patient_id")
    medicine_ids = data.get("medicine_ids") or []
    if not patient_id:
        return jsonify({"error": "patient_id is required"}), 400
    if not isinstance(medicine_ids, list):
        return jsonify({"error": "medicine_ids must be a list"}), 400

    conn = get_connection()
    patient = conn.execute(
        "SELECT patient_id FROM patient WHERE patient_id = ?", (patient_id,)
    ).fetchone()
    if not patient:
        conn.close()
        return jsonify({"error": "Patient not found"}), 404

    conflicts = check_conflicts(conn, patient_id, [int(m) for m in medicine_ids])
    conn.close()
    return jsonify({"safe": len(conflicts) == 0, "conflicts": conflicts})


# ── Prescriptions ────────────────────────────────────────────────────────────

@app.post("/api/prescriptions")
def create_prescription():
    data = request.get_json(force=True)
    patient_id = data.get("patient_id")
    doctor_id = data.get("doctor_id")
    items = data.get("items") or []
    force = bool(data.get("force", False))

    if not patient_id or not doctor_id:
        return jsonify({"error": "patient_id and doctor_id are required"}), 400
    if not items:
        return jsonify({"error": "At least one medicine item is required"}), 400

    medicine_ids = [int(it["medicine_id"]) for it in items]
    conn = get_connection()

    # Validate doctor & patient
    doctor = conn.execute(
        "SELECT doctor_id, speciality_id FROM doctor WHERE doctor_id = ?", (doctor_id,)
    ).fetchone()
    if not doctor:
        conn.close()
        return jsonify({"error": "Doctor not found"}), 404
    if not conn.execute(
        "SELECT 1 FROM patient WHERE patient_id = ?", (patient_id,)
    ).fetchone():
        conn.close()
        return jsonify({"error": "Patient not found"}), 404

    # Specialty filter enforcement
    for mid in medicine_ids:
        allowed = conn.execute(
            """
            SELECT 1 FROM specialty_medicine
            WHERE speciality_id = ? AND medicine_id = ?
            """,
            (doctor["speciality_id"], mid),
        ).fetchone()
        if not allowed:
            name = conn.execute(
                "SELECT medicine_name FROM master_medicine WHERE medicine_id = ?",
                (mid,),
            ).fetchone()
            conn.close()
            return (
                jsonify(
                    {
                        "error": (
                            f"'{name['medicine_name'] if name else mid}' is not in this "
                            "doctor's specialty formulary"
                        )
                    }
                ),
                400,
            )

    conflicts = check_conflicts(conn, patient_id, medicine_ids)
    high = [c for c in conflicts if c["severity"] == "high"]
    if high and not force:
        conn.close()
        return (
            jsonify(
                {
                    "error": "Dangerous drug interactions detected",
                    "blocked": True,
                    "conflicts": conflicts,
                }
            ),
            409,
        )

    cur = conn.execute(
        "INSERT INTO prescription (patient_id, doctor_id) VALUES (?, ?)",
        (patient_id, doctor_id),
    )
    rx_no = cur.lastrowid

    created_alerts = []
    for idx, item in enumerate(items, start=1):
        mid = int(item["medicine_id"])
        conn.execute(
            """
            INSERT INTO prescription_item
                (prescription_no, item_no, medicine_id, dosage, frequency, duration, status)
            VALUES (?, ?, ?, ?, ?, ?, 'active')
            """,
            (
                rx_no,
                idx,
                mid,
                item.get("dosage") or "",
                item.get("frequency") or "",
                item.get("duration") or "",
            ),
        )

        # Attach warning alerts for any conflicts involving this medicine
        related = [
            c
            for c in conflicts
            if mid in (c["drug_a_id"], c["drug_b_id"])
        ]
        for c in related:
            alert_type = f"drug_interaction_{c['severity']}"
            message = f"{c['drug_a']} ↔ {c['drug_b']}: {c['description']}"
            acur = conn.execute(
                "INSERT INTO warning_alert (alert_type, message) VALUES (?, ?)",
                (alert_type, message),
            )
            alert_id = acur.lastrowid
            conn.execute(
                """
                INSERT INTO item_alert (prescription_no, item_no, alert_id)
                VALUES (?, ?, ?)
                """,
                (rx_no, idx, alert_id),
            )
            created_alerts.append(
                {"item_no": idx, "alert_id": alert_id, "message": message}
            )

    conn.commit()
    conn.close()
    return (
        jsonify(
            {
                "prescription_no": rx_no,
                "conflicts": conflicts,
                "alerts": created_alerts,
                "forced": force and bool(conflicts),
            }
        ),
        201,
    )


@app.patch("/api/prescriptions/<int:rx_no>/items/<int:item_no>/status")
def update_item_status(rx_no: int, item_no: int):
    data = request.get_json(force=True)
    status = data.get("status")
    if status not in ("active", "past"):
        return jsonify({"error": "status must be 'active' or 'past'"}), 400

    conn = get_connection()
    cur = conn.execute(
        """
        UPDATE prescription_item SET status = ?
        WHERE prescription_no = ? AND item_no = ?
        """,
        (status, rx_no, item_no),
    )
    if cur.rowcount == 0:
        conn.close()
        return jsonify({"error": "Item not found"}), 404
    conn.commit()
    conn.close()
    return jsonify({"ok": True, "status": status})


# ── Dashboard stats ──────────────────────────────────────────────────────────

@app.get("/api/stats")
def stats():
    conn = get_connection()
    data = {
        "patients": conn.execute("SELECT COUNT(*) AS n FROM patient").fetchone()["n"],
        "doctors": conn.execute("SELECT COUNT(*) AS n FROM doctor").fetchone()["n"],
        "medicines": conn.execute("SELECT COUNT(*) AS n FROM master_medicine").fetchone()["n"],
        "prescriptions": conn.execute("SELECT COUNT(*) AS n FROM prescription").fetchone()["n"],
        "interactions": conn.execute(
            "SELECT COUNT(*) AS n FROM medicine_interaction"
        ).fetchone()["n"],
        "active_meds": conn.execute(
            "SELECT COUNT(*) AS n FROM prescription_item WHERE status = 'active'"
        ).fetchone()["n"],
    }
    conn.close()
    return jsonify(data)


# ── Boot ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=5000)
