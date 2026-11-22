# PLAN.md — NeuroAD (prototipo)

> Documento maestro para Claude Code. Léelo completo al inicio de **cada** sesión.
> Cada sesión ejecuta **una sola fase**. No adelantes trabajo de fases futuras.

---

## 0. Qué es NeuroAD

Sistema de seguimiento y apoyo para **pacientes con TDAH** y sus **terapeutas**. Tres bloques:

| Bloque | Usuario | Tecnología |
|---|---|---|
| **App móvil** (`/mobile`) | Paciente | Expo (React Native) + TypeScript + expo-router + React Native Paper |
| **Web** (`/web`) | Terapeuta | React + Vite + TypeScript + Mantine + Recharts |
| **Backend** (`/backend`) | Conecta todo | Python + FastAPI + SQLModel + SQLite + JWT |

**ESTO ES UN PROTOTIPO. EVITA LA SOBREINGENIERÍA.**
- Nada de Docker, microservicios, colas, Redis, GraphQL, WebSockets, Redux, ni arquitectura "por si acaso".
- Todo gratis y local. Base de datos = un archivo SQLite.
- Las "notificaciones" en la web se hacen con **polling cada 15 s**. Es suficiente.
- Si dudas entre dos caminos, elige el más simple que funcione.
- Datos ficticios únicamente (seed). Nunca datos reales de pacientes.

Entorno del desarrollador: **Windows**, repo local en `C:\dev\NeuroAD`, remoto en `https://github.com/GitEJEC/NeuroAD`. Usa comandos compatibles con PowerShell.

---

## 1. Protocolo de cada sesión (obligatorio)

**Al empezar:**
1. Lee `PLAN.md`, `CLAUDE.md` (si existe) y `docs/PROGRESS.md` (si existe).
2. Revisa `git status` y `git log --oneline -10`.
3. Confirma en una línea qué fase vas a ejecutar y qué vas a entregar.

**Durante:**
- Commits pequeños y descriptivos en español, con prefijo de fase: `fase-3: listado de pacientes`.
- Si algo del plan es ambiguo, toma la opción más simple y anótala en `docs/PROGRESS.md` → "Decisiones".
- No cambies el stack ni la estructura de carpetas sin anotarlo y justificarlo.

**Al terminar:**
1. Verifica los **criterios de "Hecho"** de la fase (ejecuta lo que se pueda ejecutar).
2. Marca la fase como completada en la tabla de la sección 9 de este archivo.
3. Agrega en `docs/PROGRESS.md` una entrada: fecha, fase, qué se hizo, cómo probarlo, pendientes.
4. `git add`, `git commit`, `git push origin main`, y crea el tag `fase-N` (`git tag fase-N && git push origin fase-N`).

---

## 2. Estructura del repositorio

```
NeuroAD/
├── PLAN.md                    ← este archivo
├── CLAUDE.md                  ← convenciones para Claude Code (Fase 1)
├── README.md                  ← cómo levantar todo (Fase 1, se completa en Fase 8)
├── .gitignore
├── docs/
│   ├── PROGRESS.md            ← bitácora de sesiones y decisiones
│   ├── API.md                 ← contrato de endpoints (Fase 2)
│   └── UX_BAJA_FRICCION.md    ← guía de diseño (Fase 6)
├── backend/
│   ├── app/
│   │   ├── main.py            ← FastAPI, CORS, routers
│   │   ├── config.py          ← lee .env (SECRET_KEY, DB_URL, CORS_ORIGINS)
│   │   ├── db.py              ← engine SQLite + get_session
│   │   ├── models.py          ← tablas SQLModel
│   │   ├── schemas.py         ← modelos de entrada/salida
│   │   ├── security.py        ← hash de contraseñas + JWT + dependencias de rol
│   │   ├── emotions.py        ← catálogo de emociones (fuente única de verdad)
│   │   └── routers/
│   │       ├── auth.py        ← /auth/*
│   │       ├── patient.py     ← /me/*        (rol paciente)
│   │       └── therapist.py   ← /patients/*, /notifications (rol terapeuta)
│   ├── seed.py                ← crea BD con datos demo
│   ├── tests/                 ← pytest, solo lo esencial
│   ├── requirements.txt
│   └── .env.example
├── web/
│   ├── src/
│   │   ├── api/client.ts      ← fetch + token
│   │   ├── auth/              ← contexto de sesión, ruta protegida
│   │   ├── pages/             ← Login, Patients, PatientDetail
│   │   ├── components/        ← EmotionChart, EmotionLegend, KpiCards,
│   │   │                        ParalysisFeed, NotificationBell, TaskEditor, TipEditor
│   │   └── main.tsx
│   └── .env.example           ← VITE_API_URL
└── mobile/
    ├── app/                   ← expo-router
    │   ├── _layout.tsx
    │   ├── login.tsx
    │   └── (tabs)/
    │       ├── _layout.tsx    ← 4 pestañas
    │       ├── index.tsx      ← Inicio: botón "Reportar parálisis"
    │       ├── tareas.tsx
    │       ├── emociones.tsx
    │       └── que-hacer.tsx
    ├── src/
    │   ├── api/               ← cliente + token en expo-secure-store
    │   ├── components/        ← BigButton, TaskCard, MicroStepList, EmotionGrid, TipCard
    │   └── theme/             ← colores, tipografía, espaciados
    └── .env.example           ← EXPO_PUBLIC_API_URL=http://<IP-LAN>:8000
```

