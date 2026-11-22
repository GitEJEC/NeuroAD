# NeuroAD

Prototipo de seguimiento y apoyo para pacientes con TDAH (app móvil) y sus terapeutas (web).
Todo corre local y gratis; los datos son ficticios. Plan completo en [PLAN.md](PLAN.md).

| Parte | Carpeta | Tecnología |
|---|---|---|
| Backend (API) | `backend/` | Python + FastAPI + SQLModel + SQLite + JWT |
| Web del terapeuta | `web/` | React + Vite + TypeScript + Mantine + Recharts |
| App del paciente | `mobile/` | Expo + TypeScript + expo-router + React Native Paper |

## Requisitos
- Windows con PowerShell (los comandos de abajo son para PowerShell).
- Git, **Python 3.11 o superior** y **Node.js LTS** (incluye `npm`).
- Un teléfono **Android** con **Expo Go** (Play Store) en la misma red Wi-Fi que el PC, o conectado por USB.
- Opcional, solo para la Opción B (USB): `adb` (Android Platform Tools) y la depuración USB activada en el teléfono.

```powershell
git clone https://github.com/GitEJEC/NeuroAD.git
cd NeuroAD
```

Usa tres terminales: una para el backend, otra para la web y otra para la app.

## 1. Backend
Desde la carpeta `backend/`:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python seed.py
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

- Salud: http://localhost:8000/health → `{"status":"ok"}`
- Documentación de la API: http://localhost:8000/docs (contrato en [docs/API.md](docs/API.md))
- `python seed.py` borra y recrea `neuroad.db` con los datos demo. Úsalo para dejar la demo como nueva.
- `--host 0.0.0.0` deja que el teléfono llegue al backend por la red. Si solo usas la web, basta `uvicorn app.main:app --reload`.
- Tests: `pytest`.

## 2. Web (terapeuta)
Con el backend corriendo, desde la carpeta `web/`:

```powershell
copy .env.example .env
npm install
npm run dev
```

Abre http://localhost:5173 e inicia sesión con la cuenta de terapeuta.

## 3. App (paciente)
Se usa **Expo Go** en un teléfono Android. Elige una de estas opciones.

**Opción A: Wi-Fi.** El teléfono debe estar en la misma red que el PC.
1. Busca la IP LAN del PC con `ipconfig` (por ejemplo, `192.168.100.10`).
2. Desde la carpeta `mobile/`:
   ```powershell
   copy .env.example .env      # edita EXPO_PUBLIC_API_URL=http://<IP-LAN-del-PC>:8000
   npm install
   npx expo start              # escanea el QR con Expo Go
   ```
3. El firewall de Windows debe permitir los puertos 8000 y 8081 en la red privada. Ejecuta esto una sola vez en una PowerShell **como administrador**:
   ```powershell
   New-NetFirewallRule -DisplayName "NeuroAD (API 8000, Expo 8081)" -Direction Inbound -Protocol TCP -LocalPort 8000,8081 -Action Allow -Profile Private
   # Para quitarla: Remove-NetFirewallRule -DisplayName "NeuroAD (API 8000, Expo 8081)"
   ```
   La red Wi-Fi debe estar en perfil **Privado**. Para comprobarlo: `Get-NetConnectionProfile`.
   Si antes usaste la Opción B, quita los túneles con `adb reverse --remove-all`.

**Opción B: cable USB.** No depende del firewall. Requiere `adb` y la depuración USB activada.
```powershell
adb reverse tcp:8000 tcp:8000
adb reverse tcp:8081 tcp:8081
# desde mobile/:
npm install
$env:EXPO_PUBLIC_API_URL='http://localhost:8000'
npx expo start --android --localhost
```

Inicia sesión con `paciente1@neuroad.cl` / `demo1234`. En la terminal de Expo, `r` recarga la app.

