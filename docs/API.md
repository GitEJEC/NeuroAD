# API — NeuroAD

Base: `http://localhost:8000`. Swagger interactivo en `/docs` (botón **Authorize** → pega el token).

## Convenciones
- Auth: `Authorization: Bearer <access_token>` (JWT, expira en 7 días).
- Fechas: ISO 8601 en **UTC** (`2026-11-22T18:23:57.572276Z`). Los frontends las muestran en `America/Santiago`.
- `range` (query): `day` = hoy desde 00:00 hora de Santiago · `week` = últimos 7 días · `month` = últimos 30 días. Por defecto `week`.
- Listas de tareas y consejos ordenadas por `position`. Al crear, `position` = última + 1.
- Errores: `{"detail": "<mensaje en español>"}`.

| Código | Cuándo |
|---|---|
| 401 | Sin token, token inválido/expirado, o login incorrecto |
| 403 | Rol equivocado (paciente en endpoint de terapeuta o al revés) |
| 404 | Recurso no existe **o no es tuyo** (terapeuta con paciente ajeno, paciente con dato de otro) |
| 409 | Deshacer emoción con más de 2 minutos |
| 422 | Body o query inválidos (emoción desconocida, título vacío, sin micropasos, `range` inválido) |

---

## Comunes

### `POST /auth/login`
```json
// request
{"email": "terapeuta@neuroad.cl", "password": "demo1234"}
// 200
{"access_token": "eyJhbGciOi...", "token_type": "bearer",
 "user": {"id": 1, "email": "terapeuta@neuroad.cl", "full_name": "Camila Rojas", "role": "therapist", "therapist_id": null}}
```
401 → `{"detail": "Correo o contraseña incorrectos"}`

### `GET /auth/me`
200 → el mismo objeto `user` de arriba.

### `GET /emotions` (sin auth)
```json
[{"key": "alegria", "label": "Alegría", "emoji": "😊", "color": "#F2B705"}, ...]  // 10 emociones
```

### `GET /health`
`{"status": "ok"}`

---

## Paciente (rol `patient`)

### `POST /me/paralysis`
Sin body. Registra la hora del toque. **201** → `{"id": 6}`

### `PATCH /me/paralysis/{id}`
```json
// request
{"description": "No supe por dónde partir"}
// 200
{"id": 6, "patient_id": 2, "pressed_at": "2026-11-22T19:23:22.541596Z",
 "description": "No supe por dónde partir", "seen_by_therapist": false}
```
Texto vacío o `null` deja `description` en `null`.

### `GET /me/tasks`
```json
[{"id": 1, "patient_id": 2, "title": "Hacer la cama", "position": 0,
  "feedback": null, "feedback_at": null,
  "created_at": "2026-11-22T18:23:57Z", "updated_at": "2026-11-22T18:23:57Z",
  "steps": ["Quitar todo lo que esté encima de la cama.", "Ajusta la base: ..."]}]
```

### `PUT /me/tasks/{id}/feedback`
```json
// request: "like" | "dislike" | null (null quita el feedback)
{"value": "like"}
```
200 → la tarea con `feedback` y `feedback_at` actualizados (`feedback_at` = `null` si `value` es `null`).

### `POST /me/emotions`
```json
{"emotion_key": "calma"}
```
**201** → `{"id": 41}`. 422 si la clave no está en `/emotions`.

### `DELETE /me/emotions/{id}`
**204** si fue creada hace menos de 2 minutos ("Deshacer"). 409 si es más antigua.

### `GET /me/tips`
```json
[{"id": 1, "patient_id": 2, "title": "Baja la vara y achica el paso", "body": "Elige solo una cosa mínima...", "position": 0}]
```

---

## Terapeuta (rol `therapist`, solo **sus** pacientes)

### `GET /patients`
Ordenados por nombre.
```json
[{"id": 2, "full_name": "Matías Soto", "email": "paciente1@neuroad.cl",
  "last_paralysis_at": "2026-11-22T18:23:57.572276Z", "unseen_count": 2},
 {"id": 3, "full_name": "Valentina Muñoz", "email": "paciente2@neuroad.cl",
  "last_paralysis_at": null, "unseen_count": 0}]
```

### `GET /patients/{id}`
200 → `{"id": 2, "email": "paciente1@neuroad.cl", "full_name": "Matías Soto", "role": "patient", "therapist_id": 1}`

### `GET /patients/{id}/emotions/summary?range=week`
Solo emociones con conteo > 0, de mayor a menor.
```json
[{"emotion_key": "calma", "count": 3}, {"emotion_key": "enojo", "count": 1}]
```

### `GET /patients/{id}/kpis?range=week`
Todo se calcula dentro del rango.
```json
{"paralysis_count": 2, "last_paralysis_at": "2026-11-22T18:23:57Z",
 "emotion_count": 9, "top_emotion": "calma", "tasks_liked": 1, "tasks_disliked": 0}
```
`last_paralysis_at` y `top_emotion` son `null` si no hay datos. 👍/👎 cuentan tareas cuyo `feedback_at` cae en el rango.

### `GET /patients/{id}/paralysis[?range=week]`
Más reciente primero. Lista de objetos como el de `PATCH /me/paralysis/{id}`.
`range` es **opcional**: sin `range` devuelve el historial completo (registro de la web); con `range` filtra como los demás.

### `GET /notifications`
Reportes **no vistos** de todos tus pacientes, más reciente primero.
```json
[{"id": 6, "patient_id": 2, "patient_name": "Matías Soto",
  "pressed_at": "2026-11-22T19:23:22Z", "description": "No supe por dónde partir"}]
```

### `PATCH /paralysis/{id}/seen`
Sin body. 200 → el reporte con `"seen_by_therapist": true`.

### Tareas
- `GET /patients/{id}/tasks` → lista como `GET /me/tasks`.
- `POST /patients/{id}/tasks` → **201** con la tarea creada.
- `PUT /patients/{id}/tasks/{task_id}` → 200. **Reemplaza la lista completa** de micropasos.
- `DELETE /patients/{id}/tasks/{task_id}` → **204** (borra también sus micropasos).
```json
// body de POST y PUT: title obligatorio, al menos 1 paso
{"title": "Lavar la loza", "steps": ["Junta los platos", "Llena el lavaplatos", "Seca y guarda"]}
```

### Consejos
- `GET /patients/{id}/tips` → lista como `GET /me/tips`.
- `POST /patients/{id}/tips` → **201** con el consejo creado.
- `PUT /patients/{id}/tips/{tip_id}` → 200. `position` es opcional: úsalo para subir/bajar (intercambia posiciones con dos PUT).
- `DELETE /patients/{id}/tips/{tip_id}` → **204**.
```json
// body de POST y PUT
{"title": "Respira", "body": "Inhala 4 segundos, exhala 6.", "position": 2}
```