---

## 3. Modelo de datos (SQLite)

Guarda fechas en **UTC**; muéstralas en la zona `America/Santiago`.

| Tabla | Campos |
|---|---|
| `user` | id, email (único), password_hash, full_name, role (`therapist` \| `patient`), therapist_id (FK a user, nullable; solo pacientes), created_at |
| `paralysis_report` | id, patient_id, pressed_at, description (nullable), seen_by_therapist (bool, default false) |
| `task` | id, patient_id, title, position, feedback (`like` \| `dislike` \| null), feedback_at (nullable), created_at, updated_at |
| `micro_step` | id, task_id, position, text |
| `emotion_log` | id, patient_id, emotion_key, created_at |
| `tip` | id, patient_id, title, body, position |

Notas:
- El feedback es **uno por tarea** (el último gana). Tocar el mismo botón de nuevo lo quita (vuelve a null).
- Los micropasos se editan **reemplazando la lista completa** de la tarea en cada guardado. Más simple que un CRUD por paso.
- Los consejos son **por paciente**. Al crear un paciente se le copian los consejos por defecto (sección 5).

### Catálogo de emociones (`backend/app/emotions.py`)
Fuente única. Web y móvil lo obtienen de `GET /emotions`; no lo dupliques en el frontend.

| key | label | emoji | color |
|---|---|---|---|
| alegria | Alegría | 😊 | #F2B705 |
| calma | Calma | 😌 | #4CAF93 |
| tristeza | Tristeza | 😢 | #4A78C2 |
| miedo | Miedo | 😨 | #7E57C2 |
| enojo | Enojo | 😠 | #D9534F |
| asco | Asco | 🤢 | #6B8E23 |
| sorpresa | Sorpresa | 😮 | #F28C28 |
| ansiedad | Ansiedad | 😰 | #E06C9F |
| envidia | Envidia | 😒 | #2E8B57 |
| frustracion | Frustración | 😤 | #8D6E63 |

(Puedes ajustar los tonos si fallan en contraste, pero mantén 10 colores distinguibles entre sí.)

---

## 4. API (resumen; el detalle va en `docs/API.md` en la Fase 2)

Auth: `Authorization: Bearer <jwt>`. FastAPI expone Swagger en `/docs`.

**Comunes**
- `POST /auth/login` → `{access_token, user}`
- `GET /auth/me`
- `GET /emotions` → catálogo

**Paciente** (rol `patient`)
- `POST /me/paralysis` → crea reporte con `pressed_at` = ahora. Devuelve el id.
- `PATCH /me/paralysis/{id}` `{description}` → agrega la descripción después.
- `GET /me/tasks` → tareas con micropasos ordenados
- `PUT /me/tasks/{id}/feedback` `{value: "like" | "dislike" | null}`
- `POST /me/emotions` `{emotion_key}` → devuelve el id
- `DELETE /me/emotions/{id}` → solo si fue creada hace menos de 2 minutos (para "Deshacer")
- `GET /me/tips`

