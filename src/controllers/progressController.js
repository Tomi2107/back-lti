import { UserProgress } from '../models/UserProgress.js'

export const getProgress = async (req, res) => {
  const { moodle_user_sub } = res.locals.moodleUser
  const { course_id } = req.query

  const filter = { moodle_user_sub }
  // course_id es informativo; UserProgress no almacena course_id pero puede filtrarse si se añade
  const items = await UserProgress.find(filter).sort({ due_date: 1, last_interaction_timestamp: -1 })

  const total = items.length
  const completed = items.filter((i) => i.status === 'COMPLETED').length
  const completion_percentage = total ? Math.round((completed / total) * 100) : 0

  return res.json({
    course_id: course_id ?? null,
    completion_percentage,
    items: items.map((i) => ({
      moodle_activity_id: i.moodle_activity_id,
      status: i.status,
      due_date: i.due_date ?? null,
      last_interaction_timestamp: i.last_interaction_timestamp,
    })),
  })
}

export const updateProgress = async (req, res) => {
  const { moodle_user_sub } = res.locals.moodleUser
  const { activity_id } = req.params
  const { status } = req.body

  const VALID = ['PENDING', 'IN_PROGRESS', 'COMPLETED']
  if (!VALID.includes(status)) {
    return res.status(400).json({ error: `status debe ser uno de: ${VALID.join(', ')}` })
  }

  const item = await UserProgress.findOneAndUpdate(
    { moodle_user_sub, moodle_activity_id: activity_id },
    { $set: { status, last_interaction_timestamp: new Date() } },
    { upsert: true, new: true, runValidators: true }
  )

  return res.json({
    moodle_activity_id: item.moodle_activity_id,
    status: item.status,
    last_interaction_timestamp: item.last_interaction_timestamp,
  })
}

export const getSuggestions = async (req, res) => {
  const { moodle_user_sub } = res.locals.moodleUser
  const limit = Math.min(parseInt(req.query.limit ?? '5', 10), 20)

  const items = await UserProgress.find({
    moodle_user_sub,
    status: { $in: ['PENDING', 'IN_PROGRESS'] },
  })
    .sort({ due_date: 1, last_interaction_timestamp: -1 })
    .limit(limit)

  return res.json({
    suggestions: items.map((item, idx) => ({
      moodle_activity_id: item.moodle_activity_id,
      status: item.status,
      due_date: item.due_date ?? null,
      priority: idx + 1,
    })),
  })
}
