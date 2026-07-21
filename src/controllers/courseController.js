import { getCourseContents } from '../services/moodleService.js'
import { prisma } from '../lib/prisma.js'

export const getCourseStructure = async (req, res) => {

  const { course_id } = req.params
  const { moodleUrl } = res.locals.moodleUser

  if (!moodleUrl) {
    return res.status(400).json({
      error: 'URL de Moodle no disponible.'
    })
  }

  const sections = await getCourseContents(
    moodleUrl,
    course_id
  )

  const now = new Date()

  const cacheOps = []

  for (const section of sections) {

    for (const mod of section.modules ?? []) {

      const content =
        mod.description ??
        mod.intro ??
        ''

      cacheOps.push(

        prisma.moodleCourseCache.upsert({

          where: {

            activity_id: String(mod.id)

          },

          update: {

            moodle_course_id: String(course_id),

            activity_name: mod.name ?? '',

            activity_type: mod.modname ?? 'resource',

            content_text_raw: content,

            updated_at: now

          },

          create: {

            activity_id: String(mod.id),

            moodle_course_id: String(course_id),

            activity_name: mod.name ?? '',

            activity_type: mod.modname ?? 'resource',

            content_text_raw: content

          }

        })

      )

    }

  }

  await Promise.allSettled(cacheOps)

  const modules = sections.map((section) => ({

    id: String(section.id),

    name: section.name ?? '',

    activities: (section.modules ?? [])

      .filter((m) => m.visible !== 0)

      .map((m) => ({

        activity_id: String(m.id),

        name: m.name ?? '',

        type: m.modname ?? 'resource',

        visible: Boolean(m.visible),

        url: m.url ?? null,

        description:
          m.description ??
          m.intro ??
          '',

        completion:
          m.completion ?? null,

        completiondata:
          m.completiondata ?? null,

        availability:
          m.availabilityinfo ?? null,

        indent:
          m.indent ?? 0

      }))

  }))

  const totalActivities =
    modules.reduce(

      (total, section) =>
        total + section.activities.length,

      0

    )

  return res.json({

    course_id: String(course_id),

    course_name:
      sections[0]?.coursename ??
      null,

    total_activities:
      totalActivities,

    modules

  })

}