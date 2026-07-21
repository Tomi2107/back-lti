import { prisma } from '../lib/prisma.js'

const DEFAULT_SETTINGS = {

  contrast_mode: false,
  dark_mode: false,

  font_family: 'default',
  font_size: 'normal',
  alignment: 'left',

  brightness: 50,
  contrast: 50,
  saturation: 50,

  grayscale: false,

  voice: false,
  voice_speed: 50,
  voice_volume: 100,

  button_position: 'right',

  profile: null

}

function mergeSettings(settings = {}) {

  return {

    ...DEFAULT_SETTINGS,

    ...(settings || {})

  }

}

export async function getAccessibility(req, res) {

  console.log(
   "USER EN CONTROLLER:",
   res.locals.moodleUser
 )
 
  try {

    const { moodle_user_sub } = res.locals.moodleUser

    const user = await prisma.user.findUnique({

      where: {
        moodle_user_sub
      }

    })

    if (!user) {

      return res.status(404).json({
        error: "Usuario no encontrado"
      })

    }

    return res.json({

      accessibility_settings: mergeSettings(
        user.accessibility_settings
      )

    })

  } catch (error) {

    console.error(
      "ERROR GET ACCESSIBILITY:",
      error
    )

    return res.status(500).json({
      error: "Error obteniendo preferencias"
    })

  }

}

export async function updateAccessibility(req, res) {

  try {

    const { moodle_user_sub } = res.locals.moodleUser

    const user = await prisma.user.findUnique({

      where: {
        moodle_user_sub
      }

    })

    if (!user) {

      return res.status(404).json({
        error: "Usuario no encontrado"
      })

    }

    const nuevasPreferencias = mergeSettings({

      ...(user.accessibility_settings || {}),

      ...req.body

    })

    const updated = await prisma.user.update({

      where: {
        moodle_user_sub
      },

      data: {

        accessibility_settings: nuevasPreferencias

      }

    })

    return res.json({

      ok: true,

      accessibility_settings:
        updated.accessibility_settings

    })

  } catch (error) {

    console.error(
      "ERROR UPDATE ACCESSIBILITY:",
      error
    )

    return res.status(500).json({
      error: "Error guardando preferencias"
    })

  }

}

export async function resetAccessibility(req, res) {

  try {

    const { moodle_user_sub } = res.locals.moodleUser

    await prisma.user.update({

      where: {
        moodle_user_sub
      },

      data: {

        accessibility_settings: DEFAULT_SETTINGS

      }

    })

    return res.json({

      ok: true,

      accessibility_settings: DEFAULT_SETTINGS

    })

  } catch (error) {

    console.error(
      "ERROR RESET ACCESSIBILITY:",
      error
    )

    return res.status(500).json({
      error: "Error restaurando preferencias"
    })

  }

}