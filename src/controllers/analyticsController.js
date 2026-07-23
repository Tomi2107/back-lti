import { prisma } from "../lib/prisma.js";

/* =========================================
   DASHBOARD GENERAL
========================================= */

import { prisma } from '../lib/prisma.js';

export async function getDashboard(req, res) {

    try {

        // =====================================================
        // RESUMEN GENERAL
        // =====================================================

        const users = await prisma.user.count();

        const sessions = await prisma.session.count();

        const avgSessionsPerUser =
            users > 0
                ? Number((sessions / users).toFixed(2))
                : 0;

        // =====================================================
        // CURSOS
        // =====================================================

        const distinctCourses = await prisma.session.findMany({
            distinct: ['moodle_course_id'],
            select: {
                moodle_course_id: true
            }
        });

        const courses =
            distinctCourses.filter(c => c.moodle_course_id).length;

        // =====================================================
        // FECHAS
        // =====================================================

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const week = new Date();
        week.setDate(week.getDate() - 7);

        const month = new Date();
        month.setMonth(month.getMonth() - 1);

        // =====================================================
        // USUARIOS ACTIVOS
        // =====================================================

        const activeToday = await prisma.session.findMany({

            where: {
                started_at: {
                    gte: today
                }
            },

            distinct: ['moodle_user_sub']

        });

        const activeWeek = await prisma.session.findMany({

            where: {
                started_at: {
                    gte: week
                }
            },

            distinct: ['moodle_user_sub']

        });

        const activeMonth = await prisma.session.findMany({

            where: {
                started_at: {
                    gte: month
                }
            },

            distinct: ['moodle_user_sub']

        });

        // =====================================================
        // MODO CONCENTRACIÓN
        // =====================================================

        const focus = await prisma.session.aggregate({

            _sum: {
                focus_mode_total_seconds: true
            },

            _avg: {
                focus_mode_total_seconds: true
            },

            _max: {
                focus_mode_total_seconds: true
            }

        });

        // =====================================================
        // IA
        // =====================================================

        const aiSummaries =
            await prisma.aiCache.count();

        // =====================================================
        // CACHE MOODLE
        // =====================================================

        const cachedActivities =
            await prisma.moodleCourseCache.count();

        // =====================================================
        // EVENTOS
        // =====================================================

        const totalEvents =
            await prisma.eventLog.count();

        // =====================================================
        // PERFILES
        // =====================================================

        const profiles =
            await prisma.accessibilityProfile.count();

        // =====================================================
        // RESPUESTA
        // =====================================================

        return res.json({

            generated_at: new Date(),

            summary: {

                users,

                sessions,

                avgSessionsPerUser,

                courses,

                activeToday: activeToday.length,

                activeWeek: activeWeek.length,

                activeMonth: activeMonth.length

            },

            focus: {

                totalHours:

                    Number(
                        (
                            (focus._sum.focus_mode_total_seconds ?? 0)
                            / 3600
                        ).toFixed(2)
                    ),

                averageMinutes:

                    Number(
                        (
                            (focus._avg.focus_mode_total_seconds ?? 0)
                            / 60
                        ).toFixed(1)
                    ),

                maxMinutes:

                    Number(
                        (
                            (focus._max.focus_mode_total_seconds ?? 0)
                            / 60
                        ).toFixed(1)
                    )

            },

            cache: {

                aiSummaries,

                cachedActivities

            },

            accessibility: {

                profiles

            },

            events: {

                totalEvents

            }

        });

    }

    catch (err) {

        console.error(err);

        return res.status(500).json({

            error: 'No se pudo generar el dashboard.',

            details: err.message

        });

    }

}

/* =========================================
   ANALÍTICAS DE USUARIO
========================================= */

export async function getUserAnalytics(req, res) {

    return res.json({
        ok: true,
        message: "User Analytics"
    });

}

/* =========================================
   ANALÍTICAS DE CURSOS
========================================= */

export async function getCourseAnalytics(req, res) {

    return res.json({
        ok: true,
        message: "Course Analytics"
    });

}

/* =========================================
   ANALÍTICAS DE ACCESIBILIDAD
========================================= */

export async function getAccessibilityAnalytics(req, res) {

    return res.json({
        ok: true,
        message: "Accessibility Analytics"
    });

}

/* =========================================
   ANALÍTICAS DE SESIONES
========================================= */

export async function getSessionAnalytics(req, res) {

    return res.json({
        ok: true,
        message: "Session Analytics"
    });

}

/* =========================================
   ANALÍTICAS DE IA
========================================= */

export async function getAIAnalytics(req, res) {

    return res.json({
        ok: true,
        message: "AI Analytics"
    });

}

/* =========================================
   PROGRESO
========================================= */

export async function getProgressAnalytics(req, res) {

    return res.json({
        ok: true,
        message: "Progress Analytics"
    });

}

/* =========================================
   ACTIVIDAD
========================================= */

export async function getActivityAnalytics(req, res) {

    return res.json({
        ok: true,
        message: "Activity Analytics"
    });

}

/* =========================================
   MAPA DE CALOR
========================================= */

export async function getHeatmap(req, res) {

    return res.json({
        ok: true,
        message: "Heatmap"
    });

}

/* =========================================
   TIMELINE
========================================= */

export async function getTimeline(req, res) {

    return res.json({
        ok: true,
        message: "Timeline"
    });

}

/* =========================================
   ESTADÍSTICAS DE USO
========================================= */

export async function getUsageStatistics(req, res) {

    return res.json({
        ok: true,
        message: "Usage Statistics"
    });

}

/* =========================================
   RECOMENDACIONES
========================================= */

export async function getRecommendations(req, res) {

    return res.json({
        ok: true,
        message: "Analytics Recommendations"
    });

}