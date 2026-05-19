import { startServer } from './src/app.js'

startServer().catch((err) => {
  console.error('[fatal] Error al iniciar el servidor:', err)
  process.exit(1)
})

// Graceful shutdown para Docker / cloud
const shutdown = () => {
  console.log('[app] Cerrando servidor...')
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
