import { prisma } from '../lib/prisma.js'


export const getMe = async (req, res) => {

  try {

    const { moodle_user_sub } = res.locals.moodleUser

    const user = await prisma.user.findUnique({
      where:{
        moodle_user_sub
      }
    })


    if(!user){
      return res.status(404).json({
        error:"Usuario no encontrado"
      })
    }


    return res.json({

      moodle_user_sub:user.moodle_user_sub,

      accessibility_settings:
        user.accessibility_settings,

      onboarding_completed:
        user.onboarding_completed,

      created_at:user.created_at,
      updated_at:user.updated_at

    })


  } catch(error){

    console.error("ERROR GET ME:",error)

    return res.status(500).json({
      error:"Error obteniendo usuario"
    })

  }

}

export async function getAccessibility(req,res){

    try {

        const { moodle_user_sub } =
            res.locals.moodleUser


        const user =
            await prisma.user.findUnique({

                where:{
                    moodle_user_sub
                }

            })


        if(!user){

            return res.status(404).json({
                error:"Usuario no encontrado"
            })

        }


        return res.json({

            accessibility_settings:
                user.accessibility_settings || {}

        })


    } catch(error){

        console.error(
            "ERROR GET ACCESSIBILITY:",
            error
        )


        return res.status(500).json({

            error:"Error obteniendo preferencias"

        })

    }

}

export async function updateAccessibility(req, res) {

    try {

        const { moodle_user_sub } = res.locals.moodleUser;

        if (!moodle_user_sub) {
            return res.status(401).json({
                error: "Usuario no autenticado"
            });
        }

        console.log("GUARDANDO ACCESSIBILITY:", req.body);

        const currentUser = await prisma.user.findUnique({
            where: {
                moodle_user_sub
            }
        });

        if (!currentUser) {
            return res.status(404).json({
                error: "Usuario no encontrado"
            });
        }

        const nuevasPreferencias = {
            ...(currentUser.accessibility_settings || {}),
            ...req.body
        };

        const user = await prisma.user.update({

            where: {
                moodle_user_sub
            },

            data: {
                accessibility_settings: nuevasPreferencias
            }

        });

        return res.json({

            ok: true,

            accessibility_settings: user.accessibility_settings

        });

    } catch (error) {

        console.error("ERROR UPDATE ACCESSIBILITY:", error);

        return res.status(500).json({
            error: "Error guardando preferencias"
        });

    }

}

export const updateOnboarding = async (req, res) => {

  try {

    const { moodle_user_sub } = res.locals.moodleUser

    const { onboarding_completed } = req.body


    if (typeof onboarding_completed !== 'boolean') {

      return res.status(400).json({
        error: 'onboarding_completed debe ser boolean.'
      })

    }


    const user = await prisma.user.update({

      where:{
        moodle_user_sub
      },

      data:{
        onboarding_completed
      }

    })


    return res.json({

      onboarding_completed:
        user.onboarding_completed

    })


  } catch(error){

    console.error(
      "ERROR UPDATE ONBOARDING:",
      error
    )

    return res.status(500).json({
      error:"Error actualizando onboarding"
    })

  }

}