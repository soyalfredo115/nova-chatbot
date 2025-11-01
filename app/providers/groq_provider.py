from typing import List, Optional
from groq import Groq
from ..config import settings
from ..schemas import Message

# Adaptador simple para Groq Chat Completions
# Docs: https://pypi.org/project/groq/
# Requiere GROQ_API_KEY en .env


class GroqProvider:
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        # Lazy init: no fallar en import si falta la key
        self.api_key = api_key or settings.groq_api_key
        self.model = model or settings.model
        self.client: Optional[Groq] = None

    def _ensure_client(self):
        if not self.api_key:
            raise RuntimeError("Falta GROQ_API_KEY en variables de entorno.")
        if self.client is None:
            self.client = Groq(api_key=self.api_key)

    def chat(
        self,
        messages: List[Message],
        temperature: float = 0.2,
        max_tokens: int = 512,
    ) -> str:
        self._ensure_client()
        payload = [{"role": m.role, "content": m.content} for m in messages]
        resp = self.client.chat.completions.create(
            model=self.model,
            messages=payload,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return resp.choices[0].message.content.strip()

