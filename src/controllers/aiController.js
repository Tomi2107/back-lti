import { createHash } from 'crypto'
import { AiCache } from '../models/AiCache.js'
import { summarize, simplify, extractKeyConcepts } from '../services/aiService.js'

const VALID_MODES = ['summary', 'simplify', 'key_concepts']

export const processAI = async (req, res) => {
  const { activity_id } = req.params
  const { mode, text } = req.body

  if (!VALID_MODES.includes(mode)) {
    return res.status(400).json({ error: `mode debe ser uno de: ${VALID_MODES.join(', ')}` })
  }
  if (!text || typeof text !== 'string' || text.trim().length < 20) {
    return res.status(400).json({ error: 'El texto es demasiado corto o inválido.' })
  }

  const trimmed = text.trim()
  const text_hash = createHash('sha256').update(trimmed).digest('hex')

  // Consultar caché
  const cached = await AiCache.findOne({ text_hash })
  const cacheField = mode === 'summary' ? 'generated_summary' : mode === 'simplify' ? 'simplified_text' : 'key_concepts'

  if (cached?.[cacheField]) {
    return res.json({ activity_id, mode, result: cached[cacheField], from_cache: true })
  }

  // Llamar al LLM
  let result
  if (mode === 'summary') result = await summarize(trimmed)
  else if (mode === 'simplify') result = await simplify(trimmed)
  else result = await extractKeyConcepts(trimmed)

  // Guardar en caché
  await AiCache.findOneAndUpdate(
    { text_hash },
    { $set: { activity_id, text_hash, [cacheField]: result } },
    { upsert: true }
  )

  return res.json({ activity_id, mode, result, from_cache: false })
}
