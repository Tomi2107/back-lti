import { Router } from 'express'

import {
  getAccessibility,
  updateAccessibility,
  resetAccessibility
} from '../controllers/accessibilityController.js'


const router = Router()


// Obtener configuración FARO
router.get(
  '/me/accessibility',
  getAccessibility
)


// Guardar configuración FARO
router.patch(
  '/me/accessibility',
  updateAccessibility
)


// Restaurar valores por defecto
router.post(
  '/me/accessibility/reset',
  resetAccessibility
)


export default router