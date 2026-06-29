import { prisma } from '../lib/prisma.js'

export const getProgress = async (req, res) => {
  const { moodle_user_sub } = res.locals.moodleUser
  const { course_id } = req.query

  const where = { moodle_user_sub }
  if (course_id) where.moodle_course_id = course_id

  const items = await prisma.userProgress.findMany({
    where,
    orderBy: [{ due_date: 'asc' }, { last_interaction_timestamp: 'desc' }],
  })

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

  const item = await prisma.userProgress.upsert({
    where: { moodle_user_sub_moodle_activity_id: { moodle_user_sub, moodle_activity_id: activity_id } },
    update: { status, last_interaction_timestamp: new Date() },
    create: { moodle_user_sub, moodle_activity_id: activity_id, status, last_interaction_timestamp: new Date() },
  })

  return res.json({
    moodle_activity_id: item.moodle_activity_id,
    status: item.status,
    last_interaction_timestamp: item.last_interaction_timestamp,
  })
}

export const getSuggestions = async (req, res) => {
  const { moodle_user_sub } = res.locals.moodleUser
  const limit = Math.min(parseInt(req.query.limit ?? '5', 10), 20)
  const { course_id } = req.query

  const where = { moodle_user_sub, status: { in: ['PENDING', 'IN_PROGRESS'] } }
  if (course_id) where.moodle_course_id = course_id

  const items = await prisma.userProgress.findMany({
    where,
    orderBy: [{ due_date: 'asc' }, { last_interaction_timestamp: 'desc' }],
    take: limit,
  })

  return res.json({
    suggestions: items.map((item, idx) => ({
      moodle_activity_id: item.moodle_activity_id,
      status: item.status,
      due_date: item.due_date ?? null,
      priority: idx + 1,
    })),
  })
}
