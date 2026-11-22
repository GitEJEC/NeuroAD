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

### 2026-11-22 — Fase 5: Tareas, micropasos y consejos (web)
**Qué se hizo**
- Pestaña **Tareas** (`components/TasksTab.tsx`): tarjetas con título, nº de micropasos y feedback del paciente
  (👍 Le sirvió / 👎 No le sirvió / Sin respuesta, con fecha). Botones "Nueva tarea", Editar y Eliminar.
- `TaskEditor` (modal): título + micropasos numerados; agregar, editar, eliminar, subir/bajar con botones (sin drag & drop).
  Guardar → `POST` o `PUT` con la lista completa. Validación: título obligatorio y al menos 1 micropaso (los vacíos se descartan).
- Pestaña **Consejos** (`components/TipsTab.tsx` + `TipEditor`): lista en el orden que ve el paciente; crear, editar,
  eliminar y subir/bajar. Validación: título y texto obligatorios.
- `ConfirmDelete`: modal de confirmación para borrar tareas y consejos. Tipos `Task` y `Tip` en `api/client.ts`.
- Sin cambios en el backend.

**Cómo probarlo**
```powershell
# backend/: python seed.py; uvicorn app.main:app --reload
# web/: npm install; npm run dev  → http://localhost:5173 → Matías → Tareas / Consejos
```
Verificado: `npm run build` y `npm run lint` sin errores (solo el aviso de Vite por bundle > 500 kB); `pytest` 9 passed.
Recorrido en Chromium (Playwright) con backend + Vite reales: validaciones visibles; tarea nueva con 4 pasos A-B-C-D,
reordenada a B-A-D-C y guardada; tras recargar, editada (título y pasos) y eliminada con confirmación; la API confirma cada cambio.
Consejo nuevo, subido un lugar, recargado (orden persiste), editado y eliminado.

**Pendientes**
- Fase 6: app móvil (base, diseño, parálisis, Qué hacer).

### 2026-11-22 — Fase 6: App móvil base, parálisis y "Qué hacer"
**Qué se hizo**
- `mobile/` con Expo SDK 58 (`create-expo-app`, plantilla blank-typescript) + expo-router, React Native Paper, Lexend,
  expo-haptics, expo-secure-store y @expo/vector-icons. TypeScript estricto.
- `src/theme/`: tema Paper con índigo `#303F9F`, fondo `#F5F6FA`, Lexend y texto base 18 sp (interlineado 27).
- `src/api/client.ts` (`api()` con timeout de 10 s; sin conexión → "No hay conexión. Lo intentaremos de nuevo.") y
  `src/api/session.tsx` (token y usuario en secure-store; con sesión guardada entra directo; un 401 cierra la sesión).
- Componentes: `BigButton`, `TipCard`, `ErrorMessage` (con Reintentar), `EmptyState`, `Screen`.
- Rutas: `login`; `(tabs)` con Inicio · Tareas · Emociones · Qué hacer (ícono + texto).
  - **Inicio:** "Hola, {nombre}" y el botón "Reportar parálisis" (≥ 120 dp). El toque hace `POST` de inmediato y vibra.
    Luego se abre un panel con "¿Qué pasó? (opcional)" y los botones Enviar (`PATCH`) y Saltar. Los dos llevan a Qué hacer.
    Abajo hay un botón "Salir" discreto.
  - **Qué hacer:** consejos de `GET /me/tips` en tarjetas. Se recargan cada vez que se abre la pestaña.
  - Tareas y Emociones: solo estado vacío (Fase 7).
- `docs/UX_BAJA_FRICCION.md` con colores, tamaños y textos concretos. README: cómo levantar la app (Wi-Fi o USB).

**Cómo probarlo**
```powershell
# backend/: python seed.py; uvicorn app.main:app --host 0.0.0.0 --port 8000
# mobile/:  copy .env.example .env; npm install; npx expo start   (QR con Expo Go)
# Por USB:  adb reverse tcp:8000 tcp:8000; adb reverse tcp:8081 tcp:8081
#           $env:EXPO_PUBLIC_API_URL='http://localhost:8000'; npx expo start --android --localhost
```
Verificado: `npx tsc --noEmit` sin errores, `npx expo export --platform android` arma el bundle y `pytest` da 9 passed.
Recorrido en un Motorola edge 60 fusion real (Expo Go por USB), manejado por Claude con `adb` y capturas:
- Login con contraseña mala muestra "Correo o contraseña incorrectos"; con `demo1234` entra a Inicio.
- Reportar parálisis abre el panel "Listo, tu terapeuta ya fue avisado.". Con una descripción y Enviar, llega a Qué hacer y muestra los 5 consejos.
- `GET /notifications` del terapeuta trae ese reporte con su descripción, que es lo que consulta la campana cada 15 s.
- Tareas y Emociones muestran su estado vacío.
- Salir vuelve al login. Al cerrar y reabrir Expo Go, la app entra directo.
- Sin backend aparece "No hay conexión…" con Reintentar. Al reconectar, Reintentar abre el panel; Saltar lleva a Qué hacer y el reporte queda sin descripción.

No verificado por Claude:
- La vibración y el toast de la web los confirmó después el usuario: el teléfono vibra, la notificación llega a la web y los dashboards se actualizan.
- La prueba por Wi-Fi con la IP LAN: el firewall de Windows la bloquea. Se probó por USB con `adb reverse`.
  Causa: la regla de `python.exe` solo permite el perfil Public, y el Wi-Fi está en Private, así que uvicorn (8000) queda bloqueado.
  Node sí tiene permiso en Private. Solución (como administrador): ver README, Opción A.

