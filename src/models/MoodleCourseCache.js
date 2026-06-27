import { Schema, model } from 'mongoose'

const MoodleCourseCacheSchema = new Schema(
  {
    moodle_course_id: { type: String, required: true, index: true },
    activity_id: { type: String, required: true, unique: true },
    content_text_raw: { type: String, default: '' },
    updated_at: { type: Date, default: Date.now },
  },
  { _id: true }
)

export const MoodleCourseCache = model('MoodleCourseCache', MoodleCourseCacheSchema)
