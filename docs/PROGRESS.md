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

### 2026-11-22 — Fase 3: Web base, login y pacientes
**Qué se hizo**
- `web/` con Vite 8 + React 19 + TypeScript (estricto), Mantine 9 (core, hooks, notifications), react-router-dom 7, fuente Lexend (Google Fonts).
- `src/api/client.ts`: `api()` con `VITE_API_URL`, token en `localStorage`, 401 con sesión → borra token y vuelve a `/login`; tipos y `formatDateTime` (hora de Santiago).
- `src/auth/AuthContext.tsx`: sesión (`login`, `logout`, `/auth/me` al recargar) y `RequireAuth`.
- Páginas: `Login`, `Patients` (tabla: nombre, última parálisis, badge "N sin ver"), `PatientDetail` (pestañas vacías Resumen · Tareas · Consejos).
- `components/AppLayout` (encabezado: NeuroAD, nombre del terapeuta, campana, Salir) y `components/NotificationBell`
  (polling 15 s a `/notifications`, contador, toast con paciente/fecha/descripción en reportes nuevos, clic → marca visto y abre el paciente).
- `PLAN.md`: IP LAN del PC de desarrollo (`192.168.100.10`) para las pruebas con el teléfono.

**Cómo probarlo**
```powershell
# backend/: python seed.py; uvicorn app.main:app --reload
# web/:
copy .env.example .env
npm install
npm run dev     # http://localhost:5173 → terapeuta@neuroad.cl / demo1234
```
Verificado: `npm run build` y `npm run lint` sin errores ni warnings. Con backend + Vite corriendo: la página sirve,
CORS permite `http://localhost:5173`, login → `/patients` (2 pacientes, Matías con 2 sin ver) y `/notifications` (2 reportes);
token inválido → 401; contraseña mala → 401 "Correo o contraseña incorrectos".
No verificado en navegador (sin herramienta de navegador en la sesión): recorrido visual login → lista → detalle → campana. Hacerlo a mano.

**Pendientes**
- Fase 4: pestaña Resumen (gráfico, leyenda, KPIs).

### 2026-11-22 — Ajuste Fase 3 (pedido tras la prueba en navegador)
**Qué se hizo**
- Pestaña nueva **Reportes de parálisis** en el detalle del paciente (Resumen · Reportes de parálisis · Tareas · Consejos):
  el registro completo de las parálisis (`components/ParalysisFeed.tsx`). Muestra badge "Nuevo" en las no vistas y un contador en la pestaña.
- Campana: al hacer clic en una notificación se abre `/patients/{id}?tab=paralysis&report={rid}`, con ese reporte destacado
  (borde índigo y "Seleccionado") y desplazado a la vista.
- Al abrir la pestaña, los no vistos del paciente se marcan como vistos y la campana se actualiza de inmediato (evento `neuroad:notifications`).
- Backend: `GET /patients/{id}/paralysis` acepta `range` opcional; sin `range` devuelve todo el historial. Test nuevo (9 tests en total).
- Web más grande y agradable: base 18 px, fondo gris suave, encabezado de 72 px, pacientes en tarjetas, login más amplio, pestañas grandes.
- `PLAN.md` (§4, §7, Fases 3 y 4) actualizado con estas especificaciones.

**Cómo probarlo**
`pytest` → 9 passed. `python seed.py`, backend y `npm run dev`. En http://localhost:5173: campana (2) → clic en un reporte →
Matías, pestaña Reportes de parálisis con 5 reportes y el elegido destacado; la campana baja a 0.
Verificado: `npm run build` y `npm run lint` sin errores; `GET /patients/2/paralysis` sin `range` → 5 reportes (2 sin ver).
No verificado en navegador por Claude: lo prueba el usuario.

