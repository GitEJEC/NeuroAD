# PROGRESS — NeuroAD

Bitácora de sesiones. Una entrada por fase: fecha, qué se hizo, cómo probarlo, pendientes.

## Sesiones

### 2026-11-22 — Fase 1: Fundaciones + esqueleto backend
**Qué se hizo**
- Estructura del repo: `backend/`, `web/` y `mobile/` (estas dos solo con un README de una línea), `docs/`.
- `.gitignore`, `CLAUDE.md`, `README.md` (instrucciones del backend) y esta bitácora.
- Backend: `requirements.txt`, `.env.example`, `app/config.py`, `app/db.py`, `app/models.py` (6 tablas),
  `app/emotions.py` (catálogo de 10 emociones), `app/main.py` (CORS + `GET /health`).
- `seed.py`: terapeuta, 2 pacientes, 5 consejos por paciente. Para paciente1: 40 emociones en 30 días,
  5 parálisis (3 con descripción, 2 sin ver) y 3 tareas, incluida "Hacer la cama" con sus 6 pasos.

**Cómo probarlo** (desde `backend/`)
```powershell
python -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python seed.py
uvicorn app.main:app --reload    # GET http://localhost:8000/health → {"status":"ok"}
```
Verificado: seed corre dos veces seguidas sin error. Conteos: 3 users, 5 paralysis_report, 3 task,
14 micro_step, 40 emotion_log, 10 tip. `/health` responde `{"status":"ok"}`. El hash bcrypt valida `demo1234`.

**Pendientes**
- Fase 2: `security.py`, `schemas.py`, routers, `GET /emotions`, tests y `docs/API.md`.

## Decisiones
- `seed.py` hashea con `bcrypt` directamente. En Fase 2, `security.py` usará el mismo bcrypt, así que los hashes son compatibles.
- `seed.py` recrea la BD con `drop_all` + `create_all` en vez de borrar el archivo. Así no hay que interpretar `DB_URL`, y se evita un archivo bloqueado en Windows si uvicorn está corriendo.
- `security.py`, `schemas.py`, `routers/` y `tests/` no se crean en Fase 1 porque pertenecen a la Fase 2.
- `DB_URL` es relativa (`sqlite:///./neuroad.db`): los comandos del backend se corren desde `backend/`.
- `requirements.txt` va sin versiones fijas, porque es un prototipo.
- `role` y `feedback` se guardan como `str` simple, sin Enum. La validación de valores queda en los schemas de Fase 2.

## Pendientes
- Fases 2 a 8 según `PLAN.md`.
