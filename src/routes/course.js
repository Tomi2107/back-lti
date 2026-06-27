import { Router } from 'express'
import { getCourse } from '../controllers/courseController.js'

const router = Router()

router.get('/', getCourse)

export default router
