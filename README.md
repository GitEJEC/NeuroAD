# NeuroAD

Prototipo de seguimiento y apoyo para pacientes con TDAH (app móvil) y sus terapeutas (web).
Plan completo en [PLAN.md](PLAN.md).

## Requisitos
- Python 3.11 o superior
- (Desde Fase 3) Node.js LTS

## Backend
En PowerShell, desde la carpeta `backend/`:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python seed.py
uvicorn app.main:app --reload
```

- Salud: http://localhost:8000/health → `{"status":"ok"}`
- Documentación de la API: http://localhost:8000/docs
- `python seed.py` borra y recrea `neuroad.db` cada vez que se ejecuta.

## Credenciales demo (datos ficticios)
| Rol | Email | Contraseña |
|---|---|---|
| Terapeuta | terapeuta@neuroad.cl | demo1234 |
| Paciente | paciente1@neuroad.cl | demo1234 |
| Paciente | paciente2@neuroad.cl | demo1234 |

## Web y app
Se agregan en las fases 3 (web) y 6 (app).
