import { UserPreferences } from '../models/UserPreferences.js'

const DEFAULT_PREFS = {
  fontSize: 100,
  fontFamily: 'default',
  contrast: 'default',
  lineHeight: 1.5,
  wordSpacing: 0,
  readingGuide: false,
  pageMask: false,
  ttsEnabled: false,
}

export const getPreferences = async (req, res) => {
  const { userId, platformUrl } = res.locals.moodleUser
  const doc = await UserPreferences.findOne({ userId, platformUrl })
  return res.json({ preferences: doc?.preferences ?? DEFAULT_PREFS })
}

export const savePreferences = async (req, res) => {
  const { userId, platformUrl } = res.locals.moodleUser
  const { preferences } = req.body

  const doc = await UserPreferences.findOneAndUpdate(
    { userId, platformUrl },
    { $set: { preferences } },
    { upsert: true, new: true, runValidators: true }
  )

  return res.json({ ok: true, preferences: doc.preferences })
}
