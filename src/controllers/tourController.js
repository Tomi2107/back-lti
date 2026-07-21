import { prisma } from '../lib/prisma.js'

/*
|--------------------------------------------------------------------------
| Obtener estado del tour
|--------------------------------------------------------------------------
*/

export const getTourStatus = async (req, res) => {

    const { moodle_user_sub } = res.locals.moodleUser

    const user = await prisma.user.findUnique({

        where: {

            moodle_user_sub

        },

        select: {

            accessibility_settings: true

        }

    })

    const settings = user?.accessibility_settings ?? {}

    return res.json({

        tour_completed: settings.tour_completed ?? false,

        tour_step: settings.tour_step ?? 0,

        last_completed_at: settings.tour_completed_at ?? null

    })

}

/*
|--------------------------------------------------------------------------
| Actualizar paso del tour
|--------------------------------------------------------------------------
*/

export const updateTourStep = async (req, res) => {

    const { moodle_user_sub } = res.locals.moodleUser

    const {

        step

    } = req.body

    if (typeof step !== "number") {

        return res.status(400).json({

            error: "step debe ser numérico."

        })

    }

    const user = await prisma.user.findUnique({

        where: {

            moodle_user_sub

        }

    })

    if (!user) {

        return res.status(404).json({

            error: "Usuario no encontrado."

        })

    }

    const settings = {

        ...(user.accessibility_settings || {}),

        tour_step: step

    }

    await prisma.user.update({

        where: {

            moodle_user_sub

        },

        data: {

            accessibility_settings: settings

        }

    })

    return res.json({

        success: true,

        current_step: step

    })

}

/*
|--------------------------------------------------------------------------
| Finalizar tour
|--------------------------------------------------------------------------
*/

export const completeTour = async (req, res) => {

    const { moodle_user_sub } = res.locals.moodleUser

    const user = await prisma.user.findUnique({

        where: {

            moodle_user_sub

        }

    })

    if (!user) {

        return res.status(404).json({

            error: "Usuario no encontrado."

        })

    }

    const settings = {

        ...(user.accessibility_settings || {}),

        tour_completed: true,

        tour_step: 999,

        tour_completed_at: new Date()

    }

    await prisma.user.update({

        where: {

            moodle_user_sub

        },

        data: {

            accessibility_settings: settings

        }

    })

    return res.json({

        success: true

    })

}

/*
|--------------------------------------------------------------------------
| Reiniciar tour
|--------------------------------------------------------------------------
*/

export const resetTour = async (req, res) => {

    const { moodle_user_sub } = res.locals.moodleUser

    const user = await prisma.user.findUnique({

        where: {

            moodle_user_sub

        }

    })

    if (!user) {

        return res.status(404).json({

            error: "Usuario no encontrado."

        })

    }

    const settings = {

        ...(user.accessibility_settings || {}),

        tour_completed: false,

        tour_step: 0,

        tour_completed_at: null

    }

    await prisma.user.update({

        where: {

            moodle_user_sub

        },

        data: {

            accessibility_settings: settings

        }

    })

    return res.json({

        success: true

    })

}