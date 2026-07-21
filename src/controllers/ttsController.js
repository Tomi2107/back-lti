import { prisma } from '../lib/prisma.js'

const VALID_ACTIONS = [

    "play",
    "pause",
    "resume",
    "stop",
    "auto_read"

]

/*
|--------------------------------------------------------------------------
| Obtener configuración TTS del usuario
|--------------------------------------------------------------------------
*/

export const getTTSSettings = async (req, res) => {

    const { moodle_user_sub } = res.locals.moodleUser

    const user = await prisma.user.findUnique({

        where: {
            moodle_user_sub
        },

        select: {

            accessibility_settings: true

        }

    })

    return res.json({

        voice: user?.accessibility_settings?.voice ?? false,

        voice_speed: user?.accessibility_settings?.voice_speed ?? 50,

        voice_volume: user?.accessibility_settings?.voice_volume ?? 100

    })

}

/*
|--------------------------------------------------------------------------
| Guardar configuración TTS
|--------------------------------------------------------------------------
*/

export const updateTTSSettings = async (req, res) => {

    const { moodle_user_sub } = res.locals.moodleUser

    const {

        voice,
        voice_speed,
        voice_volume

    } = req.body

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

        voice,

        voice_speed,

        voice_volume

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

        settings

    })

}

/*
|--------------------------------------------------------------------------
| Registrar interacción TTS
|--------------------------------------------------------------------------
*/

export const logTTSInteraction = async (req, res) => {

    const {

        session_id

    } = res.locals.moodleUser

    const {

        action,
        activity_id,
        duration_seconds = 0

    } = req.body

    if (!VALID_ACTIONS.includes(action)) {

        return res.status(400).json({

            error:
                `action debe ser uno de: ${VALID_ACTIONS.join(', ')}`

        })

    }

    const event = await prisma.eventLog.create({

        data: {

            session_id,

            event_type: "TTS_INTERACTION",

            resultado: "SUCCESS",

            payload: {

                action,

                activity_id,

                duration_seconds

            },

            timestamp: new Date()

        }

    })

    return res.status(201).json({

        event_id: event.event_id,

        action,

        activity_id

    })

}

/*
|--------------------------------------------------------------------------
| Estadísticas TTS del usuario
|--------------------------------------------------------------------------
*/

export const getTTSStats = async (req, res) => {

    const {

        session_id

    } = res.locals.moodleUser

    const total = await prisma.eventLog.count({

        where: {

            session_id,

            event_type: "TTS_INTERACTION"

        }

    })

    const reproducciones = await prisma.eventLog.count({

        where: {

            session_id,

            event_type: "TTS_INTERACTION",

            payload: {

                path: ["action"],

                equals: "play"

            }

        }

    })

    return res.json({

        total_events: total,

        total_play: reproducciones

    })

}