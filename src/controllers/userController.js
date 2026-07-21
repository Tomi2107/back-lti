import { prisma } from '../lib/prisma.js'

export const getMe = async (req, res) => {
  const { moodle_user_sub } = res.locals.moodleUser
  const user = await prisma.user.findUnique({ where: { moodle_user_sub } })
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' })
  return res.json({
    moodle_user_sub: user.moodle_user_sub,
    accessibility_settings: {
      contrast_mode: user.contrast_mode,
      font_size: user.font_size,
      font_family: user.font_family,
    },
    onboarding_completed: user.onboarding_completed,
    created_at: user.created_at,
    updated_at: user.updated_at,
  })
}

export async function updateAccessibility(req,res){

    try {

        const moodleUser = res.locals.moodleUser;

        const userSub = moodleUser.moodle_user_sub;
        
        if(!moodleUser){
            return res.status(401).json({
                error:"Usuario no autenticado"
            });
        }


        const user = await prisma.user.update({

            where:{
                moodle_user_sub: moodleUser.moodle_user_sub
            },

            data:{
                accessibility_settings: req.body
            }

        });


        return res.json({
            ok:true,
            user
        });


    } catch(error){

        console.error(
            "ERROR UPDATE ACCESSIBILITY:",
            error
        );


        return res.status(500).json({
            error:"Error guardando preferencias"
        });

    }
}

export const updateOnboarding = async (req, res) => {
  const { moodle_user_sub } = res.locals.moodleUser
  const { onboarding_completed } = req.body

  if (typeof onboarding_completed !== 'boolean') {
    return res.status(400).json({ error: 'onboarding_completed debe ser boolean.' })
  }

  const user = await prisma.user.update({ where: { moodle_user_sub }, data: { onboarding_completed } })
  return res.json({ onboarding_completed: user.onboarding_completed })
}
