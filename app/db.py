import sqlite3
from pathlib import Path
from typing import Iterable, Any, Optional

DB_PATH = Path(__file__).resolve().parent.parent / "nova.db"

_conn: Optional[sqlite3.Connection] = None


def connect() -> sqlite3.Connection:
    global _conn
    if _conn is None:
        _conn = sqlite3.connect(DB_PATH, check_same_thread=False)
        _conn.row_factory = sqlite3.Row
    return _conn


def init_db():
    con = connect()
    cur = con.cursor()
    cur.executescript(
        """
        PRAGMA journal_mode=WAL;
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS refresh_tokens (
            token TEXT PRIMARY KEY,
            email TEXT NOT NULL,
            created_at TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            FOREIGN KEY(email) REFERENCES users(email)
        );
        CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            author_name TEXT NOT NULL,
            user_email TEXT NOT NULL,
            text TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY(user_email) REFERENCES users(email)
        );
        CREATE TABLE IF NOT EXISTS subscribers (
            email TEXT PRIMARY KEY,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        """
    )
    con.commit()


def execute(sql: str, params: Iterable[Any] = ()):  # returns lastrowid
    con = connect()
    cur = con.cursor()
    cur.execute(sql, tuple(params))
    con.commit()
    return cur.lastrowid


def query_one(sql: str, params: Iterable[Any] = ()) -> Optional[sqlite3.Row]:
    con = connect()
    cur = con.cursor()
    cur.execute(sql, tuple(params))
    return cur.fetchone()


def query_all(sql: str, params: Iterable[Any] = ()) -> list[sqlite3.Row]:
    con = connect()
    cur = con.cursor()
    cur.execute(sql, tuple(params))
    return cur.fetchall()

