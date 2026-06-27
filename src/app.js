import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'
import express from 'express'
import jwt from 'jsonwebtoken'
import { env } from './config/env.js'
import { connectDatabase } from './config/database.js'
import Lti from 'ltijs'
import { tokenMiddleware } from './middleware/tokenMiddleware.js'
import preferencesRoutes from './routes/preferences.js'
import aiRoutes from './routes/ai.js'
import courseRoutes from './routes/course.js'
import progressRoutes from './routes/progress.js'

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

// ─── Inyecta el token JWT en el HTML para que el frontend lo use ──────────────
function buildToolHtml(accessToken) {
  const html = readFileSync(join(__dirname, '../views/tool.html'), 'utf-8')
  return html.replace(
    '</head>',
    `<script>window.__A11Y_TOKEN__ = ${JSON.stringify(accessToken)};</script></head>`
  )
}

// ─── Lanzamiento LTI exitoso → genera JWT y sirve el panel ───────────────────
Lti.onConnect(async (token, req, res) => {
  const payload = {
    userId: token.user,
    courseId: token.platformContext?.context?.id ?? null,
    moodleUrl: token.iss,
    platformUrl: token.iss,
    roles: token.platformContext?.roles ?? [],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  }
  const accessToken = jwt.sign(payload, env.moodleSharedSecret, { algorithm: 'HS256' })
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

  // Panel desde el botón flotante (JWT en query param, generado por launch.php)
  Lti.app.get('/tool', (req, res) => {
    const token = req.query.token
    if (!token) return res.status(400).send('Token requerido.')
    try {
      jwt.verify(token, env.moodleSharedSecret, { algorithms: ['HS256'] })
      return res.send(buildToolHtml(token))
    } catch {
      return res.status(401).send('Token inválido o expirado.')
    }
  })

  // API protegida por JWT Bearer (ambos flujos: LTI y botón flotante)
  Lti.app.use('/api/preferences', tokenMiddleware, preferencesRoutes)
  Lti.app.use('/api/ai', tokenMiddleware, aiRoutes)
  Lti.app.use('/api/course', tokenMiddleware, courseRoutes)
  Lti.app.use('/api/progress', tokenMiddleware, progressRoutes)

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
