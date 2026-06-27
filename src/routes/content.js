import { Router } from 'express'
import { getContent } from '../controllers/contentController.js'

const router = Router()

router.get('/:activity_id', getContent)

export default router
