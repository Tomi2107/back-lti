import { Router } from 'express'
import { getCourseStructure } from '../controllers/courseController.js'

const router = Router()

router.get('/:course_id/structure', getCourseStructure)

export default router
