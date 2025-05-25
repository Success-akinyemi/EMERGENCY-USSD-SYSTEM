import express from 'express'
import * as controllers from '../../controllers/hospital/hospitalAuth.controllers.js'
import { uploadMiddleware } from '../../middlewares/utils.js'
import { AuthenticateHospital, VerifyAccount } from '../../middlewares/auth/hospitalAuth.js'

const router = express.Router()

//GET
router.post('/register', uploadMiddleware, controllers.register)
router.post('/login', controllers.login)
router.post('/resetPassword', controllers.resetPassword)
router.post('/updateHospital', AuthenticateHospital, VerifyAccount, uploadMiddleware, controllers.updateHospital)
router.post('/updatePassword', controllers.updatePassword)
router.post('/logout', controllers.logout)

//GET
router.get('/verifyToken', controllers.verifyToken)


export default router