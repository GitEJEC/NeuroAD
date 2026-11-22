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

## Web (terapeuta)
Con el backend corriendo, en PowerShell desde la carpeta `web/`:

```powershell
copy .env.example .env
npm install
npm run dev
```

- Abre http://localhost:5173 e inicia sesión con la cuenta de terapeuta.

## App (paciente)
Se usa **Expo Go** en un teléfono Android. Puedes instalarlo desde Play Store, o dejar que `expo start --android` lo instale por USB.

**Opción A: Wi-Fi.** El teléfono debe estar en la misma red que el PC.
```powershell
# backend/: el backend escucha en la red
uvicorn app.main:app --host 0.0.0.0 --port 8000
# mobile/:
copy .env.example .env      # EXPO_PUBLIC_API_URL=http://<IP-LAN-del-PC>:8000
npm install
npx expo start              # escanea el QR con Expo Go
```
El firewall de Windows debe permitir los puertos 8000 y 8081 en la red privada.

**Opción B: cable USB.** No depende del firewall. Requiere `adb` y la depuración USB activada.
```powershell
adb reverse tcp:8000 tcp:8000
adb reverse tcp:8081 tcp:8081
# mobile/:
$env:EXPO_PUBLIC_API_URL='http://localhost:8000'
npx expo start --android --localhost
```

Luego inicia sesión con `paciente1@neuroad.cl` / `demo1234`. En la terminal de Expo, `r` recarga la app.
