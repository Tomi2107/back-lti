import { Router } from 'express'

import {
    getContext,
    getHome,
    getRecommendations,
    getNextSteps,
    getDailySummary,
    getCurrentActivity,
    getStudyAssistant,
    getAccessibilityAssistant,
    getProgressAssistant,
    getNotifications
} from '../controllers/assistantController.js'


const router = Router()


router.get(
    '/context',
    getContext
)


router.get(
    '/',
    getHome
)


router.get(
    '/recommendations',
    getRecommendations
)


router.get(
    '/next-steps',
    getNextSteps
)


router.get(
    '/daily-summary',
    getDailySummary
)


router.get(
    '/current-activity',
    getCurrentActivity
)


router.get(
    '/study',
    getStudyAssistant
)


router.get(
    '/accessibility',
    getAccessibilityAssistant
)


router.get(
    '/progress',
    getProgressAssistant
)


router.get(
    '/notifications',
    getNotifications
)


export default router