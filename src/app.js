import { randomUUID } from 'crypto'
import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import { env } from './config/env.js'
import { connectDatabase } from './config/database.js'
import { prisma } from './lib/prisma.js'
import { Provider as Lti } from 'ltijs'
import Database from 'ltijs-sequelize'
import { tokenMiddleware } from './middleware/tokenMiddleware.js'
import usersRoutes from './routes/users.js'
import coursesRoutes from './routes/courses.js'
import contentRoutes from './routes/content.js'
import aiRoutes from './routes/ai.js'
import progressRoutes from './routes/progress.js'
import eventsRoutes from './routes/events.js'

import profileRoutes from './routes/profile.js'
import notificationRoutes from './routes/notifications.js'
import focusRoutes from './routes/focus.js'
import assistantRoutes from './routes/assistant.js'
import accessibilityRoutes from './routes/accessibility.js'
import dashboardRoutes from './routes/dashboardRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';


import os from 'node:os'

const corsOptions = {
  origin(origin, callback) {

    const allowed = [
      'https://traitor-caucus-hunchback.ngrok-free.dev',
      'https://elliott-pit-titled-archives.trycloudflare.com',
      'https://probable-exposable-polio.ngrok-free.dev'
    ].filter(Boolean);

    console.log("Origin recibido:", origin);
    console.log("Permitidos:", allowed);

    if (!origin || allowed.includes(origin)) {
      return callback(null, true);
    }

    console.warn("CORS bloqueado:", origin);

    return callback(new Error("CORS bloqueado"));
  },

  methods: [
    "GET",
    "POST",
    "PATCH",
    "OPTIONS"
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization"
  ],

  credentials: true
};
// ─── ltijs-sequelize: base de datos interna de LTI (plataformas, tokens, etc.) ─
const ltiDb = new Database(env.pg.database, env.pg.user, env.pg.password, {
  host: env.pg.host,
  port: env.pg.port,
  dialect: 'postgres',
  logging: false,
})

// ─── Configura ltijs ──────────────────────────────────────────────────────────
Lti.setup(
  env.ltiKey,
  { plugin: ltiDb },
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

Lti.app.use(cors(corsOptions));
Lti.app.use(express.json())

// Rutas sin auth — insertadas al frente del stack antes del middleware de ltijs
Lti.app.use('/ping', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({ ok: true, timestamp: Date.now() }))
})

Lti.app.get('/config', (req, res) => {

  res.setHeader('Content-Type', 'application/json');

  res.end(JSON.stringify({
    tool: 'FARO',
    version: '1.0',
    features: {
      reading: true,
      contrast: true,
      profiles: true,
      summary: true
    }
  }));

});

Lti.app._router.stack.unshift(Lti.app._router.stack.pop())

if ((process.env.NODE_ENV || 'development') === 'development') {
  Lti.app.post('/dev/token', express.json(), async (req, res) => {
    const { moodle_user_sub = 'qa-user', moodle_course_id = '1', moodleUrl = 'http://localhost' } = req.body ?? {}
    const token = await createSessionJwt(moodle_user_sub, moodle_course_id, moodleUrl, 'QA/dev', null)
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ token, note: 'Token de desarrollo — no usar en producción' }))
  })
  Lti.app._router.stack.unshift(Lti.app._router.stack.pop())
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function extractIp(req) {
  const forwarded = req.headers['x-forwarded-for']
  return (forwarded ? forwarded.split(',')[0] : req.ip ?? '').trim() || null
}

async function createSessionJwt(
  moodle_user_sub,
  moodle_course_id,
  moodleUrl,
  userAgent,
  ipAddress
) {

  const user = await prisma.user.upsert({

  where: {
    moodle_user_sub
  },

  update: {},

  create: {
    moodle_user_sub
  }

})

console.log("Usuario LTI:", user)

const profile = await prisma.accessibilityProfile.upsert({

  where: {
    userId_name: {
      userId: user.id,
      name: "default"
    }
  },

  update: {},

  create: {

    userId: user.id,

    name: "default",

    settings: {

      contrast_mode: false,
      dark_mode: false,

      font_family: "default",
      font_size: "normal",
      alignment: "left",

      brightness: 50,
      contrast: 50,
      saturation: 50,

      grayscale: false,

      voice: false,
      voice_speed: 50,
      voice_volume: 100

    }

  }

})

console.log("Perfil creado/encontrado:", profile)

const session_id = randomUUID()

await prisma.session.create({

  data: {

    session_id,

    moodle_user_sub,

    moodle_course_id: moodle_course_id ?? null,

    user_agent: userAgent ?? "",

    ip_address: ipAddress ?? null

  }

})

return jwt.sign(

  {

    moodle_user_sub,

    session_id,

    moodle_course_id,

    moodleUrl

  },

  env.moodleSharedSecret,

  {

    algorithm: "HS256",

    expiresIn: "24h"

  }

)
}
// ─── Lanzamiento LTI: crea sesión y redirige al frontend con el JWT ───────────
Lti.onConnect(async (token, req, res) => {
  const moodle_user_sub = String(token.user)
  const moodle_course_id = token.platformContext?.context?.id
    ? String(token.platformContext.context.id)
    : null

  const accessToken = await createSessionJwt(
    moodle_user_sub,
    moodle_course_id,
    token.iss,
    req.headers['user-agent'],
    extractIp(req)
  )

  return res.redirect(`${env.frontendUrl}?token=${encodeURIComponent(accessToken)}`)
})

