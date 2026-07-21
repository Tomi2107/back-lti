import { Router } from 'express'

import {

    getTTSSettings,
    updateTTSSettings,
    logTTSInteraction,
    getTTSStats

} from '../controllers/ttsController.js'

const router = Router()

router.get('/settings', getTTSSettings)

router.patch('/settings', updateTTSSettings)

router.post('/event', logTTSInteraction)

router.get('/stats', getTTSStats)

export default router