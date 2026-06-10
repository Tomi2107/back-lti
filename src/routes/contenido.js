import { Router } from 'express'

const router = Router()

router.get('/', (req, res) => {
  res.json({
    module: 'contenido',
    status: 'ok'
  })
})

export default router