// ─── Deep Linking ─────────────────────────────────────────────────────────────
Lti.onDeepLinking(async (token, req, res) => {
  return Lti.DeepLinking.createDeepLinkingMessage(res, [], { message: 'Deep linking no configurado aún.' })
})

// ─── Iniciar servidor ─────────────────────────────────────────────────────────
export const startServer = async () => {
  await connectDatabase();

  // ============================================================
  // EXPRESS - Plugin local Moodle
  // ============================================================

  const app = express();
  app.disable('x-powered-by');

  app.use(express.json());
  app.use(cors(corsOptions));

  // ------------------------------------------------------------
  // POST /tool/token
  // ------------------------------------------------------------
  app.post('/tool/token', async (req, res) => {

    console.log("ENTRO A TOOL TOKEN");

    const {
      moodle_user_sub,
      moodle_course_id,
      moodleUrl
    } = req.body || {};

    if (!moodle_user_sub) {
      return res.status(400).json({
        error: 'moodle_user_sub requerido.'
      });
    }

    try {

      const sessionToken = await createSessionJwt(
        String(moodle_user_sub),
        moodle_course_id ?? null,
        moodleUrl ?? null,
        req.headers['user-agent'],
        extractIp(req)
      );

      return res.json({
        session_token: sessionToken,
        frontend_url: env.frontendUrl
      });

    } catch(e){

    console.error("ERROR CREANDO SESION:", e)

    return res.status(500).json({
      error:"No se pudo crear la sesión.",
      detalle:e.message
    })

    }

  });
// ------------------------------------------------------------
// API REST
// ------------------------------------------------------------

  const v1 = express.Router();

  v1.use('/dashboard', dashboardRoutes);

  v1.use('/analytics', analyticsRoutes);


  // Middleware JWT FARO
  v1.use(tokenMiddleware);


  // Usuarios
  v1.use('/users', usersRoutes);


  // Cursos
  v1.use('/courses', coursesRoutes);


  // Contenido
  v1.use('/content', contentRoutes);


  // IA
  v1.use('/ai', aiRoutes);


  // Progreso
  v1.use('/progress', progressRoutes);


  // Eventos
  v1.use('/events', eventsRoutes);


  // Perfil
  v1.use('/profile', profileRoutes);


  // Notificaciones
  v1.use('/notifications', notificationRoutes);


  // Focus
  v1.use('/focus', focusRoutes);


  // Asistente
  v1.use('/assistant', assistantRoutes);


  // Accesibilidad FARO
  v1.use('/users', accessibilityRoutes);

  // Montar API completa
  app.use('/api/v1', v1);


  // -----
  // 
  // -------------------------------------------------------
  // Health
  // ------------------------------------------------------------

  app.get('/health', async (req, res) => {

    const report = {
      backend: 'OK',
      timestamp: new Date().toISOString(),
      checks: {}
    };

    report.checks.env = {
      APP_URL: !!env.appUrl,
      DATABASE_URL: !!env.databaseUrl,
      LTI_KEY: !!env.ltiKey,
      MOODLE_SHARED_SECRET: !!env.moodleSharedSecret,
      FRONTEND_URL: !!env.frontendUrl
    };

    try {

      await prisma.$queryRaw`SELECT 1`;

      report.checks.database = "OK";

      report.checks.prisma = {
        users: await prisma.user.count(),
        sessions: await prisma.session.count()
      };

    } catch (e) {

      report.checks.database = e.message;

    }

    report.checks.platform = {
      url: env.platform.url,
      clientId: env.platform.clientId
    };

    report.checks.frontend = env.frontendUrl;

    report.checks.server = {
      node: process.version,
      hostname: os.hostname()
    };

    res.json(report);

  });

  app.listen(env.port, () => {
    console.log(`[Plugin] API REST escuchando en puerto ${env.port}`);
  });

  // ============================================================
  // LTIJS - Herramienta LTI
  // ============================================================

  Lti.app.get('/tool', async (req, res) => {

    const rawToken = req.query.token;

    if (!rawToken)
      return res.status(400).json({ error: 'Token requerido.' });

    let payload;

    try {

      payload = jwt.verify(
        rawToken,
        env.moodleSharedSecret,
        { algorithms: ['HS256'] }
      );

    } catch {

      return res.status(401).json({
        error: 'Token inválido o expirado.'
      });

    }

    const accessToken = await createSessionJwt(
      String(payload.moodle_user_sub),
      payload.moodle_course_id ?? null,
      payload.moodleUrl ?? null,
      req.headers['user-agent'],
      extractIp(req)
    );

    return res.redirect(
      `${env.frontendUrl}?token=${encodeURIComponent(accessToken)}`
    );

  });

  await Lti.deploy({
    port: env.port + 1
  });

  await registerPlatformIfNeeded();

  console.log(`[LTI] Herramienta iniciada`);
  console.log(`[LTI] URL: ${env.appUrl}`);
  console.log(`[Plugin] API: puerto ${env.port}`);
}

async function registerPlatformIfNeeded() {
  const { platform } = env;

  const existing = await Lti.getPlatform(
    platform.url,
    platform.clientId
  ).catch(() => null);

  if (existing) {
    console.log(`[app] Plataforma ya registrada: ${platform.name}`);
    return;
  }

  await Lti.registerPlatform({
    url: platform.url,
    name: platform.name,
    clientId: platform.clientId,
    authenticationEndpoint: platform.authEndpoint,
    accesstokenEndpoint: platform.tokenEndpoint,
    authConfig: {
      method: 'JWK_SET',
      key: platform.keysetEndpoint
    }
  });

  console.log(`[app] Plataforma registrada: ${platform.name}`);
}