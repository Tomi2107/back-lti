import mongoose from 'mongoose'

const preferencesSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    platformUrl: { type: String, required: true },
    preferences: {
      fontSize: { type: Number, default: 100 },
      fontFamily: { type: String, default: 'default', enum: ['default', 'serif', 'dyslexic'] },
      contrast: { type: String, default: 'default', enum: ['default', 'dark', 'high', 'yellow'] },
      lineHeight: { type: Number, default: 1.5 },
      wordSpacing: { type: Number, default: 0 },
      readingGuide: { type: Boolean, default: false },
      pageMask: { type: Boolean, default: false },
      ttsEnabled: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
)

preferencesSchema.index({ userId: 1, platformUrl: 1 }, { unique: true })

export const UserPreferences = mongoose.model('UserPreferences', preferencesSchema)
