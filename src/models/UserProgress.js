import { Schema, model } from 'mongoose'

const UserProgressSchema = new Schema(
  {
    moodle_user_sub: { type: String, required: true, index: true },
    moodle_activity_id: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
      default: 'PENDING',
    },
    due_date: { type: Date, default: null },
    last_interaction_timestamp: { type: Date, default: Date.now },
  },
  { _id: true }
)

UserProgressSchema.index({ moodle_user_sub: 1, moodle_activity_id: 1 }, { unique: true })

export const UserProgress = model('UserProgress', UserProgressSchema)
