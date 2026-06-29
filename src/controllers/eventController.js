import { EventLog } from '../models/EventLog.js'
import { Session } from '../models/Session.js'

const VALID_RESULTADOS = ['SUCCESS', 'FAILED', 'CANCELLED']

// ─── Schemas de payload por event_type ───────────────────────────────────────
// Cada entrada define los campos requeridos y sus valores válidos (si aplica).

const PAYLOAD_SCHEMAS = {
  SESSION_START: {
    required: [],
  },
  ACCESSIBILITY_CHANGED: {
    required: ['feature', 'previous_value', 'new_value'],
    enums: {
      feature: ['font_size', 'contrast_mode', 'font_family', 'line_height', 'word_spacing'],
    },
  },
  TTS_INTERACTION: {
    required: ['action', 'activity_id'],
    enums: {
      action: ['play', 'pause', 'stop'],
    },
  },
  AI_COGNITIVE_REQUEST: {
    required: ['activity_id', 'mode'],
    enums: {
      mode: ['summary', 'simplify', 'key_concepts'],
    },
  },
  PRESET_SELECTED: {
    required: ['preset_name'],
    enums: {
      preset_name: ['dyslexia', 'low_vision', 'focus', 'custom'],
    },
  },
  NAVIGATION_EVENT: {
    required: ['to_activity_id', 'course_id'],
  },
  TASK_COMPLETED: {
    required: ['activity_id', 'previous_status', 'new_status'],
    enums: {
      previous_status: ['PENDING', 'IN_PROGRESS'],
      new_status: ['COMPLETED'],
    },
  },
  FOCUS_MODE_TOGGLED: {
    required: ['action'],
    enums: {
      action: ['start', 'stop'],
    },
  },
}

function validatePayload(event_type, payload) {
  const schema = PAYLOAD_SCHEMAS[event_type]
  if (!schema) return { valid: false, error: `event_type desconocido: ${event_type}` }

  const errors = []

  for (const field of schema.required) {
    if (payload[field] === undefined || payload[field] === null || payload[field] === '') {
      errors.push(`payload.${field} es requerido para ${event_type}`)
    }
  }

  if (schema.enums) {
    for (const [field, allowed] of Object.entries(schema.enums)) {
      if (payload[field] !== undefined && !allowed.includes(payload[field])) {
        errors.push(`payload.${field} debe ser uno de: ${allowed.join(', ')}`)
      }
    }
  }

  return errors.length ? { valid: false, error: errors.join(' | ') } : { valid: true }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export const logEvent = async (req, res) => {
  const { session_id } = res.locals.moodleUser
  const { event_type, payload = {}, resultado } = req.body

  if (!PAYLOAD_SCHEMAS[event_type]) {
    return res.status(400).json({
      error: `event_type inválido. Valores: ${Object.keys(PAYLOAD_SCHEMAS).join(', ')}`,
    })
  }

  if (!VALID_RESULTADOS.includes(resultado)) {
    return res.status(400).json({
      error: `resultado inválido. Valores: ${VALID_RESULTADOS.join(', ')}`,
    })
  }

  const validation = validatePayload(event_type, payload)
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error })
  }

  // Actualizar sesión cuando se registra foco
  if (event_type === 'FOCUS_MODE_TOGGLED' && resultado === 'SUCCESS') {
    if (payload.action === 'start') {
      await Session.findOneAndUpdate({ session_id }, { $set: { focus_mode_activated: true } })
    } else if (payload.action === 'stop' && typeof payload.duration_seconds === 'number') {
      await Session.findOneAndUpdate(
        { session_id },
        { $inc: { focus_mode_total_seconds: payload.duration_seconds } }
      )
    }
  }

  const event = await EventLog.create({
    session_id,
    event_type,
    payload,
    resultado,
    timestamp: new Date(),
  })

  return res.status(201).json({
    event_id: event.event_id,
    session_id: event.session_id,
    timestamp: event.timestamp,
  })
}
