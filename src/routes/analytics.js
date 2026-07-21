import { Router } from 'express'

import {

    getDashboard,
    getUserAnalytics,
    getCourseAnalytics,
    getAccessibilityAnalytics,
    getSessionAnalytics,
    getAIAnalytics,
    getProgressAnalytics,
    getActivityAnalytics,
    getHeatmap,
    getTimeline,
    getUsageStatistics,
    getRecommendations

} from '../controllers/analyticsController.js'


const router = Router()


router.get(
    '/dashboard',
    getDashboard
)


router.get(
    '/user',
    getUserAnalytics
)


router.get(
    '/course',
    getCourseAnalytics
)


router.get(
    '/accessibility',
    getAccessibilityAnalytics
)


router.get(
    '/sessions',
    getSessionAnalytics
)


router.get(
    '/ai',
    getAIAnalytics
)


router.get(
    '/progress',
    getProgressAnalytics
)


router.get(
    '/activity',
    getActivityAnalytics
)


router.get(
    '/heatmap',
    getHeatmap
)


router.get(
    '/timeline',
    getTimeline
)


router.get(
    '/usage',
    getUsageStatistics
)


router.get(
    '/recommendations',
    getRecommendations
)


export default router