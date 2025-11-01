# Nova Chatbot (FastAPI + Groq)

Chatbot nivel intermedio para correr en local consumiendo Groq API (free tier).  
Cliente web incluido (HTML+JS). Memoria en proceso (solo demo).

## Requisitos
- Python 3.11+
- Cuenta en Groq (obtener `GROQ_API_KEY`)
- Internet

## Estructura
```
nova-chatbot/
  app/
    __init__.py
    main.py
    config.py
    schemas.py
    memory.py
    providers/
      __init__.py
      groq_provider.py
  static/
    index.html
    styles.css
    app.js
  tests/
    test_chat.py
  .env.example
  requirements.txt
  README.md
  run.sh
  .gitignore
```

## Configuración
1) Clona el repo y entra al directorio:
```bash
git clone <este-proyecto> nova-chatbot
cd nova-chatbot
```

2) Copia `.env.example` a `.env` y coloca tu API key de Groq:
```bash
cp .env.example .env
# Edita .env y reemplaza GROQ_API_KEY=tu_api_key_aqui
```

3) (Opcional) Ajusta el modelo en `.env` (`MODEL=llama-3.1-70b-versatile`).

## Ejecución
- Linux/macOS/Git Bash:
```bash
bash run.sh
```

- Manual (Windows PowerShell o cualquier SO):
```bash
python -m venv .venv
# PowerShell
. .venv/Scripts/Activate.ps1
# o Bash
source .venv/bin/activate || source .venv/Scripts/activate

pip install -U pip
pip install -r requirements.txt

uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Abre el navegador en: http://127.0.0.1:8000/

## Endpoints
- `GET /healthz` → estado y modelo
- `POST /api/chat` → cuerpo `{ messages: [{role, content}], temperature?, max_tokens? }`
- `POST /api/reset` → limpia historial por `x-session-id`

## Notas
- Si falta `GROQ_API_KEY`, `/api/chat` responderá con 500 y un mensaje claro.
- La memoria es en proceso (no persistente) y separada por el header `x-session-id`.
- Cliente web simple servido desde `/` (FastAPI StaticFiles).

## Pruebas
```bash
pytest -q
```
Las pruebas aceptan fallo controlado de `/api/chat` si no hay `GROQ_API_KEY`.

## Licencia
Uso educativo/demostración.
