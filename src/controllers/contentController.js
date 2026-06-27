import { MoodleCourseCache } from '../models/MoodleCourseCache.js'
import { getActivityContent } from '../services/moodleService.js'

const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 horas

export const getContent = async (req, res) => {
  const { activity_id } = req.params
  const { moodleUrl } = res.locals.moodleUser

  const cached = await MoodleCourseCache.findOne({ activity_id })
  const isFresh = cached && Date.now() - cached.updated_at.getTime() < CACHE_TTL_MS

  if (isFresh) {
    return res.json({
      activity_id,
      content_text_raw: cached.content_text_raw,
      cached: true,
      updated_at: cached.updated_at,
    })
  }

  // Refrescar desde Moodle
  const content = await getActivityContent(moodleUrl, activity_id)
  const now = new Date()

  await MoodleCourseCache.findOneAndUpdate(
    { activity_id },
    { $set: { content_text_raw: content, updated_at: now } },
    { upsert: true }
  )

  return res.json({ activity_id, content_text_raw: content, cached: false, updated_at: now })
}
