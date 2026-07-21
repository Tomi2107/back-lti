import { createHash } from 'crypto'
import { prisma } from '../lib/prisma.js'
import {
  summarize,
  simplify,
  extractKeyConcepts
} from '../services/aiService.js'

const VALID_MODES = [
  'summary',
  'simplify',
  'key_concepts'
]

export const processAI = async (req, res) => {

  try {

    const { activity_id } = req.params

    const {
      moodle_user_sub,
      moodle_course_id
    } = res.locals.moodleUser

    let { mode, text } = req.body

    if (!VALID_MODES.includes(mode)) {

      return res.status(400).json({
        error: `mode debe ser uno de: ${VALID_MODES.join(', ')}`
      })

    }

    /*
        Si el frontend no envía el texto,
        intentamos obtenerlo desde la cache.
    */

    if (!text) {

      const cachedContent =
        await prisma.moodleCourseCache.findUnique({

          where: {
            activity_id
          }

        })

      if (!cachedContent) {

        return res.status(404).json({
          error: 'No existe contenido almacenado para esta actividad.'
        })

      }

      text = cachedContent.content_text_raw

    }

    if (
      typeof text !== 'string' ||
      text.trim().length < 20
    ) {

      return res.status(400).json({
        error: 'El texto es demasiado corto o inválido.'
      })

    }

    const trimmed = text.trim()

    const text_hash =
      createHash('sha256')
        .update(trimmed)
        .digest('hex')

    /*
        Buscar cache IA
    */

    const cachedAI =
      await prisma.aiCache.findUnique({

        where: {
          text_hash
        }

      })

    const cacheField =
      mode === 'summary'
        ? 'generated_summary'
        : mode === 'simplify'
          ? 'simplified_text'
          : 'key_concepts'

    if (cachedAI?.[cacheField]) {

      return res.json({

        activity_id,

        moodle_course_id,

        mode,

        result: cachedAI[cacheField],

        from_cache: true

      })

    }

    /*
        Ejecutar IA
    */

    let result

    switch (mode) {

      case 'summary':

        result = await summarize(trimmed)

        break

      case 'simplify':

        result = await simplify(trimmed)

        break

      case 'key_concepts':

        result = await extractKeyConcepts(trimmed)

        break

    }

    /*
        Guardar cache
    */

    await prisma.aiCache.upsert({

      where: {
        text_hash
      },

      update: {

        moodle_user_sub,

        moodle_course_id,

        activity_id,

        [cacheField]: result,

        generated_at: new Date()

      },

      create: {

        text_hash,

        moodle_user_sub,

        moodle_course_id,

        activity_id,

        [cacheField]: result,

        generated_at: new Date()

      }

    })

    /*
        Registrar evento IA
    */

    if (res.locals.moodleUser.session_id) {

      await prisma.eventLog.create({

        data: {

          session_id: res.locals.moodleUser.session_id,

          event_type: 'AI_COGNITIVE_REQUEST',

          resultado: 'SUCCESS',

          timestamp: new Date(),

          payload: {

            request_type: mode,

            activity_id,

            moodle_course_id

          }

        }

      })

    }

    return res.json({

      activity_id,

      moodle_course_id,

      mode,

      result,

      from_cache: false

    })

  }

  catch (error) {

    console.error(error)

    return res.status(500).json({

      error: 'Error procesando la solicitud de IA.'

    })

  }

}