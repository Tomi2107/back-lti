import { prisma } from '../lib/prisma.js'


const DEFAULT_SETTINGS = {

    contrast_mode: false,
    dark_mode: false,

    font_family: 'default',
    font_size: 'normal',
    alignment: 'left',

    brightness: 50,
    contrast: 50,
    saturation: 50,

    grayscale: false,

    voice: false,
    voice_speed: 50,
    voice_volume: 100,

    button_position: 'right',

    profile: null

}



function mergeSettings(settings = {}) {

    return {

        ...DEFAULT_SETTINGS,

        ...(settings || {})

    }

}



// ======================================================
// GET PREFERENCIAS
// GET /api/v1/users/me/accessibility
// ======================================================

export async function getAccessibility(req, res) {


    console.log(
        "USER EN CONTROLLER:",
        res.locals.moodleUser
    )


    try {


        const { moodle_user_sub } =
            res.locals.moodleUser



        const user =
            await prisma.user.findUnique({

                where: {
                    moodle_user_sub
                }

            })



        if (!user) {

            return res.status(404).json({

                error: "Usuario no encontrado"

            })

        }



        const profile =
            await prisma.accessibilityProfile.findUnique({

                where: {

                    userId_name: {

                        userId: user.id,

                        name: "default"

                    }

                }

            })



        return res.json({

            accessibility_settings:
                mergeSettings(
                    profile?.settings || {}
                )

        })



    } catch(error) {


        console.error(
            "ERROR GET ACCESSIBILITY:",
            error
        )


        return res.status(500).json({

            error:"Error obteniendo preferencias"

        })


    }

}



// ======================================================
// UPDATE PREFERENCIAS
// PATCH /api/v1/users/me/accessibility
// ======================================================

export const updateAccessibility = async (req, res) => {

  try {

    console.log("========== UPDATE ACCESSIBILITY ==========")

    console.log("1) req.user:")
    console.log(req.user)


    const moodle_user_sub = req.user.moodle_user_sub

    console.log("2) moodle_user_sub obtenido:", moodle_user_sub)


    console.log("3) Ejecutando User upsert...")


    const user = await prisma.user.upsert({

      where: {
        moodle_user_sub
      },

      update: {},

      create: {
        moodle_user_sub
      }

    })


    console.log("4) User OK:")
    console.log(user)



    console.log("5) Ejecutando AccessibilityProfile upsert...")


    const profile = await prisma.accessibilityProfile.upsert({

      where: {
        userId_name: {
          userId: user.id,
          name: "default"
        }
      },


      update: {
        settings: req.body
      },


      create: {

        userId: user.id,

        name: "default",

        settings: req.body

      }

    })


    console.log("6) Profile OK:")
    console.log(profile)



    console.log("7) Respondiendo OK")


    return res.json({

      ok: true,

      profile

    })


  } catch(error) {


    console.error("🔥 ERROR UPDATE ACCESSIBILITY")

    console.error(error)


    return res.status(500).json({

      error: "Error actualizando accesibilidad",

      detalle: error.message

    })

  }

}



// ======================================================
// RESET PREFERENCIAS
// POST /api/v1/users/me/accessibility/reset
// ======================================================

export async function resetAccessibility(req,res){


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



        await prisma.accessibilityProfile.update({

            where:{

                userId_name:{

                    userId:user.id,

                    name:"default"

                }

            },

            data:{

                settings:DEFAULT_SETTINGS

            }

        })



        return res.json({

            ok:true,

            accessibility_settings:
                DEFAULT_SETTINGS

        })



    }catch(error){


        console.error(
            "ERROR RESET ACCESSIBILITY:",
            error
        )


        return res.status(500).json({

            error:"Error restaurando preferencias"

        })


    }

}