**Terapeuta** (rol `therapist`; solo puede ver a **sus** pacientes → si no, 404)
- `GET /patients` → lista con: nombre, último reporte de parálisis, nº de parálisis sin ver
- `GET /patients/{id}`
- `GET /patients/{id}/emotions/summary?range=day|week|month` → `[{emotion_key, count}]`
- `GET /patients/{id}/kpis?range=day|week|month`
- `GET /patients/{id}/paralysis?range=...` → lista de reportes
- `GET /notifications` → reportes de parálisis **no vistos** de todos sus pacientes
- `PATCH /paralysis/{id}/seen`
- `GET/POST /patients/{id}/tasks`, `PUT/DELETE /patients/{id}/tasks/{task_id}` (el body incluye `title` y `steps: [str]`)
- `GET/POST /patients/{id}/tips`, `PUT/DELETE /patients/{id}/tips/{tip_id}`

**Rangos** (en hora de Santiago): `day` = hoy desde 00:00; `week` = últimos 7 días; `month` = últimos 30 días.

**KPIs** (por rango): cantidad de parálisis, fecha/hora de la última parálisis, cantidad de emociones registradas, emoción más frecuente, tareas con 👍 y con 👎.

---

## 5. Contenido semilla (`backend/seed.py`)

- Terapeuta demo: `terapeuta@neuroad.cl` / `demo1234`
- Pacientes demo: `paciente1@neuroad.cl` y `paciente2@neuroad.cl` / `demo1234` (asignados al terapeuta)
- Para paciente1: ~40 emociones repartidas en los últimos 30 días, 4–6 reportes de parálisis (algunos con descripción), y 3 tareas.
- Tarea ejemplo obligatoria, **"Hacer la cama"**:
  1. Quitar todo lo que esté encima de la cama.
  2. Ajusta la base: coloca el protector de colchón (si usas) y encima la sábana bajera, enganchando bien las cuatro esquinas para que quede tirante y sin arrugas.
  3. Extiende la sábana encimera: pon la sábana plana encima con el lado bonito (o el bordado superior) mirando hacia abajo. Déjala al ras del borde de la cabecera y mete el sobrante de los pies debajo del colchón.
  4. Coloca la frazada: extiéndela sobre la sábana encimera, dejándola unos 20 a 30 cm más abajo que el borde de la cabecera. Mete los bordes inferiores y laterales debajo del colchón para que quede firme.
  5. Haz el doblez superior: toma el borde superior de la sábana encimera y dóblalo hacia atrás sobre la frazada (protege la frazada y da un acabado limpio tipo hotel).
  6. Cubre y remata: extiende el cubrecama por encima de todo cubriendo los costados y acomoda las almohadas con sus fundas al final.
- Consejos por defecto (se copian a cada paciente):
  - **Baja la vara y achica el paso:** elige solo una cosa mínima (por ejemplo, abrir el documento o escribir una línea). No intentes resolver todo el pendiente de golpe.
  - **Usa un temporizador corto:** pon 5 o 10 minutos con la idea de parar si quieres cuando suene. Empezar suele destrabar la inercia.
  - **Cambia tu estado físico:** levántate, toma agua, estírate o sal un par de minutos a que te dé el aire. Mover el cuerpo ayuda a cortar el bucle mental.
  - **Baja la culpa:** criticarte o retarte por estar bloqueado suele aumentar la ansiedad y empeorar la parálisis.
  - **Pide body doubling:** trabajar o hacer algo simple junto a otra persona (en persona o en llamada) puede dar un empujón suave para arrancar.

`seed.py` debe poder ejecutarse varias veces: borra y recrea la BD.

---

## 6. Guía de UI de baja fricción cognitiva (aplica a la app; la web la sigue en lo razonable)

Herramientas:
- **React Native Paper** (Material 3): componentes accesibles con roles y labels.
- **Lexend** (`@expo-google-fonts/lexend`): tipografía diseñada para reducir la carga de lectura. En la web también (Google Fonts).
- **expo-haptics**: vibración corta como confirmación de cada acción.
- **@expo/vector-icons** (MaterialCommunityIcons): íconos siempre acompañados de texto.

