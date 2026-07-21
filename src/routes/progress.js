import { Router } from 'express'

import {
    getProgress,
    updateProgress,
    getSuggestions
} from '../controllers/progressController.js'

const router = Router()

router.get('/suggestions', getSuggestions)

router.get('/', getProgress)

router.patch('/:activity_id', updateProgress)

export default router