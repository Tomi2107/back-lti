import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'
import { randomUUID } from 'crypto'
import express from 'express'
import jwt from 'jsonwebtoken'
import { env } from './config/env.js'
import { connectDatabase } from './config/database.js'
import Lti from 'ltijs'
import { User } from './models/User.js'
import { Session } from './models/Session.js'
import { tokenMiddleware } from './middleware/tokenMiddleware.js'
import usersRoutes from './routes/users.js'
import coursesRoutes from './routes/courses.js'
import contentRoutes from './routes/content.js'
import aiRoutes from './routes/ai.js'
import progressRoutes from './routes/progress.js'
import eventsRoutes from './routes/events.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ─── Configura ltijs ──────────────────────────────────────────────────────────
Lti.setup(
  env.ltiKey,
  { url: env.mongodbUri },
  {
    appUrl: env.appUrl,
    devMode: env.isDev,
    cookies: {
      secure: !env.isDev,
      sameSite: env.isDev ? 'Lax' : 'None',
    },
    cors: env.allowedOrigins.length ? env.allowedOrigins : false,
    ltiaas: false,
  }
)

// ─── Upsert usuario + crear sesión → devuelve JWT firmado ─────────────────────
async function createSessionJwt(moodle_user_sub, moodle_course_id, moodleUrl, userAgent) {
  // Upsert usuario (primer acceso crea el documento)
  await User.findOneAndUpdate(
    { moodle_user_sub },
    { $setOnInsert: { moodle_user_sub } },
    { upsert: true, new: true }
  )

  // Nueva sesión por cada apertura del panel
  const session_id = randomUUID()
  await Session.create({ session_id, moodle_user_sub, moodle_course_id, user_agent: userAgent ?? '' })

  const payload = {
    moodle_user_sub,
    session_id,
    moodle_course_id,
    moodleUrl,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  }

  return jwt.sign(payload, env.moodleSharedSecret, { algorithm: 'HS256' })
}

// ─── Inyecta el token en el HTML ──────────────────────────────────────────────
function buildToolHtml(accessToken) {
  const html = readFileSync(join(__dirname, '../views/tool.html'), 'utf-8')
  return html.replace(
    '</head>',
    `<script>window.__A11Y_TOKEN__ = ${JSON.stringify(accessToken)};</script></head>`
  )
}

// ─── Lanzamiento LTI: upsert usuario, crea sesión, sirve panel ───────────────
Lti.onConnect(async (token, req, res) => {
  const moodle_user_sub = String(token.user)
  const moodle_course_id = token.platformContext?.context?.id
    ? String(token.platformContext.context.id)
    : null
  const moodleUrl = token.iss

  const accessToken = await createSessionJwt(
    moodle_user_sub,
    moodle_course_id,
    moodleUrl,
    req.headers['user-agent']
  )

  return res.send(buildToolHtml(accessToken))
})

// ─── Deep Linking ─────────────────────────────────────────────────────────────
Lti.onDeepLinking(async (token, req, res) => {
  return Lti.DeepLinking.createDeepLinkingMessage(res, [], { message: 'Deep linking no configurado aún.' })
})

// ─── Iniciar servidor ─────────────────────────────────────────────────────────
export const startServer = async () => {
  await connectDatabase()

  // Archivos estáticos — sin autenticación
  Lti.app.use('/public', express.static(join(__dirname, '../public')))

  // Health check
  Lti.app.get('/ping', (req, res) => res.json({ ok: true, timestamp: Date.now() }))

  // Panel desde botón flotante (JWT pre-firmado por launch.php → crear sesión aquí)
  Lti.app.get('/tool', async (req, res) => {
    const rawToken = req.query.token
    if (!rawToken) return res.status(400).send('Token requerido.')

    let payload
    try {
      payload = jwt.verify(rawToken, env.moodleSharedSecret, { algorithms: ['HS256'] })
    } catch {
      return res.status(401).send('Token inválido o expirado.')
    }

    // Crear sesión y generar nuevo JWT que incluye session_id
    const accessToken = await createSessionJwt(
      String(payload.moodle_user_sub),
      payload.moodle_course_id ?? null,
      payload.moodleUrl ?? null,
      req.headers['user-agent']
    )

    return res.send(buildToolHtml(accessToken))
  })

  // ─── API v1 — protegida por JWT Bearer ────────────────────────────────────
  const v1 = express.Router()
  v1.use(tokenMiddleware)
  v1.use('/users', usersRoutes)
  v1.use('/courses', coursesRoutes)
  v1.use('/content', contentRoutes)
  v1.use('/ai', aiRoutes)
  v1.use('/progress', progressRoutes)
  v1.use('/events', eventsRoutes)

  Lti.app.use('/api/v1', v1)

  await Lti.deploy({ port: env.port })

  await registerPlatformIfNeeded()

  console.log(`[app] Servidor LTI corriendo en ${env.appUrl} (puerto ${env.port})`)
  console.log(`[app] Modo: ${env.nodeEnv}`)
}

async function registerPlatformIfNeeded() {
  const { platform } = env
  const existing = await Lti.getPlatform(platform.url, platform.clientId).catch(() => null)

  if (existing) {
    console.log(`[app] Plataforma ya registrada: ${platform.name}`)
    return
  }

  await Lti.registerPlatform({
    url: platform.url,
    name: platform.name,
    clientId: platform.clientId,
    authenticationEndpoint: platform.authEndpoint,
    accesstokenEndpoint: platform.tokenEndpoint,
    authConfig: {
      method: 'JWK_SET',
      key: platform.keysetEndpoint,
    },
  })

  console.log(`[app] Plataforma registrada: ${platform.name}`)
}
