import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export const tokenMiddleware = (req, res, next) => {

  console.log('========== TOKEN MIDDLEWARE ==========')
  console.log('Ruta:', req.method, req.originalUrl)
  console.log('Authorization:', req.headers.authorization)

  const auth = req.headers.authorization

  if (!auth?.startsWith('Bearer ')) {
    console.log('❌ No llegó el header Authorization')

    return res.status(401).json({
      error: 'No autenticado.'
    })
  }

  const token = auth.slice(7)

  console.log('Token recibido:', token.substring(0, 40) + '...')

  try {

    const payload = jwt.verify(
      token,
      env.moodleSharedSecret,
      { algorithms: ['HS256'] }
    )

    console.log('✅ JWT válido')
    console.log(payload)

    res.locals.moodleUser = {
      moodle_user_sub: String(payload.moodle_user_sub),
      session_id: payload.session_id ?? null,
      moodle_course_id: payload.moodle_course_id ?? null,
      moodleUrl: payload.moodleUrl ?? null,
    }

    return next()

  } catch (err) {

    console.error('❌ Error verificando JWT')
    console.error(err)

    return res.status(401).json({
      error: 'Token inválido o expirado.',
      detalle: err.message
    })

  }
}
