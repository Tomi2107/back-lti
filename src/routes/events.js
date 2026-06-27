import { Router } from 'express'
import { logEvent } from '../controllers/eventController.js'

const router = Router()

router.post('/', logEvent)

export default router
