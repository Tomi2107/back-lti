import { createHash } from 'crypto'
import { prisma } from '../lib/prisma.js'
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

  const cached = await prisma.aiCache.findUnique({ where: { text_hash } })
  const cacheField = mode === 'summary' ? 'generated_summary' : mode === 'simplify' ? 'simplified_text' : 'key_concepts'

  if (cached?.[cacheField]) {
    return res.json({ activity_id, mode, result: cached[cacheField], from_cache: true })
  }

  let result
  if (mode === 'summary') result = await summarize(trimmed)
  else if (mode === 'simplify') result = await simplify(trimmed)
  else result = await extractKeyConcepts(trimmed)

  await prisma.aiCache.upsert({
    where: { text_hash },
    update: { [cacheField]: result },
    create: { text_hash, activity_id, [cacheField]: result },
  })

  return res.json({ activity_id, mode, result, from_cache: false })
}
