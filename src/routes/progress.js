import { Router } from 'express'
import { getProgress } from '../controllers/progressController.js'

const router = Router()

router.get('/', getProgress)

export default router
