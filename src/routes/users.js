import { Router } from 'express'
import { getMe, updateAccessibility, updateOnboarding } from '../controllers/userController.js'

const router = Router()

router.get('/me', getMe)
router.patch('/me/accessibility', updateAccessibility)
router.patch('/me/onboarding', updateOnboarding)

export default router
