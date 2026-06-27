import { Router } from 'express'
import { processAI } from '../controllers/aiController.js'

const router = Router()

router.post('/process/:activity_id', processAI)

export default router
