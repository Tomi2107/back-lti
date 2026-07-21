import { Router } from 'express'

import {

    getNotifications,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification

} from '../controllers/notificationController.js'

const router = Router()

router.get('/', getNotifications)

router.post('/', createNotification)

router.patch('/:id/read', markAsRead)

router.patch('/read-all', markAllAsRead)

router.delete('/:id', deleteNotification)

export default router