**Ajuste (pedido tras la prueba en el teléfono)**
- El usuario confirmó la vibración al reportar.
- En el panel de parálisis, "Saltar" pasa a ser **Salir**: cierra el panel y la app se queda en Inicio. Enviar, con texto o sin él, sigue llevando a Qué hacer.
  `PLAN.md` §7 y `docs/UX_BAJA_FRICCION.md` actualizados.
- Segundo ajuste: el reporte ya no se crea al tocar el botón grande, sino solo al tocar **Enviar**.
  El botón grande vibra y abre el panel "Avisa a tu terapeuta". Enviar hace `POST` y, si hay texto, `PATCH`; luego vibra,
  lleva a Qué hacer y muestra un aviso "Listo, tu terapeuta ya fue avisado." de 4 s. Salir cierra el panel sin crear nada.
  Verificado en el Motorola: abrir el panel y tocar Salir no crea reportes. Con texto y Enviar se crea el reporte
  con su descripción, se abre Qué hacer y se ve el aviso.
- Tercer ajuste: el panel queda anclado arriba (`marginTop: 192`, punto medio entre el centrado original y un primer intento con 96 que quedó demasiado alto), no centrado. Así el teclado no tapa Enviar ni Salir;
  verificado en el teléfono con el teclado abierto. Se quitó el `KeyboardAvoidingView`, que no servía dentro del modal.
- El tag `fase-6` se movió al último commit de los ajustes, con autorización del usuario.

**Pendientes**
- Para usar Wi-Fi, permitir los puertos 8000 y 8081 en el firewall de Windows (red privada). Hace falta un administrador; el comando está en el README.
- Fase 7: Tareas y Emociones en la app.

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
- (Fase 5) "Se reordena" en el criterio de Hecho = reordenar micropasos; el plan no pide reordenar tareas, así que no se hace.
- (Fase 5) Subir/bajar un consejo intercambia `position` con su vecino usando dos `PUT` existentes; sin endpoint nuevo.
- (Fase 5) Confirmación de borrado con un `Modal` propio, sin agregar `@mantine/modals`.
- (Fase 5) Tras guardar o borrar se recarga la lista desde el backend (sin estado optimista).
- (Fase 5) Micropasos vacíos se descartan al guardar; si no queda ninguno, se pide al menos uno.
- (Fase 3) Se borró `web/README.md` de una línea para que `create-vite` creara el proyecto; quedó uno nuevo que remite al README raíz.

- (Fase 6) Expo SDK 58 con la plantilla blank-typescript, y expo-router agregado a mano. Así no hay que borrar el boilerplate de la plantilla "default". Las rutas van en `mobile/app/` (estructura del PLAN).
- (Fase 6) Librerías nuevas: las que pide el plan y las que requieren expo-router y las fuentes (`react-native-safe-area-context`, `react-native-screens`, `expo-linking`, `expo-constants`, `expo-font`). También `react-dom`, fijado por `expo install` en la versión de `react`: sin él, un `npm install` limpio falla por ERESOLVE (peer opcional de expo-router).
- (Fase 6) Se quitaron de la plantilla `AGENTS.md`, `LICENSE` y `.claude/settings.json` (activaba un plugin). `expo-splash-screen` también se quitó: mientras carga se muestra un indicador.
- (Fase 6) La sesión usa `Stack.Protected` de expo-router, sin redirecciones manuales. El token y el usuario se guardan en secure-store y la app entra directo sin llamar a `/auth/me`; un 401 posterior cierra la sesión. Así funciona sin conexión al abrir.
- (Fase 6) Un terapeuta que entra a la app ve "Correo o contraseña incorrectos", igual que en la web.
- (Fase 6) `api()` corta a los 10 s: con una IP LAN inalcanzable el botón no queda girando.
- ~~(Fase 6) En el panel de parálisis, Enviar con el texto vacío equivale a Saltar.~~ Reemplazado en el ajuste de Fase 6.
- (Ajuste Fase 6, pedido del usuario) El botón "Saltar" pasa a ser "Salir": cierra el panel y se queda en Inicio, sin abrir Qué hacer. Para reportar sin texto se usa Enviar, que no hace `PATCH` y lleva a Qué hacer. (Desde el segundo ajuste, Salir no crea ningún reporte.)
- (Ajuste Fase 6, pedido del usuario) El reporte se crea solo al tocar Enviar, no al tocar el botón grande. Así, `pressed_at` es la hora del envío. Salir ya no deja ningún reporte.
- (Ajuste Fase 6) Enviar usa los endpoints existentes, `POST` y luego `PATCH` si hay texto, sin cambiar el backend. Si el `PATCH` falla, Reintentar reusa el id ya creado y no duplica el reporte.
- (Ajuste Fase 6) El aviso "Listo, tu terapeuta ya fue avisado." es un `Snackbar` dentro del `Portal` de Paper, para que se vea sobre Qué hacer después de navegar.
- (Fase 6) El panel no se cierra tocando fuera, para no perder el paso.
- (Fase 6) Tareas y Emociones muestran solo un estado vacío hasta la Fase 7.
- (Fase 6) Sin ESLint en mobile; el chequeo es `tsc --noEmit` en modo estricto.
- (Fase 6) Prueba en el teléfono por USB con `adb reverse` (8000 y 8081) y `EXPO_PUBLIC_API_URL=http://localhost:8000`, porque el firewall de Windows bloquea la LAN. El `.env.example` mantiene la IP LAN del plan.

## Pendientes
- Fases 7 y 8 según `PLAN.md`.
- Firewall de Windows: permitir los puertos 8000 y 8081 para probar la app por Wi-Fi (comando en el README, Opción A).
