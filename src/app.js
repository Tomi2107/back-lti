import { env } from './config/env.js'
import Lti from 'ltijs'
import accessibilityRoutes from './routes/accessibility.js'

// ─── Configurar ltijs ─────────────────────────────────────────────────────────
Lti.setup(
  env.ltiKey,
  { url: env.mongodbUri },
  {
    appUrl: env.appUrl,
    devMode: env.isDev, // desactiva HTTPS en local; NUNCA en producción
    cookies: {
      secure: !env.isDev,      // HTTPS obligatorio en producción
      sameSite: env.isDev ? 'Lax' : 'None', // 'None' necesario para iframes LTI
    },
    cors: env.allowedOrigins.length ? env.allowedOrigins : false,
    ltiaas: false,
  },
)

// ─── Callback de lanzamiento exitoso ─────────────────────────────────────────
Lti.onConnect(async (token, req, res) => {
  // token contiene user, roles, context, etc.
  // Aquí puedes redirigir al frontend con el idToken o servir HTML directamente
  return res.json({ launched: true, user: token?.user })
})

// ─── Callback de Deep Linking ─────────────────────────────────────────────────
Lti.onDeepLinking(async (token, req, res) => {
  return Lti.DeepLinking.createDeepLinkingMessage(res, [], { message: 'Deep linking no configurado aún.' })
})

// ─── Iniciar servidor ─────────────────────────────────────────────────────────
export const startServer = async () => {
  await Lti.deploy({ port: env.port })

  // Registrar rutas en la app Express interna de ltijs
  Lti.app.use('/api/accessibility', accessibilityRoutes)

  // Registrar plataforma si aún no existe
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
