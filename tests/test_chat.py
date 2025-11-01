import json
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/healthz")
    assert r.status_code == 200
    assert "model" in r.json()


def test_chat():
    payload = {
        "messages": [{"role": "user", "content": "Di hola en una frase."}],
        "temperature": 0.0,
        "max_tokens": 16,
    }
    r = client.post("/api/chat", headers={"x-session-id": "test"}, json=payload)
    # Si no hay GROQ_API_KEY, debe fallar controladamente
    if r.status_code != 200:
        assert r.status_code in (500, 401, 403)
    else:
        data = r.json()
        assert "reply" in data

