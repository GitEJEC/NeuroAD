# CLAUDE.md — NeuroAD

Prototipo de seguimiento y apoyo para pacientes con TDAH y sus terapeutas.
Plan maestro: `PLAN.md` (léelo completo en cada sesión). Bitácora: `docs/PROGRESS.md`.

## Regla principal
**Prototipo: evita la sobreingeniería.** Sin Docker, microservicios, colas, Redis, GraphQL,
WebSockets ni Redux. Todo local y gratis. Si dudas entre dos caminos, elige el más simple que funcione.
Una sesión = una fase. No adelantes trabajo de fases futuras.

## Stack
| Parte | Carpeta | Tecnología |
|---|---|---|
| Backend | `backend/` | Python + FastAPI + SQLModel + SQLite + JWT |
| Web (terapeuta) | `web/` | React + Vite + TypeScript + Mantine + Recharts |
| App (paciente) | `mobile/` | Expo + TypeScript + expo-router + React Native Paper |

## Comandos (Windows / PowerShell)
Backend (desde `backend/`):
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python seed.py                          # borra y recrea neuroad.db con datos demo
uvicorn app.main:app --reload           # http://localhost:8000/docs
pytest                                  # desde Fase 2
```
Web (desde `web/`, desde Fase 3): `npm install` · `npm run dev`
App (desde `mobile/`, desde Fase 6): `npm install` · `npx expo start`
Para el teléfono: backend con `--host 0.0.0.0` y `EXPO_PUBLIC_API_URL=http://<IP-LAN>:8000`.

## Convenciones
- Español en UI, textos para el usuario y commits. Inglés en código (nombres, variables, comentarios).
- Commits pequeños con prefijo de fase: `fase-3: listado de pacientes`.
- TypeScript en modo estricto.
- No agregar librerías nuevas sin justificarlo en `docs/PROGRESS.md` → Decisiones.
- Fechas en UTC en la BD; se muestran en `America/Santiago`.
- Catálogo de emociones: única fuente en `backend/app/emotions.py` (los frontends usan `GET /emotions`).
- Solo datos ficticios (seed). Nunca datos reales de pacientes.
- Ambigüedad → opción más simple, anotada en `docs/PROGRESS.md` → Decisiones.
