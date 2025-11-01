#!/usr/bin/env python
import argparse
import os
from getpass import getpass
from app.models import create_db_and_tables, get_session, User
from sqlmodel import select
import subprocess
import sys
import bcrypt


def cmd_initdb(args):
    create_db_and_tables()
    print("DB inicializada.")


def cmd_create_admin(args):
    name = args.name or input("Nombre: ")
    email = args.email or input("Email: ")
    password = args.password or getpass("Contraseña: ")
    with get_session() as session:
        if session.exec(select(User).where(User.email == email.lower())).first():
            print("Usuario ya existe")
            return 1
        pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        u = User(name=name.strip(), email=email.lower(), password_hash=pw_hash, created_at="manual")
        session.add(u)
        session.commit()
        print("Usuario creado:", email)


def cmd_list_users(args):
    with get_session() as session:
        users = session.exec(select(User)).all()
        for u in users:
            print(f"- {u.id} {u.email} {u.name}")


def cmd_alembic(args):
    command = [sys.executable, "-m", "alembic", args.action]
    if args.rev:
        command.append(args.rev)
    env = os.environ.copy()
    # Ensure path
    subprocess.check_call(command, env=env, cwd=os.path.dirname(__file__) or ".")


def main():
    parser = argparse.ArgumentParser(description="Gestor Nova Chatbot")
    sub = parser.add_subparsers(dest="cmd")

    p1 = sub.add_parser("initdb", help="Crear tablas (SQLModel)")
    p1.set_defaults(func=cmd_initdb)

    p2 = sub.add_parser("create-admin", help="Crear usuario admin")
    p2.add_argument("--name", default=None)
    p2.add_argument("--email", default=None)
    p2.add_argument("--password", default=None)
    p2.set_defaults(func=cmd_create_admin)

    p3 = sub.add_parser("list-users", help="Listar usuarios")
    p3.set_defaults(func=cmd_list_users)

    p4 = sub.add_parser("alembic", help="Comandos Alembic (upgrade/downgrade)")
    p4.add_argument("action", choices=["upgrade", "downgrade", "current", "history"])
    p4.add_argument("rev", nargs="?", default="head")
    p4.set_defaults(func=cmd_alembic)

    args = parser.parse_args()
    if not hasattr(args, "func"):
        parser.print_help()
        return 1
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())

