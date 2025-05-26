import express from 'express'
import * as controllers from '../controllers/emergencyUssdNotification.controllers.js'
import { uploadMiddleware } from '../middlewares/utils.js'
import { AuthenticateHospital, VerifyAccount } from '../middlewares/auth/hospitalAuth.js'

const router = express.Router()

//POST
router.post('/markNotificationAsRead', AuthenticateHospital, VerifyAccount, controllers.markNotificationAsRead)
router.post('/acceptRequest', AuthenticateHospital, VerifyAccount, controllers.acceptRequest)
router.post('/rejectRequest', AuthenticateHospital, VerifyAccount, controllers.rejectRequest)

//GET
router.get('/getUssdNotification', AuthenticateHospital, VerifyAccount, controllers.getUssdNotification)
router.get('/getANotification/:notificationId', AuthenticateHospital, VerifyAccount, controllers.getANotification)



export default router