### 2026-11-22 — Fase 4: Dashboard de emociones y KPIs
**Qué se hizo**
- Pestaña **Resumen** completa (`components/SummaryTab.tsx`): control **Día / Semana / Mes** (por defecto Semana) que afecta KPIs y gráfico.
- `KpiCards`: parálisis en el rango, última parálisis, emociones registradas, emoción más frecuente, tareas 👍 / 👎.
- `EmotionChart` (Recharts) con interruptor **Barras / Torta**; colores desde `GET /emotions`.
- `EmotionLegend` al costado (debajo en pantallas angostas): color + emoji + nombre + conteo.
- Estado vacío "No hay emociones registradas en este rango." Tipos `Emotion`, `EmotionCount`, `Kpis`, `Range` en `api/client.ts`.
- Sin cambios en el backend.

**Cómo probarlo**
```powershell
# backend/: python seed.py; uvicorn app.main:app --reload
# web/: npm install; npm run dev  → http://localhost:5173 → Matías → Resumen
```
Verificado: `npm run build` y `npm run lint` sin errores (solo el aviso de Vite por bundle > 500 kB). `pytest` 9 passed.
Script que compara `/patients/2/kpis` y `/emotions/summary` con consultas SQL directas a `neuroad.db`: coinciden en
day (1 emoción, 1 parálisis), week (10 emociones, 2 parálisis) y month (40 emociones, 5 parálisis).
No verificado en navegador por Claude: el recorrido visual (cambiar filtro y Barras/Torta) lo prueba el usuario.

**Pendientes**
- Fase 5: tareas, micropasos y consejos en la web.

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
- (Fase 3) Librerías nuevas: las que pide el plan (`@mantine/core`, `@mantine/hooks`, `@mantine/notifications`, `react-router-dom`) más lo que trae la plantilla Vite (`oxlint` como linter). Recharts se instala en Fase 4.
- (Fase 3) Sin `postcss-preset-mantine`: no escribimos CSS con mixins de Mantine. Fechas con `Intl.DateTimeFormat` (sin dayjs).
- ~~(Fase 3) Clic en una notificación marca ese reporte como visto.~~ Reemplazado en el ajuste de Fase 3: los reportes se marcan como vistos al abrir la pestaña Reportes de parálisis.
- (Ajuste Fase 3, pedido del usuario) El registro de parálisis vive en su propia pestaña y muestra todo el historial; el filtro Día/Semana/Mes de la Fase 4 no lo afecta.
- (Ajuste Fase 3) `range` opcional solo en `GET /patients/{id}/paralysis`; resumen y KPIs siguen exigiendo rango (por defecto `week`).
- (Ajuste Fase 3) El reporte elegido va en la URL (`?tab=paralysis&report=`), así se puede recargar o compartir sin estado extra.
- (Ajuste Fase 3) Tamaño: `html { font-size: 112.5% }` (18 px), así todo Mantine escala sin tocar cada componente.
- (Fase 3) La primera consulta de la campana solo fija la base (sin toast); los toasts salen para reportes que aparecen después.
- (Fase 3) 401 con sesión activa → `window.location.assign('/login')`, sin bus de eventos.
- (Fase 3) Un paciente que intenta entrar a la web ve el mismo "Correo o contraseña incorrectos" que una contraseña mala (no se guarda su token). Antes decía "Esta web es solo para terapeutas.", pero eso confirmaba que la contraseña era correcta.
- (Fase 3) La campana usa el emoji 🔔 (con `aria-label`) en vez de agregar una librería de íconos.
- (Fase 4) Librería nueva `recharts` (la pide el plan). El bundle pasa de 500 kB; no se divide el código porque es un prototipo local.
- (Fase 4) La leyenda muestra las 10 emociones (las que tienen 0 van atenuadas), así no cambia de forma entre rangos. El gráfico muestra solo las que tienen registros.
- (Fase 4) Gráficos sin animación (guía §6, regla 10).
- (Fase 4) El filtro y el tipo de gráfico viven en estado local, no en la URL. Al cambiar de filtro, los datos anteriores siguen en pantalla hasta que llegan los nuevos.
- (Fase 4) Las KPIs se muestran aunque no haya emociones en el rango (en 0); el estado vacío solo reemplaza el gráfico.
- (Fase 3) Se borró `web/README.md` de una línea para que `create-vite` creara el proyecto; quedó uno nuevo que remite al README raíz.

## Pendientes
- Fases 5 a 8 según `PLAN.md`.
