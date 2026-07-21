import { prisma } from '../lib/prisma.js'

const VALID_RESULTADOS = [
  'SUCCESS',
  'FAILED',
  'CANCELLED'
]

const PAYLOAD_SCHEMAS = {

  SESSION_START: {
    required: [],
  },

  SESSION_END: {
    required: [],
  },

  ACCESSIBILITY_CHANGED: {

    required: [
      'adjustment_type',
      'old_value',
      'new_value'
    ],

    enums: {

      adjustment_type: [

        // Texto
        'font_size',
        'font_family',
        'alignment',

        // Visual
        'contrast_mode',
        'dark_mode',
        'grayscale',
        'brightness',
        'contrast',
        'saturation',

        // Voz
        'voice',
        'voice_speed',
        'voice_volume',

        // Panel
        'button_position',

        // Perfil
        'profile'

      ]

    }

  },

  PRESET_SELECTED: {

    required: [
      'preset_name'
    ],

    enums: {

      preset_name: [

        'color',
        'voz',
        'fuentes',
        'seguridad',
        'visibilidad',
        'enfoque'

      ]

    }

  },

  MENU_NAVIGATION: {

    required: [
      'menu'
    ],

    enums: {

      menu: [

        'principal',

        'submenu_texto',

        'submenu_lectura',

        'submenu_apariencia',

        'submenu_perfiles',

        'submenu_visual',

        'submenu_ajustes',

        'teclado_virtual'

      ]

    }

  },

  NAVIGATION_EVENT: {

    required: [
      'destination'
    ],

    enums: {

      destination: [

        'inicio',

        'curso',

        'actividad',

        'mi_progreso',

        'proximos_pasos',

        'navegacion_clara'

      ]

    }

  },

  TTS_INTERACTION: {

    required: [
      'action',
      'activity_id'
    ],

    enums: {

      action: [

        'play',
        'pause',
        'stop',
        'auto_read'

      ]

    }

  },

  AI_COGNITIVE_REQUEST: {

    required: [
      'request_type',
      'activity_id'
    ],

    enums: {

      request_type: [

        'summary',
        'simplify',
        'key_concepts'

      ]

    }

  },

  TASK_COMPLETED: {

    required: [
      'activity_id',
      'moodle_course_id'
    ]

  },

  FOCUS_MODE_TOGGLED: {

    required: [
      'action'
    ],

    enums: {

      action: [
        'start',
        'stop'
      ]

    }

  }

}

function validatePayload(event_type, payload) {

  const schema = PAYLOAD_SCHEMAS[event_type]

  if (!schema) {

    return {

      valid: false,

      error: `event_type desconocido: ${event_type}`

    }

  }

  const errors = []

  for (const field of schema.required) {

    if (

      payload[field] === undefined ||

      payload[field] === null ||

      payload[field] === ''

    ) {

      errors.push(

        `payload.${field} es requerido para ${event_type}`

      )

    }

  }

  if (schema.enums) {

    for (const [field, allowed] of Object.entries(schema.enums)) {

      if (

        payload[field] !== undefined &&

        !allowed.includes(payload[field])

      ) {

        errors.push(

          `payload.${field} debe ser uno de: ${allowed.join(', ')}`

        )

      }

    }

  }

  return errors.length

    ? {

        valid: false,

        error: errors.join(' | ')

      }

    : {

        valid: true

      }

}

export const logEvent = async (req, res) => {

  const {

    session_id,

    moodle_course_id

  } = res.locals.moodleUser

  const {

    event_type,

    payload = {},

    resultado

  } = req.body

  if (!PAYLOAD_SCHEMAS[event_type]) {

    return res.status(400).json({

      error: `event_type inválido. Valores: ${Object.keys(PAYLOAD_SCHEMAS).join(', ')}`

    })

  }

  if (!VALID_RESULTADOS.includes(resultado)) {

    return res.status(400).json({

      error: `resultado inválido. Valores: ${VALID_RESULTADOS.join(', ')}`

    })

  }

  const validation = validatePayload(

    event_type,

    payload

  )

  if (!validation.valid) {

    return res.status(400).json({

      error: validation.error

    })

  }

  const enrichedPayload = {

    ...payload

  }

  if (

    [

      'AI_COGNITIVE_REQUEST',

      'TTS_INTERACTION',

      'TASK_COMPLETED'

    ].includes(event_type)

  ) {

    if (!enrichedPayload.moodle_course_id) {

      enrichedPayload.moodle_course_id =

        moodle_course_id ?? null

    }

  }

  if (

    event_type === 'FOCUS_MODE_TOGGLED' &&

    resultado === 'SUCCESS'

  ) {

    if (payload.action === 'start') {

      await prisma.session.update({

        where: {

          session_id

        },

        data: {

          focus_mode_activated: true

        }

      })

    }

    if (

      payload.action === 'stop' &&

      typeof payload.duration_seconds === 'number'

    ) {

      await prisma.session.update({

        where: {

          session_id

        },

        data: {

          focus_mode_total_seconds: {

            increment: payload.duration_seconds

          }

        }

      })

    }

  }

  const event = await prisma.eventLog.create({

    data: {

      session_id,

      event_type,

      payload: enrichedPayload,

      resultado,

      timestamp: new Date()

    }

  })

  return res.status(201).json({

    event_id: event.event_id,

    session_id: event.session_id,

    timestamp: event.timestamp

  })

}