Reglas:
1. **Una acción principal por pantalla.** Lo importante, grande y arriba.
2. **4 pestañas, siempre visibles, con ícono + texto:** Inicio · Tareas · Emociones · Qué hacer.
3. **Texto:** base 18 sp, interlineado 1.5, alineado a la izquierda, sin cursivas ni justificado, frases cortas, en segunda persona ("Escribe qué pasó", no "Ingrese descripción").
4. **Áreas táctiles ≥ 48 dp**; el botón de parálisis ≥ 120 dp de alto y ancho completo.
5. **Color calmo y con contraste AA.** El botón de parálisis destaca por tamaño y un color firme (índigo/azul profundo), **no rojo alarma**. El color nunca es la única señal: siempre va con texto o ícono.
6. **Respuesta inmediata:** cada toque da vibración + mensaje claro ("Listo, tu terapeuta ya fue avisado").
7. **Cero pasos obligatorios innecesarios:** la descripción de la parálisis es opcional; nunca pidas confirmar dos veces.
8. **Errores amables y accionables:** "No hay conexión. Lo intentaremos de nuevo." + botón Reintentar.
9. **Estados vacíos con guía:** "Aún no tienes tareas. Tu terapeuta las agregará pronto."
10. **Sin distracciones:** sin animaciones decorativas, sin badges innecesarios, sin gamificación. Respeta "reducir movimiento" y el tamaño de fuente del sistema.
11. **Desglose de micropasos:** acordeón (solo una tarea abierta a la vez), pasos numerados, una idea por paso. Checkbox por paso **solo en memoria local** (no se guarda en backend), para dar sensación de avance.

---

## 7. Comportamiento clave (para no malinterpretar)

**Reportar parálisis (app):**
1. El paciente toca el botón → se envía `POST /me/paralysis` de inmediato (queda registrada la fecha/hora del toque aunque no escriba nada) → vibración.
2. Se abre un panel con un cuadro de texto opcional "¿Qué pasó? (opcional)" y dos botones: **Enviar** y **Saltar**.
3. Enviar → `PATCH` con la descripción. En ambos casos, la app navega automáticamente a la pestaña **Qué hacer**.
4. Si no hay conexión: mostrar error amable con Reintentar (sin colas offline).

**Notificación en la web:** la web consulta `GET /notifications` cada 15 s. Si llega un reporte nuevo, muestra un toast con paciente, fecha/hora y descripción, y una campana con contador en el encabezado. Al abrir el paciente o hacer clic en el reporte se marca como visto.

**Emociones (app):** grilla de botones grandes (emoji + nombre). Un toque registra la emoción con fecha/hora y muestra un snackbar "Guardado: Calma · Deshacer" durante 5 s.

**Dashboard (web):** gráfico con interruptor **Barras / Torta**, filtro **Día / Semana / Mes**, y **leyenda lateral** con color + nombre de cada emoción y su conteo. KPIs en tarjetas arriba del gráfico.

---

## 8. Fases

### Fase 1 — Fundaciones del repo y esqueleto del backend
**Objetivo:** que el repo tenga estructura, documentación base y un backend que arranca con la BD creada.
- Crea la estructura de carpetas de la sección 2 (solo lo necesario para esta fase; `web/` y `mobile/` pueden quedar con un `README.md` de una línea).
- `.gitignore` para Python, Node, Expo, `.env`, `*.db`, `.venv`.
- `CLAUDE.md` con: resumen del proyecto, stack, comandos para levantar cada parte en Windows, convenciones (español en UI y commits, inglés en código, TypeScript estricto, sin librerías nuevas sin justificar), y la regla "prototipo: evita sobreingeniería".
- `docs/PROGRESS.md` con plantilla (Sesiones / Decisiones / Pendientes).
- Backend: `requirements.txt` (fastapi, uvicorn, sqlmodel, pyjwt, bcrypt, python-dotenv, pytest, httpx), `config.py`, `db.py`, `models.py` con todas las tablas, `emotions.py`, `main.py` con CORS y `GET /health`.
- `seed.py` completo (sección 5).
- `README.md` con instrucciones para backend.

