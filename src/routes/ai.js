import { Router } from 'express'
import { summarizeText, simplifyText } from '../controllers/aiController.js'

const router = Router()

router.post('/summarize', summarizeText)
router.post('/simplify', simplifyText)

export default router
