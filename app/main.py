from fastapi import FastAPI, HTTPException, Request, Header
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from .config import settings
from .schemas import (
    ChatRequest, ChatResponse, Message,
    SubscribeRequest, ContactRequest,
    SignupRequest, LoginRequest,
    CommentRequest, Comment,
)
from .providers.groq_provider import GroqProvider
from . import memory
from .models import create_db_and_tables, get_session, User, RefreshToken, Comment as CommentModel, Subscriber, Contact as ContactModel
import secrets
from datetime import datetime, timezone, timedelta
import jwt
from sqlmodel import select
from sqlalchemy import func

app = FastAPI(title=settings.app_name)

# Servir archivos estáticos bajo /static y página principal en /
app.mount("/static", StaticFiles(directory="static"), name="static")

# CORS (útil si cambias a front aparte)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

# Instancia del proveedor (lazy init dentro)
provider = GroqProvider(api_key=settings.groq_api_key, model=settings.model)

SYSTEM_PROMPT = (
    "Te llamas Nova. Actúas como un coach de fitness y nutrición. Responde en español claro y empático, "
    "priorizando la seguridad. Antes de proponer un plan, pregunta por objetivos, nivel, tiempo disponible, "
    "lesiones/condiciones, equipamiento y preferencias. Ofrece rutinas estructuradas (calentamiento, bloques, enfriamiento) "
    "con series/reps/tiempos, progresiones semanales y alternativas sin equipo. Incluye pautas básicas de nutrición e hidratación. "
    "Cuando te presentes, usa la fórmula: '¡Hola! Me alegra conocerte. Soy Nova'. No digas 'Soy Eres Nova'. "
    "No des consejos médicos; si aparecen síntomas o lesiones, sugiere consultar a un profesional."
)


@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, request: Request):
    session_id = request.headers.get("x-session-id", "default")
    if not settings.groq_api_key:
        raise HTTPException(status_code=500, detail="Falta GROQ_API_KEY. Configura tu .env")

    # Semilla de sistema al inicio de la conversación
    history = memory.get_history(session_id)
    if not history or history[0].role != "system":
        memory.add_to_history(session_id, Message(role="system", content=SYSTEM_PROMPT))

    # Añadir mensajes del request a memoria
    for m in req.messages:
        memory.add_to_history(session_id, m)

    try:
        reply = provider.chat(
            memory.get_history(session_id),
            temperature=req.temperature,
            max_tokens=req.max_tokens,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error del proveedor: {e}")

    # Guardar respuesta en memoria
    memory.add_to_history(session_id, Message(role="assistant", content=reply))
    return ChatResponse(reply=reply, model=provider.model)


@app.post("/api/reset")
async def reset(request: Request):
    session_id = request.headers.get("x-session-id", "default")
    memory.reset_history(session_id)
    return {"ok": True}


@app.get("/healthz")
async def healthz():
    return {"status": "ok", "model": settings.model}


@app.get("/")
async def index():
    return FileResponse("static/index.html")


@app.get("/favicon.ico")
async def favicon():
    # Devuelve 204 para evitar 404 en logs si no hay favicon
    return Response(status_code=204)


@app.on_event("startup")
def _startup():
    create_db_and_tables()


@app.post("/api/subscribe")
async def subscribe(payload: SubscribeRequest):
    email = payload.email.lower()
    now = datetime.now(timezone.utc).isoformat()
    with get_session() as session:
        existing = session.get(Subscriber, email)
        if not existing:
            session.add(Subscriber(email=email, created_at=now))
            session.commit()
    return {"ok": True}


@app.post("/api/contact")
async def contact(payload: ContactRequest):
    now = datetime.now(timezone.utc).isoformat()
    with get_session() as session:
        session.add(ContactModel(name=payload.name, email=payload.email, message=payload.message, created_at=now))
        session.commit()
    return {"ok": True}


def _jwt_for(email: str, name: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": email,
        "name": name,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=settings.jwt_expires_min)).timestamp()),
        "iss": settings.app_name,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def _issue_refresh(email: str) -> str:
    token = secrets.token_urlsafe(48)
    now = datetime.now(timezone.utc)
    exp = now + timedelta(days=settings.refresh_expires_days)
    with get_session() as session:
        session.add(RefreshToken(token=token, email=email, created_at=now.isoformat(), expires_at=exp.isoformat()))
        session.commit()
    return token


@app.post("/api/auth/signup")
async def auth_signup(body: SignupRequest):
    import bcrypt
    email = body.email.lower()
    with get_session() as session:
        if session.exec(select(User).where(User.email == email)).first():
            raise HTTPException(status_code=400, detail="El usuario ya existe")
        pw_hash = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode()
        now = datetime.now(timezone.utc).isoformat()
        user = User(name=body.name.strip(), email=email, password_hash=pw_hash, created_at=now)
        session.add(user)
        session.commit()
    access = _jwt_for(email, body.name.strip())
    refresh = _issue_refresh(email)
    return {"access_token": access, "refresh_token": refresh, "name": body.name.strip(), "email": email}


