import { Schema, model } from 'mongoose'
import { randomUUID } from 'crypto'

const SessionSchema = new Schema(
  {
    session_id: { type: String, required: true, unique: true, default: () => randomUUID() },
    moodle_user_sub: { type: String, required: true, index: true },
    moodle_course_id: { type: String, default: null },
    started_at: { type: Date, default: Date.now },
    ended_at: { type: Date, default: null },
    user_agent: { type: String, default: '' },
    ip_address: { type: String, default: null },
    city: { type: String, default: null }, // pendiente: resolver via geolocalización de ip_address
    focus_mode_activated: { type: Boolean, default: false },
    focus_mode_total_seconds: { type: Number, default: 0 },
  },
  { _id: true }
)

export const Session = model('Session', SessionSchema)
