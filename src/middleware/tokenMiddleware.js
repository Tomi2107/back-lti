import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export const tokenMiddleware = (req, res, next) => {
  const auth = req.headers.authorization

  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autenticado.' })
  }

  const token = auth.slice(7)
  try {
    const payload = jwt.verify(token, env.moodleSharedSecret, { algorithms: ['HS256'] })
    res.locals.moodleUser = {
      moodle_user_sub: String(payload.moodle_user_sub),
      session_id: payload.session_id ?? null,
      moodle_course_id: payload.moodle_course_id ?? null,
      moodleUrl: payload.moodleUrl ?? null,
    }
    return next()
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado.' })
  }
}
