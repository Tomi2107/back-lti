# API — LTI Accessibility Backend

**Base URL:** `/api/v1`
**Auth:** Todos los endpoints requieren `Authorization: Bearer <token>` (JWT emitido por el backend tras el handshake LTI o el flujo de botón flotante).

---

## Flujo de autenticación

El usuario **nunca ve una pantalla de login**. La autenticación es transparente via Moodle.

### Flujo LTI (actividad incrustada)
```
Moodle → POST /lti (manejado por ltijs)
       → backend hace upsert del usuario + crea sesión
       → 302 redirect a FRONTEND_URL?token=<jwt>
```

### Flujo botón flotante
```
Moodle → launch.php valida sesión Moodle → genera JWT pre-firmado
       → GET /tool?token=<jwt>
       → backend valida + hace upsert del usuario + crea sesión
       → 302 redirect a FRONTEND_URL?token=<jwt-con-session_id>
```

El JWT contiene: `moodle_user_sub`, `session_id`, `moodle_course_id`, `moodleUrl`.

---

## Health check

### `GET /ping`
Verifica que el servidor está activo. No requiere autenticación.

**Response `200`**
```json
{ "ok": true, "timestamp": 1719619200000 }
```

---

## Usuarios

### `GET /api/v1/users/me`
Retorna el perfil y preferencias de accesibilidad del usuario autenticado. El frontend lo llama al montar el panel para rehidratar el estado visual.

**Response `200`**
```json
{
  "moodle_user_sub": "123",
  "accessibility_settings": {
    "contrast_mode": "normal",
    "font_size": 16,
    "font_family": "Arial"
  },
  "onboarding_completed": false,
  "created_at": "2026-06-29T10:00:00.000Z",
  "updated_at": "2026-06-29T10:00:00.000Z"
}
```

---

### `PATCH /api/v1/users/me/accessibility`
Actualiza las preferencias visuales del usuario. Se llama cada vez que el alumno cambia un control del panel.

**Body** (todos los campos son opcionales)
```json
{
  "contrast_mode": "normal" | "dark" | "high-contrast",
  "font_size": 16,
  "font_family": "Arial" | "OpenDyslexic" | "Verdana"
}
```

**Response `200`**
```json
{
  "accessibility_settings": {
    "contrast_mode": "high-contrast",
    "font_size": 20,
    "font_family": "OpenDyslexic"
  },
  "updated_at": "2026-06-29T10:05:00.000Z"
}
```

---

### `PATCH /api/v1/users/me/onboarding`
Marca el tutorial inicial como completado. Se llama una sola vez al cerrar el onboarding.

**Body**
```json
{ "onboarding_completed": true }
```

**Response `200`**
```json
{ "onboarding_completed": true }
```

---

## Cursos — Navegación

### `GET /api/v1/courses/:course_id/structure`
Retorna la estructura del curso (secciones y actividades) para construir el panel de navegación accesible. Llama a Moodle con `core_course_get_contents` y cachea el resultado por 24 horas en `MoodleCourseCache`.

**Params**
| Nombre | Tipo | Descripción |
|---|---|---|
| `course_id` | String | ID del curso en Moodle |

**Response `200`**
```json
{
  "course_id": "567",
  "modules": [
    {
      "id": "101",
      "name": "Unidad 1 — Introducción",
      "activities": [
        {
          "activity_id": "892",
          "name": "TP1 — Análisis de caso",
          "type": "assign",
          "visible": true,
          "url": "https://moodle.example.com/mod/assign/view.php?id=892"
        }
      ]
    }
  ]
}
```

---

## Contenido

### `GET /api/v1/content/:activity_id`
Retorna el contenido HTML limpio de una actividad. Consulta `MoodleCourseCache` primero; si el contenido expiró (más de 24 horas) o no existe, llama a Moodle y lo almacena. Usado por lectura asistida (TTS) y por el endpoint de IA.

**Params**
| Nombre | Tipo | Descripción |
|---|---|---|
| `activity_id` | String | ID del módulo/actividad en Moodle |

**Response `200`**
```json
{
  "activity_id": "892",
  "content_text_raw": "<p>Consigna del TP...</p>",
  "cached": true,
  "updated_at": "2026-06-29T08:00:00.000Z"
}
```

---

## IA — Resumen, Simplificación y Conceptos Clave

### `POST /api/v1/ai/process/:activity_id`
Endpoint central de IA. Calcula SHA-256 del texto recibido y consulta `AiCache`. Si hay coincidencia responde de inmediato (latencia cero). Si no, llama a **Claude Haiku 4.5** (Anthropic), cachea el resultado y responde. El caché se invalida automáticamente si el contenido de la actividad cambia (el hash cambia).

**Params**
| Nombre | Tipo | Descripción |
|---|---|---|
| `activity_id` | String | ID de la actividad asociada al texto |

**Body**
```json
{
  "mode": "summary" | "simplify" | "key_concepts",
  "text": "Texto de la consigna o contenido a procesar..."
}
```

| Mode | Descripción |
|---|---|
| `summary` | Resume el texto en 3-5 oraciones |
| `simplify` | Reescribe el texto con lenguaje sencillo |
| `key_concepts` | Lista los 5-8 conceptos clave con definición breve |

**Response `200`**
```json
{
  "activity_id": "892",
  "mode": "summary",
  "result": "Esta actividad consiste en analizar un caso práctico...",
  "from_cache": false
}
```

