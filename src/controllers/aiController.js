import { summarize, simplify } from '../services/aiService.js'

export const summarizeText = async (req, res) => {
  const { text } = req.body
  if (!text || typeof text !== 'string' || text.trim().length < 20) {
    return res.status(400).json({ error: 'El texto es demasiado corto o inválido.' })
  }
  const result = await summarize(text.trim())
  return res.json({ result })
}

export const simplifyText = async (req, res) => {
  const { text } = req.body
  if (!text || typeof text !== 'string' || text.trim().length < 20) {
    return res.status(400).json({ error: 'El texto es demasiado corto o inválido.' })
  }
  const result = await simplify(text.trim())
  return res.json({ result })
}
