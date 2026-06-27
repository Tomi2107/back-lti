import { env } from '../config/env.js'

async function callMoodle(moodleUrl, wsfunction, params = {}) {
  const url = new URL('/webservice/rest/server.php', moodleUrl)
  url.searchParams.set('wstoken', env.moodleServiceToken)
  url.searchParams.set('wsfunction', wsfunction)
  url.searchParams.set('moodlerestformat', 'json')

  for (const [key, val] of Object.entries(params)) {
    url.searchParams.set(key, val)
  }

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Moodle API ${res.status}`)

  const data = await res.json()
  if (data?.exception) throw new Error(data.message ?? 'Error en Moodle API')

  return data
}

export const getCourseModules = async (moodleUrl, courseId) => {
  return callMoodle(moodleUrl, 'core_course_get_contents', { courseid: courseId })
}

export const getCompletionStatus = async (moodleUrl, courseId, userId) => {
  return callMoodle(moodleUrl, 'core_completion_get_activities_completion_status', {
    courseid: courseId,
    userid: userId,
  })
}
