from __future__ import annotations
from pathlib import Path
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Session, create_engine, select


DB_PATH = Path(__file__).resolve().parent.parent / "nova.db"
engine = create_engine(f"sqlite:///{DB_PATH}", echo=False)


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str = Field(index=True, unique=True)
    password_hash: str
    created_at: str


class RefreshToken(SQLModel, table=True):
    token: str = Field(primary_key=True)
    email: str = Field(index=True)
    created_at: str
    expires_at: str


class Comment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    author_name: str
    user_email: str = Field(index=True)
    text: str
    created_at: str


class Subscriber(SQLModel, table=True):
    email: str = Field(primary_key=True)
    created_at: str


class Contact(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str
    message: str
    created_at: str


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


def get_session() -> Session:
    return Session(engine)

