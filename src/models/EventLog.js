import { Schema, model } from 'mongoose'
import { randomUUID } from 'crypto'

const EventLogSchema = new Schema(
  {
    event_id: { type: String, required: true, unique: true, default: () => randomUUID() },
    session_id: { type: String, required: true, index: true },
    event_type: {
      type: String,
      required: true,
      enum: ['SESSION_START', 'ACCESSIBILITY_CHANGED', 'TTS_INTERACTION', 'AI_COGNITIVE_REQUEST', 'TASK_COMPLETED'],
    },
    payload: { type: Schema.Types.Mixed, default: {} },
    resultado: {
      type: String,
      required: true,
      enum: ['SUCCESS', 'FAILED', 'CANCELLED'],
    },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true }
)

export const EventLog = model('EventLog', EventLogSchema)
