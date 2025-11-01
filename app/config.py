from pydantic import BaseModel
from dotenv import load_dotenv
import os

load_dotenv()


class Settings(BaseModel):
    app_name: str = os.getenv("APP_NAME", "Nova Chatbot")
    groq_api_key: str | None = os.getenv("GROQ_API_KEY")
    model: str = os.getenv("MODEL", "llama-3.1-70b-versatile")
    host: str = os.getenv("HOST", "127.0.0.1")
    port: int = int(os.getenv("PORT", "8000"))
    jwt_secret: str = os.getenv("JWT_SECRET", "dev-secret-change-me")
    jwt_expires_min: int = int(os.getenv("JWT_EXPIRES_MIN", "30"))
    refresh_expires_days: int = int(os.getenv("REFRESH_EXPIRES_DAYS", "14"))


settings = Settings()