## Credenciales demo (datos ficticios)
| Rol | Email | Contraseña |
|---|---|---|
| Terapeuta | terapeuta@neuroad.cl | demo1234 |
| Paciente (Matías Soto) | paciente1@neuroad.cl | demo1234 |
| Paciente (Valentina Muñoz) | paciente2@neuroad.cl | demo1234 |

## Guion de demo
Antes de empezar: `python seed.py` y las tres partes corriendo.

1. **Web:** inicia sesión como terapeuta y abre a **Matías Soto**. Deja la pestaña abierta.
2. **App:** inicia sesión como `paciente1@neuroad.cl`.
   - En **Emociones**, registra 3 emociones: elige una, toca **Enviar** y repite.
   - En **Tareas**, abre **"Hacer la cama"**, baja hasta el final y toca **Me sirvió 👍**.
3. **App:** en **Inicio**, toca **Reportar parálisis**. Escribe qué pasó y toca **Enviar**. La app abre **Qué hacer** y muestra "Listo, tu terapeuta ya fue avisado."
4. **Web:** en 15 s o menos aparece un aviso con el paciente, la hora y la descripción, y la campana 🔔 suma uno.
   En **Resumen**, elige **Día**: el gráfico y la leyenda muestran las emociones de hoy, y las tarjetas muestran la parálisis y "👍 1".
   Clic en la campana → abre **Reportes de parálisis** con ese reporte destacado.
5. **Web:** en **Tareas**, edita un paso de "Hacer la cama" y guarda. En **Consejos**, edita un consejo y guarda.
   **App:** abre la pestaña **Tareas** y luego **Qué hacer**: los cambios ya se ven (las pestañas se recargan al abrirse; en Tareas también puedes deslizar hacia abajo).

## Problemas comunes
- **"No se puede cargar el archivo ... Activate.ps1 / npx.ps1 porque la ejecución de scripts está deshabilitada"**: PowerShell bloquea los scripts por defecto. Ejecuta una sola vez (no necesita administrador):
  ```powershell
  Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
  ```
  Si prefieres no cambiarlo, usa `.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000` (sin activar el venv) y `npx.cmd` / `npm.cmd` en vez de `npx` / `npm`.
- **"address already in use" o Expo pregunta por otro puerto**: ya hay un backend o un Expo abierto. Ciérralo (Ctrl+C en su ventana) antes de iniciar otro.
- **La app dice "No hay conexión. Lo intentaremos de nuevo."**: revisa que el backend corra con `--host 0.0.0.0`, que `EXPO_PUBLIC_API_URL` tenga la IP correcta y que el firewall permita el puerto 8000 (Opción A). Desde el navegador del teléfono, `http://<IP-LAN>:8000/health` debe responder.
- **Android 17 o superior:** Expo Go necesita el permiso **Red local** para llegar al PC. Sin él falla con "Something went wrong / Failed to download remote update", aunque Chrome sí abra la IP.
  Actívalo en Ajustes → Apps → Expo Go → Permisos → Red local → Permitir. Con el cable también sirve `adb shell pm grant host.exp.exponent android.permission.ACCESS_LOCAL_NETWORK`.
- **Cambiaste `.env` de la app y no se nota:** reinicia con `npx expo start --clear`. La primera carga tras `--clear` puede tardar; si falla, toca recargar en Expo Go.
- **La web no inicia sesión:** el backend debe estar en http://localhost:8000 y `CORS_ORIGINS` en `backend/.env` debe incluir `http://localhost:5173`.

## Documentación
- [PLAN.md](PLAN.md): plan maestro y fases.
- [docs/API.md](docs/API.md): endpoints con ejemplos.
- [docs/UX_BAJA_FRICCION.md](docs/UX_BAJA_FRICCION.md): guía de diseño de la app y revisión de sus 11 reglas.
- [docs/PROGRESS.md](docs/PROGRESS.md): bitácora, decisiones e ideas para después del prototipo.
