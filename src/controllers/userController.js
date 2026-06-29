import { prisma } from '../lib/prisma.js'

export const getMe = async (req, res) => {
  const { moodle_user_sub } = res.locals.moodleUser
  const user = await prisma.user.findUnique({ where: { moodle_user_sub } })
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' })
  return res.json({
    moodle_user_sub: user.moodle_user_sub,
    accessibility_settings: {
      contrast_mode: user.contrast_mode,
      font_size: user.font_size,
      font_family: user.font_family,
    },
    onboarding_completed: user.onboarding_completed,
    created_at: user.created_at,
    updated_at: user.updated_at,
  })
}

export const updateAccessibility = async (req, res) => {
  const { moodle_user_sub } = res.locals.moodleUser
  const { contrast_mode, font_size, font_family } = req.body
  const data = {}

  if (contrast_mode !== undefined) data.contrast_mode = contrast_mode
  if (font_size !== undefined) data.font_size = font_size
  if (font_family !== undefined) data.font_family = font_family

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: 'No se enviaron campos válidos.' })
  }

  const user = await prisma.user.update({ where: { moodle_user_sub }, data })
  return res.json({
    accessibility_settings: {
      contrast_mode: user.contrast_mode,
      font_size: user.font_size,
      font_family: user.font_family,
    },
    updated_at: user.updated_at,
  })
}

export const updateOnboarding = async (req, res) => {
  const { moodle_user_sub } = res.locals.moodleUser
  const { onboarding_completed } = req.body

  if (typeof onboarding_completed !== 'boolean') {
    return res.status(400).json({ error: 'onboarding_completed debe ser boolean.' })
  }

  const user = await prisma.user.update({ where: { moodle_user_sub }, data: { onboarding_completed } })
  return res.json({ onboarding_completed: user.onboarding_completed })
}