@app.post("/api/auth/login")
async def auth_login(body: LoginRequest):
    import bcrypt
    email = body.email.lower()
    with get_session() as session:
        user = session.exec(select(User).where(User.email == email)).first()
        if not user or not bcrypt.checkpw(body.password.encode(), user.password_hash.encode()):
            raise HTTPException(status_code=401, detail="Credenciales inválidas")
        name = user.name
    access = _jwt_for(email, name)
    refresh = _issue_refresh(email)
    return {"access_token": access, "refresh_token": refresh, "name": name, "email": email}


@app.get("/api/auth/me")
async def auth_me(authorization: str | None = Header(default=None)):
    email, name = _email_name_from_jwt(authorization)
    if not email:
        raise HTTPException(status_code=401, detail="No autenticado")
    return {"name": name, "email": email}


def _email_name_from_jwt(authorization: str | None) -> tuple[str | None, str | None]:
    if not authorization:
        return None, None
    parts = authorization.split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        token = parts[1]
        try:
            payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"], options={"require": ["exp", "iat", "sub"]})
            return payload.get("sub"), payload.get("name")
        except Exception:
            return None, None
    return None, None


@app.post("/api/auth/refresh")
async def auth_refresh(refresh_token: str):
    with get_session() as session:
        rt = session.get(RefreshToken, refresh_token)
        if not rt:
            raise HTTPException(status_code=401, detail="Refresh inválido")
        if datetime.fromisoformat(rt.expires_at) < datetime.now(timezone.utc):
            raise HTTPException(status_code=401, detail="Refresh expirado")
        user = session.exec(select(User).where(User.email == rt.email)).first()
        access = _jwt_for(rt.email, user.name if user else rt.email)
        return {"access_token": access}


@app.post("/api/auth/logout")
async def auth_logout(refresh_token: str):
    with get_session() as session:
        rt = session.get(RefreshToken, refresh_token)
        if rt:
            session.delete(rt)
            session.commit()
    return {"ok": True}


@app.get("/api/comments")
async def list_comments(offset: int = 0, limit: int = 10):
    with get_session() as session:
        items = session.exec(
            select(CommentModel).order_by(CommentModel.id.desc()).offset(offset).limit(limit)
        ).all()
        total = session.exec(select(func.count()).select_from(CommentModel)).one()
        return {
            "items": [
                Comment(id=str(c.id), author=c.author_name, text=c.text, created_at=c.created_at).model_dump()
                for c in items
            ],
            "total": int(total),
        }


@app.post("/api/comments")
async def add_comment(body: CommentRequest, authorization: str | None = Header(default=None)):
    email, name = _email_name_from_jwt(authorization)
    if not email:
        raise HTTPException(status_code=401, detail="No autenticado")
    now = datetime.now(timezone.utc).isoformat()
    with get_session() as session:
        c = CommentModel(author_name=name or email, user_email=email, text=body.text.strip(), created_at=now)
        session.add(c)
        session.commit()
        session.refresh(c)
        return Comment(id=str(c.id), author=c.author_name, text=c.text, created_at=c.created_at)


# Perfil
@app.patch("/api/me")
async def update_me(payload: dict, authorization: str | None = Header(default=None)):
    email, _ = _email_name_from_jwt(authorization)
    if not email:
        raise HTTPException(status_code=401, detail="No autenticado")
    name = payload.get("name")
    if not name or len(name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Nombre inválido")
    with get_session() as session:
        user = session.exec(select(User).where(User.email == email)).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        user.name = name.strip()
        session.add(user)
        session.commit()
    return {"ok": True}


@app.post("/api/me/password-change")
async def change_password(payload: dict, authorization: str | None = Header(default=None)):
    import bcrypt as _b
    email, _ = _email_name_from_jwt(authorization)
    if not email:
        raise HTTPException(status_code=401, detail="No autenticado")
    current = payload.get("current_password")
    new = payload.get("new_password")
    if not current or not new or len(new) < 6:
        raise HTTPException(status_code=400, detail="Datos inválidos")
    from sqlalchemy import delete as sqldelete
    with get_session() as session:
        user = session.exec(select(User).where(User.email == email)).first()
        if not user or not _b.checkpw(current.encode(), user.password_hash.encode()):
            raise HTTPException(status_code=401, detail="Contraseña actual incorrecta")
        user.password_hash = _b.hashpw(new.encode(), _b.gensalt()).decode()
        session.add(user)
        session.commit()
        # invalidate refresh tokens
        session.exec(sqldelete(RefreshToken).where(RefreshToken.email == email))
        session.commit()
    return {"ok": True}
