import { Router } from 'express'

import {

    getAccessibility,
    updateAccessibility,
    resetAccessibility

} from '../controllers/accessibilityController.js'


const router = Router()


// Obtener configuración FARO
router.get(
    '/',
    getAccessibility
)


// Guardar configuración FARO
router.patch(
    '/',
    updateAccessibility
)


// Restaurar valores por defecto
router.post(
    '/reset',
    resetAccessibility
)


export default router