import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export const tokenMiddleware = (req, res, next) => {
  const auth = req.headers.authorization

  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice(7)
    try {
      const payload = jwt.verify(token, env.moodleSharedSecret, { algorithms: ['HS256'] })
      res.locals.moodleUser = {
        userId: String(payload.userId),
        userEmail: payload.userEmail ?? null,
        userName: payload.userName ?? null,
        courseId: payload.courseId ? String(payload.courseId) : null,
        moodleUrl: payload.moodleUrl ?? null,
        roles: payload.roles ?? [],
        platformUrl: payload.moodleUrl ?? payload.platformUrl ?? null,
      }
      return next()
    } catch {
      return res.status(401).json({ error: 'Token inválido o expirado' })
    }
  }

  return res.status(401).json({ error: 'No autenticado' })
}
