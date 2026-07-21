import { prisma } from '../lib/prisma.js'

/*
|--------------------------------------------------------------------------
| Obtener estado del modo concentración
|--------------------------------------------------------------------------
*/

export const getFocusStatus = async (req, res) => {

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

        enabled: settings.focus_mode ?? false,

        started_at: settings.focus_started_at ?? null

    })

}

/*
|--------------------------------------------------------------------------
| Activar modo concentración
|--------------------------------------------------------------------------
*/

export const startFocusMode = async (req, res) => {

    const {

        moodle_user_sub,
        session_id

    } = res.locals.moodleUser

    const now = new Date()

    const user = await prisma.user.findUnique({

        where: {

            moodle_user_sub

        }

    })

    const settings = {

        ...(user?.accessibility_settings || {}),

        focus_mode: true,

        focus_started_at: now

    }

    await prisma.user.update({

        where: {

            moodle_user_sub

        },

        data: {

            accessibility_settings: settings

        }

    })

    await prisma.session.update({

        where: {

            session_id

        },

        data: {

            focus_mode_activated: true

        }

    })

    return res.json({

        success: true,

        started_at: now

    })

}

/*
|--------------------------------------------------------------------------
| Finalizar modo concentración
|--------------------------------------------------------------------------
*/

export const stopFocusMode = async (req, res) => {

    const {

        moodle_user_sub,
        session_id

    } = res.locals.moodleUser

    const user = await prisma.user.findUnique({

        where: {

            moodle_user_sub

        }

    })

    const settings = user?.accessibility_settings || {}

    const started = settings.focus_started_at
        ? new Date(settings.focus_started_at)
        : new Date()

    const durationSeconds = Math.floor(

        (Date.now() - started.getTime()) / 1000

    )

    settings.focus_mode = false

    settings.focus_started_at = null

    await prisma.user.update({

        where: {

            moodle_user_sub

        },

        data: {

            accessibility_settings: settings

        }

    })

    await prisma.session.update({

        where: {

            session_id

        },

        data: {

            focus_mode_total_seconds: {

                increment: durationSeconds

            }

        }

    })

    return res.json({

        success: true,

        duration_seconds: durationSeconds

    })

}

/*
|--------------------------------------------------------------------------
| Obtener estadísticas
|--------------------------------------------------------------------------
*/

export const getFocusStats = async (req, res) => {

    const {

        session_id

    } = res.locals.moodleUser

    const session = await prisma.session.findUnique({

        where: {

            session_id

        },

        select: {

            focus_mode_activated: true,

            focus_mode_total_seconds: true

        }

    })

    return res.json({

        activated:

            session?.focus_mode_activated ?? false,

        total_seconds:

            session?.focus_mode_total_seconds ?? 0

    })

}

/*
|--------------------------------------------------------------------------
| Reiniciar estadísticas
|--------------------------------------------------------------------------
*/

export const resetFocusStats = async (req, res) => {

    const {

        session_id

    } = res.locals.moodleUser

    await prisma.session.update({

        where: {

            session_id

        },

        data: {

            focus_mode_total_seconds: 0,

            focus_mode_activated: false

        }

    })

    return res.json({

        success: true

    })

}