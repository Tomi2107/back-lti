import 'dotenv/config'

const required = [
  'LTI_KEY',
  'DATABASE_URL',
  'PG_DATABASE',
  'PG_USER',
  'PG_PASSWORD',
  'PG_HOST',
  'APP_URL',
  'PLATFORM_URL',
  'PLATFORM_CLIENT_ID',
  'PLATFORM_AUTH_ENDPOINT',
  'PLATFORM_TOKEN_ENDPOINT',
  'PLATFORM_KEYSET_ENDPOINT',
]

const missing = required.filter((key) => !process.env[key])
if (missing.length) {
  console.error(`[config] Variables de entorno faltantes: ${missing.join(', ')}`)
  console.error('[config] Copia .env.example a .env y completa los valores.')
  process.exit(1)
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  appUrl: process.env.APP_URL,

  ltiKey: process.env.LTI_KEY,

  // Postgres — usado por Prisma (DATABASE_URL) y por ltijs-sequelize (PG_*)
  databaseUrl: process.env.DATABASE_URL,
  pg: {
    database: process.env.PG_DATABASE,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    host: process.env.PG_HOST,
    port: parseInt(process.env.PG_PORT || '5432', 10),
  },

  frontendUrl: process.env.FRONTEND_URL || '',

  moodleSharedSecret: process.env.MOODLE_SHARED_SECRET || 'change_me_insecure_default',
  moodleServiceToken: process.env.MOODLE_SERVICE_TOKEN || '',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',

  allowedOrigins: (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),

  platform: {
    url: process.env.PLATFORM_URL,
    name: process.env.PLATFORM_NAME || 'LMS Platform',
    clientId: process.env.PLATFORM_CLIENT_ID,
    authEndpoint: process.env.PLATFORM_AUTH_ENDPOINT,
    tokenEndpoint: process.env.PLATFORM_TOKEN_ENDPOINT,
    keysetEndpoint: process.env.PLATFORM_KEYSET_ENDPOINT,
  },
}
