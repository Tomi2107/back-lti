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

// Dashboard principal
router.get('/dashboard', getDashboard)

// Estadísticas por categoría
router.get('/users', getUserAnalytics)
router.get('/courses', getCourseAnalytics)
router.get('/accessibility', getAccessibilityAnalytics)
router.get('/sessions', getSessionAnalytics)
router.get('/ai', getAIAnalytics)
router.get('/progress', getProgressAnalytics)
router.get('/activities', getActivityAnalytics)

// Gráficos
router.get('/heatmap', getHeatmap)
router.get('/timeline', getTimeline)
router.get('/usage', getUsageStatistics)

// IA
router.get('/recommendations', getRecommendations)

export default router