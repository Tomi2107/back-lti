import { prisma } from '../lib/prisma.js'
import { getActivityContent } from '../services/moodleService.js'

const CACHE_TTL_MS = 24 * 60 * 60 * 1000

export const getContent = async (req, res) => {
  const { activity_id } = req.params
  const { moodleUrl } = res.locals.moodleUser

  const cached = await prisma.moodleCourseCache.findUnique({ where: { activity_id } })
  const isFresh = cached && Date.now() - cached.updated_at.getTime() < CACHE_TTL_MS

  if (isFresh) {
    return res.json({
      activity_id,
      content_text_raw: cached.content_text_raw,
      cached: true,
      updated_at: cached.updated_at,
    })
  }

  const content = await getActivityContent(moodleUrl, activity_id)
  const now = new Date()

  await prisma.moodleCourseCache.upsert({
    where: { activity_id },
    update: { content_text_raw: content, updated_at: now },
    create: { activity_id, content_text_raw: content },
  })

  return res.json({ activity_id, content_text_raw: content, cached: false, updated_at: now })
}
