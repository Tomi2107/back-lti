import { EventLog } from '../models/EventLog.js'

const VALID_TYPES = ['SESSION_START', 'ACCESSIBILITY_CHANGED', 'TTS_INTERACTION', 'AI_COGNITIVE_REQUEST', 'TASK_COMPLETED']
const VALID_RESULTADOS = ['SUCCESS', 'FAILED', 'CANCELLED']

export const logEvent = async (req, res) => {
  const { session_id } = res.locals.moodleUser
  const { event_type, payload, resultado } = req.body

  if (!VALID_TYPES.includes(event_type)) {
    return res.status(400).json({ error: `event_type inválido. Valores: ${VALID_TYPES.join(', ')}` })
  }
  if (!VALID_RESULTADOS.includes(resultado)) {
    return res.status(400).json({ error: `resultado inválido. Valores: ${VALID_RESULTADOS.join(', ')}` })
  }

  const event = await EventLog.create({
    session_id,
    event_type,
    payload: payload ?? {},
    resultado,
    timestamp: new Date(),
  })

  return res.status(201).json({
    event_id: event.event_id,
    session_id: event.session_id,
    timestamp: event.timestamp,
  })
}
