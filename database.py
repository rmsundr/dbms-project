"""Database initialization and helpers for Clinic E-Prescription (MariaDB)."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import pymysql
from pymysql.cursors import DictCursor

ROOT = Path(__file__).resolve().parent
SCHEMA = ROOT / "sql" / "schema.sql"
SEED = ROOT / "sql" / "seed.sql"

DB_CONFIG = {
    "host": os.environ.get("MARIADB_HOST", "127.0.0.1"),
    "port": int(os.environ.get("MARIADB_PORT", "3306")),
    "user": os.environ.get("MARIADB_USER", "root"),
    "password": os.environ.get("MARIADB_PASSWORD", ""),
    "database": os.environ.get("MARIADB_DATABASE", "clinic"),
    "charset": "utf8mb4",
    "autocommit": False,
}


class Connection:
    """Thin wrapper so call sites can use conn.execute(...).fetchone/all like sqlite3."""

    def __init__(self, conn: pymysql.Connection):
        self._conn = conn

    def execute(self, sql: str, params: tuple | list | None = None):
        cur = self._conn.cursor()
        cur.execute(sql, params or ())
        return cur

    def commit(self) -> None:
        self._conn.commit()

    def rollback(self) -> None:
        self._conn.rollback()

    def close(self) -> None:
        self._conn.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        if exc_type is not None:
            self.rollback()
        self.close()


def _connect(**overrides: Any) -> pymysql.Connection:
    cfg = {**DB_CONFIG, **overrides}
    return pymysql.connect(cursorclass=DictCursor, **cfg)


def get_connection() -> Connection:
    return Connection(_connect())


def _split_sql(script: str) -> list[str]:
    """Split a SQL script into statements, ignoring comment-only lines."""
    statements: list[str] = []
    buf: list[str] = []
    for line in script.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("--"):
            continue
        buf.append(line)
        if stripped.endswith(";"):
            stmt = "\n".join(buf).strip().rstrip(";").strip()
            if stmt:
                statements.append(stmt)
            buf = []
    if buf:
        stmt = "\n".join(buf).strip().rstrip(";").strip()
        if stmt:
            statements.append(stmt)
    return statements


def _run_script(conn: Connection, path: Path) -> None:
    for stmt in _split_sql(path.read_text(encoding="utf-8")):
        conn.execute(stmt)


def init_db(force: bool = False) -> None:
    """Create the clinic database/schema and optionally reseed."""
    server = _connect(database=None)
    try:
        with server.cursor() as cur:
            db = DB_CONFIG["database"]
            if force:
                cur.execute(f"DROP DATABASE IF EXISTS `{db}`")
            cur.execute(
                f"CREATE DATABASE IF NOT EXISTS `{db}` "
                "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
        server.commit()
    finally:
        server.close()

    conn = get_connection()
    try:
        if not force:
            tables = conn.execute("SHOW TABLES").fetchall()
            if tables:
                return

        _run_script(conn, SCHEMA)
        _run_script(conn, SEED)
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def _jsonable(value: Any) -> Any:
    from datetime import date, datetime
    from decimal import Decimal

    if isinstance(value, datetime):
        return value.date().isoformat()
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    return value


def row_to_dict(row: dict | None) -> dict | None:
    if row is None:
        return None
    return {k: _jsonable(v) for k, v in dict(row).items()}


def rows_to_dicts(rows: list[dict]) -> list[dict]:
    return [row_to_dict(r) for r in rows]  # type: ignore[misc]


def patient_age(dob: str) -> int:
    """Derive age from DOB (as in the ER diagram)."""
    from datetime import date, datetime

    if hasattr(dob, "year"):
        born = dob  # already a date/datetime from the driver
    else:
        y, m, d = map(int, str(dob).split("-")[:3])
        born = date(y, m, d)
    if isinstance(born, datetime):
        born = born.date()
    today = date.today()
    return today.year - born.year - ((today.month, today.day) < (born.month, born.day))
