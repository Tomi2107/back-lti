import { User } from '../models/User.js'

export const getMe = async (req, res) => {
  const { moodle_user_sub } = res.locals.moodleUser
  const user = await User.findOne({ moodle_user_sub })
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' })
  return res.json({
    moodle_user_sub: user.moodle_user_sub,
    accessibility_settings: user.accessibility_settings,
    onboarding_completed: user.onboarding_completed,
    created_at: user.created_at,
    updated_at: user.updated_at,
  })
}

export const updateAccessibility = async (req, res) => {
  const { moodle_user_sub } = res.locals.moodleUser
  const allowed = ['contrast_mode', 'font_size', 'font_family']
  const updates = {}

  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[`accessibility_settings.${key}`] = req.body[key]
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No se enviaron campos válidos.' })
  }

  const user = await User.findOneAndUpdate(
    { moodle_user_sub },
    { $set: updates },
    { new: true, runValidators: true }
  )

  return res.json({ accessibility_settings: user.accessibility_settings, updated_at: user.updated_at })
}

export const updateOnboarding = async (req, res) => {
  const { moodle_user_sub } = res.locals.moodleUser
  const { onboarding_completed } = req.body

  if (typeof onboarding_completed !== 'boolean') {
    return res.status(400).json({ error: 'onboarding_completed debe ser boolean.' })
  }

  const user = await User.findOneAndUpdate(
    { moodle_user_sub },
    { $set: { onboarding_completed } },
    { new: true }
  )

  return res.json({ onboarding_completed: user.onboarding_completed })
}
