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

### 2026-11-22 — Fase 2: API completa + tests
**Qué se hizo**
- `app/security.py`: bcrypt, JWT HS256 de 7 días, `get_current_user` (HTTPBearer), `require_patient` / `require_therapist`.
- `app/schemas.py`: modelos de entrada/salida y `task_out` (tarea + micropasos).
- Routers `auth` (`/auth/login`, `/auth/me`), `patient` (`/me/*`) y `therapist` (`/patients/*`, `/notifications`,
  `/paralysis/{id}/seen`). `GET /emotions` en `main.py`.
- Rangos `day/week/month` en hora de Santiago; resumen de emociones y KPIs.
- `seed.py` usa `hash_password` de `security.py` y acepta un engine (lo reusan los tests).
- `tests/` (8 tests) con SQLite en memoria; `pytest.ini`; `docs/API.md`.

**Cómo probarlo** (desde `backend/`)
```powershell
pip install -r requirements.txt   # agrega tzdata
pytest                            # 8 passed
python seed.py
uvicorn app.main:app --reload     # http://localhost:8000/docs → Authorize con el token de /auth/login
```
Verificado: `pytest` 8 passed. Con uvicorn real: `/openapi.json` lista las 22 rutas de PLAN §4, login del terapeuta,
`GET /patients` y `GET /patients/2/kpis?range=month` responden con los datos del seed, `/docs` → 200.

**Pendientes**
- Fase 3: web del terapeuta (login, pacientes, campana).

## Decisiones
- `seed.py` hashea con `bcrypt` directamente. En Fase 2, `security.py` usará el mismo bcrypt, así que los hashes son compatibles.
- `seed.py` recrea la BD con `drop_all` + `create_all` en vez de borrar el archivo. Así no hay que interpretar `DB_URL`, y se evita un archivo bloqueado en Windows si uvicorn está corriendo.
- `security.py`, `schemas.py`, `routers/` y `tests/` no se crean en Fase 1 porque pertenecen a la Fase 2.
- `DB_URL` es relativa (`sqlite:///./neuroad.db`): los comandos del backend se corren desde `backend/`.
- `requirements.txt` va sin versiones fijas, porque es un prototipo.
- `role` y `feedback` se guardan como `str` simple, sin Enum. La validación de valores queda en los schemas de Fase 2.
- (Fase 2) Librería nueva `tzdata`: Windows no trae base de zonas horarias y `ZoneInfo("America/Santiago")` falla sin ella.
- (Fase 2) SQLModel 0.0.50 guarda y devuelve fechas con zona UTC; las respuestas salen con sufijo `Z`.
- (Fase 2) KPIs: todo se filtra por rango. "Última parálisis" es la última dentro del rango (`null` si no hay). 👍/👎 cuentan por `feedback_at` dentro del rango.
- (Fase 2) Tareas devuelven `steps: list[str]` (la posición es el índice), igual que el body de entrada.
- (Fase 2) `PUT` de consejo acepta `position` opcional, para subir/bajar en Fase 5 sin endpoint extra.
- (Fase 2) `HTTPBearer` en vez de OAuth2 password flow: el login es JSON y en Swagger basta pegar el token.
- (Fase 2) Deshacer una emoción con más de 2 minutos responde 409.
- (Fase 2) Recurso ajeno (paciente de otro terapeuta, dato de otro paciente) responde 404; rol equivocado responde 403.
- (Fase 2) Los consejos por defecto se copian solo en `seed.py`: no hay endpoint para crear pacientes.
- (Fase 2) `GET /patients` hace una consulta por paciente: basta para pocos pacientes.

## Pendientes
- Fases 3 a 8 según `PLAN.md`.
