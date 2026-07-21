import { Router } from 'express'

import {
    getProfiles,
    getProfile,
    applyProfile
} from '../controllers/profileController.js'


const router = Router()


// Lista perfiles disponibles
router.get(
    '/',
    getProfiles
)


// Ver un perfil específico
router.get(
    '/:id',
    getProfile
)


// Aplicar perfil al usuario actual
router.post(
    '/:id/apply',
    applyProfile
)


export default router