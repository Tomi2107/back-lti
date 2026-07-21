import { prisma } from "../lib/prisma.js";

/*
|--------------------------------------------------------------------------
| Obtener todos los perfiles
|--------------------------------------------------------------------------
*/
export async function getProfiles(req, res) {

    return res.json({

        profiles: [

            {
                id: "vision",
                name: "Baja visión"
            },

            {
                id: "dyslexia",
                name: "Dislexia"
            },

            {
                id: "focus",
                name: "Concentración"
            },

            {
                id: "voice",
                name: "Asistencia de voz"
            }

        ]

    });

}

/*
|--------------------------------------------------------------------------
| Obtener un perfil
|--------------------------------------------------------------------------
*/
export async function getProfile(req, res) {

    return res.status(501).json({

        error: "No implementado"

    });

}

/*
|--------------------------------------------------------------------------
| Crear perfil personalizado
|--------------------------------------------------------------------------
*/
export async function createProfile(req, res) {

    return res.status(501).json({

        error: "No implementado"

    });

}

/*
|--------------------------------------------------------------------------
| Actualizar perfil
|--------------------------------------------------------------------------
*/
export async function updateProfile(req, res) {

    return res.status(501).json({

        error: "No implementado"

    });

}

/*
|--------------------------------------------------------------------------
| Eliminar perfil
|--------------------------------------------------------------------------
*/
export async function deleteProfile(req, res) {

    return res.status(501).json({

        error: "No implementado"

    });

}

/*
|--------------------------------------------------------------------------
| Duplicar perfil
|--------------------------------------------------------------------------
*/
export async function duplicateProfile(req, res) {

    return res.status(501).json({

        error: "No implementado"

    });

}

/*
|--------------------------------------------------------------------------
| Aplicar perfil al usuario
|--------------------------------------------------------------------------
*/
export async function applyProfile(req, res) {

    return res.status(501).json({

        error: "No implementado"

    });

}

/*
|--------------------------------------------------------------------------
| Restaurar perfil por defecto
|--------------------------------------------------------------------------
*/
export async function resetProfile(req, res) {

    return res.status(501).json({

        error: "No implementado"

    });

}

/*
|--------------------------------------------------------------------------
| Validar perfil
|--------------------------------------------------------------------------
*/
export async function validateProfile(req, res) {

    return res.status(501).json({

        error: "No implementado"

    });

}

/*
|--------------------------------------------------------------------------
| Construir perfil automáticamente
|--------------------------------------------------------------------------
*/
export async function buildProfile(req, res) {

    return res.status(501).json({

        error: "No implementado"

    });

}