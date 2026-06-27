import { env } from '../config/env.js'

async function callMoodle(moodleUrl, wsfunction, params = {}) {
  const url = new URL('/webservice/rest/server.php', moodleUrl)
  url.searchParams.set('wstoken', env.moodleServiceToken)
  url.searchParams.set('wsfunction', wsfunction)
  url.searchParams.set('moodlerestformat', 'json')

  for (const [key, val] of Object.entries(params)) {
    url.searchParams.set(key, String(val))
  }

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Moodle API HTTP ${res.status}`)

  const data = await res.json()
  if (data?.exception) throw new Error(data.message ?? 'Error en Moodle API')

  return data
}

export const getCourseContents = async (moodleUrl, courseId) => {
  return callMoodle(moodleUrl, 'core_course_get_contents', { courseid: courseId })
}

export const getActivityContent = async (moodleUrl, activityId) => {
  // Intenta obtener el contenido del módulo por su ID
  // Moodle no tiene un endpoint directo; buscamos en todos los cursos del módulo
  try {
    const data = await callMoodle(moodleUrl, 'core_course_get_contents', {
      courseid: 0, // se ignora; usamos el cmid
      options: JSON.stringify([{ name: 'cmid', value: activityId }]),
    })

    for (const section of data ?? []) {
      for (const mod of section.modules ?? []) {
        if (String(mod.id) === String(activityId)) {
          return mod.description ?? mod.intro ?? ''
        }
      }
    }
  } catch {
    // fallback vacío
  }
  return ''
}

export const getCompletionStatus = async (moodleUrl, courseId, userId) => {
  return callMoodle(moodleUrl, 'core_completion_get_activities_completion_status', {
    courseid: courseId,
    userid: userId,
  })
}
