import { Router } from 'express'

import {

    getFocusStatus,
    startFocusMode,
    stopFocusMode,
    getFocusStats,
    resetFocusStats

} from '../controllers/focusController.js'

const router = Router()

router.get('/', getFocusStatus)

router.post('/start', startFocusMode)

router.post('/stop', stopFocusMode)

router.get('/stats', getFocusStats)

router.post('/reset', resetFocusStats)

export default router