import { Router } from 'express'

const router = Router()

// GET /api/accessibility/status
// Ejemplo de endpoint protegido — ltijs ya validó el token LTI antes de llegar aquí
router.get('/status', (req, res) => {
  const token = res.locals.token // ltijs expone el token aquí

  res.json({
    ok: true,
    user: token?.user,
    roles: token?.roles,
    context: token?.context?.label,
  })
})

export default router
