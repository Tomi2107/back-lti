import { getCourseModules } from '../services/moodleService.js'

export const getCourse = async (req, res) => {
  const { moodleUrl, courseId } = res.locals.moodleUser

  if (!moodleUrl || !courseId) {
    return res.status(400).json({ error: 'Contexto de curso no disponible.' })
  }

  const sections = await getCourseModules(moodleUrl, courseId)

  const nav = sections.map((section) => ({
    id: section.id,
    name: section.name,
    modules: (section.modules ?? []).map((mod) => ({
      id: mod.id,
      name: mod.name,
      modname: mod.modname,
      url: mod.url ?? null,
      visible: mod.visible ?? 1,
      state: mod.completiondata?.state ?? null,
    })),
  }))

  return res.json({ nav })
}
