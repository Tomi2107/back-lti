import { prisma } from '../lib/prisma.js'


const DEFAULT_SETTINGS = {

  contrast_mode:false,
  dark_mode:false,

  font_family:'default',
  font_size:'normal',
  alignment:'left',

  brightness:50,
  contrast:50,
  saturation:50,

  grayscale:false,

  voice:false,
  voice_speed:50,
  voice_volume:100,

  button_position:'right'

}



function mergeSettings(settings={}){

  return {
    ...DEFAULT_SETTINGS,
    ...(settings || {})
  }

}



export async function getAccessibility(req,res){

  try {

    const { moodle_user_sub } =
      res.locals.moodleUser


    const profile =
      await prisma.accessibilityProfile.findFirst({

        where:{
          user:{
            moodle_user_sub
          }
        }

      })


    return res.json({

      accessibility_settings:
        mergeSettings(
          profile?.settings
        )

    })


  }catch(error){

    console.error(
      "ERROR GET ACCESSIBILITY",
      error
    )


    return res.status(500).json({
      error:"Error obteniendo preferencias"
    })

  }

}