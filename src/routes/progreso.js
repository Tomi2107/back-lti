import { Router } from 'express'

const router = Router()

router.get('/', (req, res) => {
  res.json({
    module: 'progreso',
    status: 'ok'
  })
})

export default router