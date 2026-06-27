import { Schema, model } from 'mongoose'

const AccessibilitySettingsSchema = new Schema(
  {
    contrast_mode: {
      type: String,
      enum: ['normal', 'dark', 'high-contrast'],
      default: 'normal',
    },
    font_size: { type: Number, default: 16 },
    font_family: {
      type: String,
      enum: ['Arial', 'OpenDyslexic', 'Verdana'],
      default: 'Arial',
    },
  },
  { _id: false }
)

const UserSchema = new Schema(
  {
    moodle_user_sub: { type: String, required: true, unique: true, index: true },
    accessibility_settings: { type: AccessibilitySettingsSchema, default: () => ({}) },
    onboarding_completed: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
)

export const User = model('User', UserSchema)