**Hecho cuando:** `python seed.py` crea `neuroad.db` con datos; `uvicorn app.main:app --reload` responde `GET /health` → `{"status":"ok"}`; todo pusheado con tag `fase-1`.

### Fase 2 — API completa del backend
**Objetivo:** todos los endpoints de la sección 4 funcionando y probados.
- `security.py`: hash con bcrypt, JWT (expira en 7 días, suficiente para prototipo), dependencias `require_patient` / `require_therapist`.
- Routers `auth`, `patient`, `therapist` con validación de pertenencia terapeuta↔paciente.
- Agregaciones de emociones y KPIs por rango con zona horaria `America/Santiago`.
- Al crear tareas/consejos, `position` incremental; endpoints devuelven listas ordenadas.
- `tests/`: login correcto/incorrecto, paciente no puede usar endpoints de terapeuta, terapeuta no ve pacientes ajenos, flujo parálisis (POST + PATCH + aparece en notifications), resumen de emociones por rango, PUT de tarea reemplaza micropasos.
- `docs/API.md` con cada endpoint, ejemplo de request y response.

**Hecho cuando:** `pytest` pasa en verde; Swagger `/docs` muestra todo; tag `fase-2`.

### Fase 3 — Web: base, login y selección de paciente
**Objetivo:** el terapeuta entra y elige un paciente.
- Vite + React + TS en `/web`, Mantine (core + notifications), react-router, fuente Lexend.
- `api/client.ts`: base URL desde `VITE_API_URL`, token en `localStorage`, si responde 401 → cerrar sesión.
- Pantalla Login (email, contraseña, error claro).
- Layout con encabezado: nombre del terapeuta, **campana de notificaciones** (polling 15 s, contador, toast en nuevo reporte, clic → ir al paciente) y botón Salir.
- Página Pacientes: tarjetas o tabla con nombre, última parálisis y badge de no vistas. Clic → detalle.
- Página Detalle de paciente con pestañas vacías: **Resumen · Tareas · Consejos**.

**Hecho cuando:** con backend + seed corriendo, se inicia sesión, se ve la lista, se entra a un paciente y la campana muestra los reportes no vistos; tag `fase-3`.

### Fase 4 — Web: dashboard de emociones y KPIs
**Objetivo:** pestaña Resumen completa.
- Control segmentado **Día / Semana / Mes** (por defecto Semana) que afecta gráfico, KPIs y lista.
- `KpiCards`: parálisis en el rango, última parálisis, emociones registradas, emoción más frecuente, tareas 👍/👎.
- `EmotionChart` con Recharts e interruptor **Barras / Torta**. Colores desde `GET /emotions`.
- `EmotionLegend` a un costado (debajo en pantallas angostas): color + emoji + nombre + conteo.
- `ParalysisFeed`: lista de reportes del rango con fecha/hora local y descripción; los no vistos se destacan y se marcan como vistos al abrir la pestaña.
- Estado vacío cuando no hay datos en el rango.

**Hecho cuando:** cambiar filtro y tipo de gráfico actualiza todo sin recargar; los números coinciden con la BD; tag `fase-4`.

### Fase 5 — Web: gestión de tareas, micropasos y consejos
**Objetivo:** el terapeuta crea y edita el contenido que ve el paciente.
- Pestaña Tareas: lista de tareas con su feedback actual (👍 / 👎 / sin respuesta y fecha). Botón "Nueva tarea".
- `TaskEditor` (modal o panel): título + lista de micropasos editable (agregar, editar, eliminar, subir/bajar con botones; **sin drag & drop**). Guardar → `PUT` con la lista completa. Eliminar tarea con confirmación.
- Pestaña Consejos: lista de consejos (título + texto), crear, editar, eliminar, reordenar con subir/bajar.
- Validaciones mínimas: título obligatorio, al menos 1 micropaso.

**Hecho cuando:** se crea una tarea con 4 pasos, se reordena, se edita, se borra; lo mismo con consejos; todo persiste al recargar; tag `fase-5`.

