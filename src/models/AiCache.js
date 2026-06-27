import { Schema, model } from 'mongoose'

const AiCacheSchema = new Schema(
  {
    activity_id: { type: String, index: true },
    text_hash: { type: String, required: true, unique: true, index: true },
    generated_summary: { type: String, default: null },
    simplified_text: { type: String, default: null },
    key_concepts: { type: String, default: null },
  },
  { _id: true }
)

export const AiCache = model('AiCache', AiCacheSchema)
