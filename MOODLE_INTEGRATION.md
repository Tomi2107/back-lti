# Integración con Moodle

Hay dos mecanismos de integración que funcionan en paralelo:

| Mecanismo | Cómo accede el alumno | Cuándo usar |
|---|---|---|
| **Plugin local** (`local_accessibility`) | Botón flotante en todas las páginas | Siempre visible en el aula |
| **Actividad LTI** | El docente incrusta la herramienta en un curso | Acceso puntual desde una actividad |

Ambos terminan en el mismo backend y el mismo frontend. No son excluyentes.

---

## Parte 1 — Desplegar el backend

El backend debe ser accesible desde Moodle por HTTPS.

```
APP_URL=https://a11y-api.tudominio.com
```

Endpoints que Moodle va a necesitar alcanzar:

| Propósito | URL |
|---|---|
| Lanzamiento LTI | `https://a11y-api.tudominio.com/lti` |
| OIDC Login (inicio de autenticación) | `https://a11y-api.tudominio.com/login` |
| Claves públicas (JWKS) | `https://a11y-api.tudominio.com/keys` |

---

## Parte 2 — Registrar la herramienta LTI en Moodle

Esto habilita el flujo LTI 1.3 completo (actividad en curso).

### 2.1 Crear la herramienta externa en Moodle

1. Ir a **Administración del sitio → Plugins → Módulos de actividad → Herramienta externa → Gestionar herramientas**
2. Hacer clic en **"Configurar una herramienta manualmente"**
3. Completar:

| Campo en Moodle | Valor |
|---|---|
| Nombre de la herramienta | `Herramientas de Accesibilidad` |
| URL de la herramienta | `https://a11y-api.tudominio.com/lti` |
| Versión LTI | `LTI 1.3` |
| Tipo de clave pública | `Conjunto de claves URL` |
| URL del conjunto de claves públicas | `https://a11y-api.tudominio.com/keys` |
| URL de inicio de sesión | `https://a11y-api.tudominio.com/login` |
| URI(s) de redirección | `https://a11y-api.tudominio.com/lti` |

4. Guardar. Moodle genera un **Client ID** — copiarlo.

### 2.2 Obtener los datos de Moodle para el backend

Desde esa misma pantalla (o desde la configuración de la herramienta creada) Moodle expone:

| Variable `.env` | Valor de Moodle |
|---|---|
| `PLATFORM_URL` | URL base de Moodle (ej. `https://moodle.tudominio.com`) |
| `PLATFORM_CLIENT_ID` | Client ID generado en el paso anterior |
| `PLATFORM_AUTH_ENDPOINT` | `https://moodle.tudominio.com/mod/lti/auth.php` |
| `PLATFORM_TOKEN_ENDPOINT` | `https://moodle.tudominio.com/mod/lti/token.php` |
| `PLATFORM_KEYSET_ENDPOINT` | `https://moodle.tudominio.com/mod/lti/certs.php` |

Completar el `.env` del backend con estos valores y reiniciar el servidor.

### 2.3 Agregar la herramienta a un curso (opcional)

Si además del botón flotante quieren que la herramienta aparezca como actividad dentro de un curso:

1. En el curso → **Añadir una actividad → Herramienta externa**
2. Seleccionar `Herramientas de Accesibilidad`
3. Guardar

---

## Parte 3 — Instalar el plugin del botón flotante

El plugin `local_accessibility` inyecta el botón flotante (FAB) en **todas las páginas de Moodle** sin que el docente tenga que hacer nada por curso.

### 3.1 Copiar el plugin al servidor Moodle

```bash
cp -r moodle-plugin/local_accessibility /var/www/moodle/local/accessibility
```

### 3.2 Ejecutar la instalación

Acceder como administrador a Moodle. Moodle detecta el nuevo plugin y muestra la pantalla de instalación. Hacer clic en **"Actualizar la base de datos de Moodle ahora"**.

### 3.3 Configurar el plugin

Ir a **Administración del sitio → Plugins → Plugins locales → Herramientas de Accesibilidad LTI**

| Campo | Valor |
|---|---|
| URL de la herramienta | `https://a11y-api.tudominio.com` |
| Secreto compartido | Mismo valor que `MOODLE_SHARED_SECRET` en el `.env` del backend |
| Token del servicio web | *(ver Parte 4)* |

---

## Parte 4 — Crear el servicio web en Moodle

El backend necesita un token para consultar la API REST de Moodle (estructura del curso, progreso).

### 4.1 Activar servicios web

1. **Administración del sitio → Funciones avanzadas** → activar **"Habilitar servicios web"**
2. **Administración del sitio → Plugins → Servicios web → Protocolos** → activar **REST**

### 4.2 Crear el servicio

1. Ir a **Administración del sitio → Plugins → Servicios web → Servicios externos**
2. Hacer clic en **"Añadir"**
3. Nombre: `Accessibility Tool`, activado: sí, solo usuarios autorizados: sí
4. Guardar y luego entrar al servicio → **"Añadir funciones"**:

| Función | Para qué se usa |
|---|---|
| `core_course_get_contents` | Panel de navegación del curso |
| `core_completion_get_activities_completion_status` | Progreso del alumno |

### 4.3 Generar el token

1. **Administración del sitio → Plugins → Servicios web → Gestionar tokens**
2. **"Crear token"** → Usuario: administrador (o usuario de servicio dedicado) → Servicio: `Accessibility Tool`
3. Copiar el token generado → pegarlo en:
   - Campo **"Token del servicio web"** en la configuración del plugin
   - Variable `MOODLE_SERVICE_TOKEN` en el `.env` del backend

---

## Parte 5 — Verificar la integración

### Checklist

- [ ] Backend corriendo en HTTPS y accesible desde Moodle
- [ ] `GET https://a11y-api.tudominio.com/ping` devuelve `{ "ok": true }`
- [ ] `GET https://a11y-api.tudominio.com/keys` devuelve un JSON con claves públicas
- [ ] Plugin instalado y visible en `/local/accessibility/`
- [ ] Configuración del plugin guardada (toolurl + sharedsecret + servicetoken)
- [ ] Variables de entorno del backend completas (PLATFORM_*, MOODLE_*, ANTHROPIC_*)
- [ ] Al entrar a cualquier página de Moodle se ve el botón flotante ♿
- [ ] Al hacer clic en el botón → redirige al frontend con `?token=`
- [ ] El frontend puede llamar a `GET /api/v1/users/me` con el token y obtener respuesta `200`

---

## Resumen de variables de entorno necesarias

```env
# Backend
APP_URL=https://a11y-api.tudominio.com
FRONTEND_URL=https://front.tudominio.com

# Moodle (se obtienen al registrar la herramienta LTI)
PLATFORM_URL=https://moodle.tudominio.com
PLATFORM_NAME=Mi Moodle
PLATFORM_CLIENT_ID=<generado por Moodle>
PLATFORM_AUTH_ENDPOINT=https://moodle.tudominio.com/mod/lti/auth.php
PLATFORM_TOKEN_ENDPOINT=https://moodle.tudominio.com/mod/lti/token.php
PLATFORM_KEYSET_ENDPOINT=https://moodle.tudominio.com/mod/lti/certs.php

# Compartido entre backend y plugin de Moodle
MOODLE_SHARED_SECRET=<mismo valor en backend y en ajustes del plugin>

# Token REST de Moodle
MOODLE_SERVICE_TOKEN=<generado en Gestionar tokens de Moodle>

# IA
ANTHROPIC_API_KEY=sk-ant-...

# Base de datos
MONGODB_URI=mongodb://...
LTI_KEY=<64 chars hex aleatorios>
```