### Fase 6 — App móvil: base, diseño, parálisis y "Qué hacer"
**Objetivo:** el paciente entra y puede reportar una parálisis.
- Expo + TS + expo-router en `/mobile`. Instala React Native Paper, `@expo-google-fonts/lexend`, expo-haptics, expo-secure-store.
- `src/theme/`: tema Paper con colores calmos, Lexend, tamaños de la sección 6.
- `docs/UX_BAJA_FRICCION.md`: la guía de la sección 6 con las decisiones concretas (colores finales, tamaños, textos tipo).
- Componentes base: `BigButton`, `TipCard`, mensaje de error con Reintentar, estado vacío.
- Login (token en secure-store; si hay token válido, entra directo).
- Tabs con 4 pestañas (ícono + texto). Botón Salir accesible pero discreto (por ejemplo en Inicio, abajo).
- **Inicio:** saludo corto + botón grande "Reportar parálisis" con el flujo de la sección 7.
- **Qué hacer:** lista de consejos (`GET /me/tips`), un consejo por tarjeta, título en negrita, legible de un vistazo.

**Hecho cuando:** en Expo Go (teléfono en la misma red, `EXPO_PUBLIC_API_URL` con la IP LAN y backend con `--host 0.0.0.0`) se inicia sesión, se reporta una parálisis, se abre "Qué hacer" automáticamente y el reporte aparece en la campana de la web en ≤ 15 s; tag `fase-6`.

### Fase 7 — App móvil: Tareas y Bitácora de emociones
**Objetivo:** completar las otras dos pestañas.
- **Tareas:** `TaskCard` en acordeón (una abierta a la vez). Al abrir: `MicroStepList` numerada con checkbox local por paso. Al final de la tarea, dos botones grandes **"Me sirvió 👍"** y **"No me sirvió 👎"** con estado seleccionado visible; volver a tocar quita la selección. Pull-to-refresh.
- **Emociones:** pregunta "¿Cómo te sientes ahora?" + `EmotionGrid` 2 columnas con emoji grande y nombre. Toque → registra + vibración + snackbar con **Deshacer** (5 s). Debajo, texto pequeño "Último registro: Calma, 14:32".
- Estados vacíos y errores según la guía.

**Hecho cuando:** el feedback de una tarea aparece en la web; una emoción registrada desde el teléfono se refleja en el gráfico de la web (filtro Día); Deshacer la elimina; tag `fase-7`.

### Fase 8 — Integración, revisión de UX y cierre del prototipo
**Objetivo:** que todo funcione de punta a punta y sea fácil de demostrar.
- Recorre el **guion de demo** completo y corrige lo que falle:
  1. Terapeuta inicia sesión en la web y abre a paciente1.
  2. Paciente inicia sesión en la app, registra 3 emociones, abre "Hacer la cama", da 👍.
  3. Paciente reporta una parálisis con descripción → la app muestra "Qué hacer".
  4. La web muestra el toast; el dashboard (Día) refleja emociones, KPI de parálisis y feedback.
  5. Terapeuta edita un micropaso y un consejo → la app los ve al refrescar.
- Revisa la app contra los 11 puntos de la sección 6 y deja el resultado (cumple / ajustado) en `docs/UX_BAJA_FRICCION.md`.
- Limpieza: elimina código muerto, `console.log`, TODOs resueltos; revisa que no haya secretos commiteados.
- `README.md` final: requisitos, cómo levantar backend, web y app en Windows, credenciales demo, guion de demo, capturas de pantalla opcionales en `docs/`.
- Actualiza `docs/PROGRESS.md` con un resumen final y una lista de "Ideas para después del prototipo" (sin implementarlas).

**Hecho cuando:** alguien sin contexto puede clonar el repo, seguir el README y correr la demo; tag `fase-8`.

---

## 9. Estado de las fases

| Fase | Descripción | Estado |
|---|---|---|
| 1 | Fundaciones + esqueleto backend | ✅ |
| 2 | API completa + tests | ✅ |
| 3 | Web: base, login, pacientes | ⬜ |
| 4 | Web: dashboard emociones + KPIs | ⬜ |
| 5 | Web: tareas, micropasos, consejos | ⬜ |
| 6 | App: base, diseño, parálisis, Qué hacer | ⬜ |
| 7 | App: tareas y emociones | ⬜ |
| 8 | Integración, UX, cierre | ⬜ |

(Cambia ⬜ por ✅ al completar la fase.)