---

## Progreso y Pendientes

### `GET /api/v1/progress`
Retorna todas las actividades rastreadas del alumno, con el porcentaje de completitud. Alimenta el checklist y la barra de progreso del panel.

**Query params**
| Nombre | Tipo | Descripción |
|---|---|---|
| `course_id` | String | *(Opcional)* ID del curso para filtrar |

**Response `200`**
```json
{
  "course_id": "567",
  "completion_percentage": 40,
  "items": [
    {
      "moodle_activity_id": "892",
      "status": "IN_PROGRESS",
      "due_date": "2026-07-15T23:59:00.000Z",
      "last_interaction_timestamp": "2026-06-29T09:30:00.000Z"
    },
    {
      "moodle_activity_id": "893",
      "status": "COMPLETED",
      "due_date": null,
      "last_interaction_timestamp": "2026-06-28T14:00:00.000Z"
    }
  ]
}
```

---

### `PATCH /api/v1/progress/:activity_id`
Actualiza el estado de una actividad cuando el alumno interactúa con el checklist. Registra automáticamente `last_interaction_timestamp`.

**Params**
| Nombre | Tipo | Descripción |
|---|---|---|
| `activity_id` | String | ID de la actividad en Moodle |

**Body**
```json
{ "status": "PENDING" | "IN_PROGRESS" | "COMPLETED" }
```

**Response `200`**
```json
{
  "moodle_activity_id": "892",
  "status": "COMPLETED",
  "last_interaction_timestamp": "2026-06-29T10:10:00.000Z"
}
```

---

### `GET /api/v1/progress/suggestions`
Devuelve una lista priorizada de actividades pendientes o en progreso. Ordena por `due_date` ascendente (más urgente primero) y `last_interaction_timestamp` descendente (última visitada primero). Alimenta el dashboard "Retomar / Próximos pasos".

**Query params**
| Nombre | Tipo | Descripción |
|---|---|---|
| `course_id` | String | *(Opcional)* ID del curso |
| `limit` | Number | *(Opcional)* Máximo de resultados. Default: `5`, máximo: `20` |

**Response `200`**
```json
{
  "suggestions": [
    {
      "moodle_activity_id": "892",
      "status": "IN_PROGRESS",
      "due_date": "2026-07-15T23:59:00.000Z",
      "priority": 1
    },
    {
      "moodle_activity_id": "895",
      "status": "PENDING",
      "due_date": "2026-07-20T23:59:00.000Z",
      "priority": 2
    }
  ]
}
```

---

## Telemetría

### `POST /api/v1/events`
Registra una acción del usuario en `EventLog`. El `session_id` lo resuelve el backend desde el JWT — el frontend **nunca lo envía**.

**Body**
```json
{
  "event_type": "SESSION_START" | "ACCESSIBILITY_CHANGED" | "TTS_INTERACTION" | "AI_COGNITIVE_REQUEST" | "TASK_COMPLETED",
  "payload": { "feature": "font_size", "value": "20" },
  "resultado": "SUCCESS" | "FAILED" | "CANCELLED"
}
```

| Evento | Cuándo enviarlo |
|---|---|
| `SESSION_START` | Al montar el panel por primera vez |
| `ACCESSIBILITY_CHANGED` | Al cambiar contraste, fuente o tamaño |
| `TTS_INTERACTION` | Al iniciar o detener la lectura en voz alta |
| `AI_COGNITIVE_REQUEST` | Al solicitar resumen, simplificación o conceptos clave |
| `TASK_COMPLETED` | Al marcar una actividad como completada en el checklist |

**Response `201`**
```json
{
  "event_id": "550e8400-e29b-41d4-a716-446655440000",
  "session_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "timestamp": "2026-06-29T10:15:00.000Z"
}
```

---

## Colecciones MongoDB

| Colección | Descripción |
|---|---|
| `users` | Perfil y preferencias visuales del alumno |
| `sessions` | Una sesión por apertura del panel (con `user_agent` y timestamps) |
| `eventlogs` | Log transaccional de cada acción del usuario |
| `moodlecoursecaches` | Caché de contenido de Moodle (TTL 24h) |
| `aicaches` | Caché de resultados de IA por hash SHA-256 del texto |
| `userprogresses` | Estado de actividades por alumno (PENDING / IN_PROGRESS / COMPLETED) |

---

## Tabla resumen de endpoints

| Método | Ruta | Función |
|---|---|---|
| `GET` | `/ping` | Health check |
| `GET` | `/api/v1/users/me` | Perfil y preferencias del usuario |
| `PATCH` | `/api/v1/users/me/accessibility` | Actualizar ajustes visuales |
| `PATCH` | `/api/v1/users/me/onboarding` | Marcar tutorial como completado |
| `GET` | `/api/v1/courses/:course_id/structure` | Estructura del curso para navegación |
| `GET` | `/api/v1/content/:activity_id` | Contenido HTML de una actividad |
| `POST` | `/api/v1/ai/process/:activity_id` | Resumen / Simplificación / Conceptos clave |
| `GET` | `/api/v1/progress` | Checklist y porcentaje de completitud |
| `PATCH` | `/api/v1/progress/:activity_id` | Actualizar estado de una actividad |
| `GET` | `/api/v1/progress/suggestions` | Actividades sugeridas (Retomar / Próximos pasos) |
| `POST` | `/api/v1/events` | Registrar evento de telemetría |
