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
  },
  { _id: true }
)

export const Session = model('Session', SessionSchema)
