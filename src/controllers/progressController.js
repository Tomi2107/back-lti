import { getCompletionStatus } from '../services/moodleService.js'

export const getProgress = async (req, res) => {
  const { moodleUrl, courseId, userId } = res.locals.moodleUser

  if (!moodleUrl || !courseId) {
    return res.status(400).json({ error: 'Contexto de curso no disponible.' })
  }

  const data = await getCompletionStatus(moodleUrl, courseId, userId)

  const activities = (data?.statuses ?? []).map((s) => ({
    cmid: s.cmid,
    modname: s.modname,
    state: s.state, // 0=incompleto, 1=completo, 2=completo+aprobado, 3=completo+reprobado
    timecompleted: s.timecompleted ?? 0,
  }))

  const total = activities.length
  const completed = activities.filter((a) => a.state > 0).length
  const percent = total ? Math.round((completed / total) * 100) : 0

  return res.json({ activities, total, completed, percent })
}
