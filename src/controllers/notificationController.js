import { prisma } from '../lib/prisma.js'

/*
|--------------------------------------------------------------------------
| Obtener notificaciones del usuario
|--------------------------------------------------------------------------
*/

export const getNotifications = async (req, res) => {

    const { moodle_user_sub } = res.locals.moodleUser

    const notifications = await prisma.notification.findMany({

        where: {
            moodle_user_sub
        },

        orderBy: {
            created_at: 'desc'
        }

    })

    return res.json({

        total: notifications.length,

        notifications

    })

}

/*
|--------------------------------------------------------------------------
| Crear notificación
|--------------------------------------------------------------------------
*/

export const createNotification = async (req, res) => {

    const { moodle_user_sub } = res.locals.moodleUser

    const {

        title,
        message,
        type = "info"

    } = req.body

    if (!title || !message) {

        return res.status(400).json({

            error: "title y message son requeridos."

        })

    }

    const notification = await prisma.notification.create({

        data: {

            moodle_user_sub,

            title,

            message,

            type,

            read: false

        }

    })

    return res.status(201).json(notification)

}

/*
|--------------------------------------------------------------------------
| Marcar una notificación como leída
|--------------------------------------------------------------------------
*/

export const markAsRead = async (req, res) => {

    const { id } = req.params

    const notification = await prisma.notification.update({

        where: {

            notification_id: id

        },

        data: {

            read: true

        }

    })

    return res.json(notification)

}

/*
|--------------------------------------------------------------------------
| Marcar todas como leídas
|--------------------------------------------------------------------------
*/

export const markAllAsRead = async (req, res) => {

    const { moodle_user_sub } = res.locals.moodleUser

    await prisma.notification.updateMany({

        where: {

            moodle_user_sub,

            read: false

        },

        data: {

            read: true

        }

    })

    return res.json({

        success: true

    })

}

/*
|--------------------------------------------------------------------------
| Eliminar notificación
|--------------------------------------------------------------------------
*/

export const deleteNotification = async (req, res) => {

    const { id } = req.params

    await prisma.notification.delete({

        where: {

            notification_id: id

        }

    })

    return res.json({

        success: true

    })

}