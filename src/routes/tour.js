import { Router } from 'express'

import {

    getTourStatus,
    updateTourStep,
    completeTour,
    resetTour

} from '../controllers/tourController.js'

const router = Router()

router.get('/', getTourStatus)

router.patch('/step', updateTourStep)

router.patch('/complete', completeTour)

router.patch('/reset', resetTour)

export default router