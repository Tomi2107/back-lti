import Anthropic from '@anthropic-ai/sdk'
import { env } from '../config/env.js'

const client = new Anthropic({ apiKey: env.anthropicApiKey })

export const summarize = async (text) => {
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `Resume el siguiente texto de forma clara y concisa en 3-5 oraciones. Responde solo con el resumen, sin introducción ni explicación adicional.\n\n${text}`,
      },
    ],
  })
  return msg.content[0].text
}

export const simplify = async (text) => {
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 768,
    messages: [
      {
        role: 'user',
        content: `Simplifica el siguiente texto para que sea fácil de entender por cualquier persona, usando palabras sencillas y frases cortas. Mantén la información importante. Responde solo con el texto simplificado, sin introducción ni comentarios.\n\n${text}`,
      },
    ],
  })
  return msg.content[0].text
}

export const extractKeyConcepts = async (text) => {
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `Identifica y lista los 5-8 conceptos clave más importantes del siguiente texto. Para cada concepto, escribe el término y una definición breve en una línea. Usa el formato: "• Término: definición breve". Responde solo con la lista, sin introducción ni comentarios adicionales.\n\n${text}`,
      },
    ],
  })
  return msg.content[0].text
}
