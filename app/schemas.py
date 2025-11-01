from pydantic import BaseModel, Field, EmailStr
from typing import List, Literal, Optional

Role = Literal["system", "user", "assistant"]


class Message(BaseModel):
    role: Role
    content: str = Field(min_length=1)


class ChatRequest(BaseModel):
    messages: List[Message]
    temperature: float = 0.2
    max_tokens: int = 512


class ChatResponse(BaseModel):
    reply: str
    model: str


class SubscribeRequest(BaseModel):
    email: EmailStr
    name: Optional[str] = None


class ContactRequest(BaseModel):
    name: str = Field(min_length=2)
    email: EmailStr
    message: str = Field(min_length=10, max_length=2000)


class SignupRequest(BaseModel):
    name: str = Field(min_length=2)
    email: EmailStr
    password: str = Field(min_length=6)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class CommentRequest(BaseModel):
    text: str = Field(min_length=2, max_length=1000)


class Comment(BaseModel):
    id: str
    author: str
    text: str
    created_at: str
