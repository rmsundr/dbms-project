"""Database initialization and helpers for Clinic E-Prescription."""

from __future__ import annotations

import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / "clinic.db"
SCHEMA = ROOT / "sql" / "schema.sql"
SEED = ROOT / "sql" / "seed.sql"


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db(force: bool = False) -> None:
    if force and DB_PATH.exists():
        DB_PATH.unlink()

    if DB_PATH.exists() and not force:
        return

    conn = get_connection()
    try:
        conn.executescript(SCHEMA.read_text(encoding="utf-8"))
        conn.executescript(SEED.read_text(encoding="utf-8"))
        conn.commit()
    finally:
        conn.close()


def rows_to_dicts(rows: list[sqlite3.Row]) -> list[dict]:
    return [dict(r) for r in rows]


def patient_age(dob: str) -> int:
    """Derive age from DOB (as in the ER diagram)."""
    from datetime import date

    y, m, d = map(int, dob.split("-"))
    born = date(y, m, d)
    today = date.today()
    return today.year - born.year - ((today.month, today.day) < (born.month, born.day))
