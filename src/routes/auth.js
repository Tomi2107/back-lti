import { Router } from 'express'

import {
    login,
    logout,
    refreshToken,
    me
} from '../controllers/authController.js'


const router = Router()


router.post(
    '/login',
    login
)


router.post(
    '/logout',
    logout
)


router.post(
    '/refresh',
    refreshToken
)


router.get(
    '/me',
    me
)


export default router