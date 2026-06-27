import { getCourseContents } from '../services/moodleService.js'
import { MoodleCourseCache } from '../models/MoodleCourseCache.js'

const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 horas

export const getCourseStructure = async (req, res) => {
  const { course_id } = req.params
  const { moodleUrl } = res.locals.moodleUser

  if (!moodleUrl) return res.status(400).json({ error: 'URL de Moodle no disponible.' })

  const sections = await getCourseContents(moodleUrl, course_id)

  // Cachear contenido de cada módulo en paralelo
  const now = new Date()
  const cacheOps = []

  for (const section of sections) {
    for (const mod of section.modules ?? []) {
      const content = mod.description ?? mod.intro ?? ''
      cacheOps.push(
        MoodleCourseCache.findOneAndUpdate(
          { activity_id: String(mod.id) },
          { $set: { moodle_course_id: String(course_id), content_text_raw: content, updated_at: now } },
          { upsert: true }
        )
      )
    }
  }
  await Promise.allSettled(cacheOps)

  const modules = sections.map((section) => ({
    id: String(section.id),
    name: section.name ?? '',
    activities: (section.modules ?? [])
      .filter((m) => m.visible !== 0)
      .map((m) => ({
        activity_id: String(m.id),
        name: m.name ?? '',
        type: m.modname ?? 'resource',
        visible: Boolean(m.visible),
        url: m.url ?? null,
      })),
  }))

  return res.json({ course_id: String(course_id), modules })
}
