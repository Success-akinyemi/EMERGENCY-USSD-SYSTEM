import express from 'express'
import * as controllers from '../controllers/appointmentUssdNotification.controllers.js'
import { uploadMiddleware } from '../middlewares/utils.js'
import { AuthenticateHospital, VerifyAccount } from '../middlewares/auth/hospitalAuth.js'

const router = express.Router()

//POST
router.post('/markNotificationAsRead', AuthenticateHospital, VerifyAccount, controllers.markNotificationAsRead)
router.post('/acceptRequest', AuthenticateHospital, VerifyAccount, controllers.acceptNotification)
router.post('/rejectRequest', AuthenticateHospital, VerifyAccount, controllers.rejectNotification)
router.post('/addAppointmentTime', AuthenticateHospital, VerifyAccount, controllers.addAppointmentTime)

//GET
router.get('/getUssdNotification', AuthenticateHospital, VerifyAccount, controllers.getAppointmentNotification)
router.get('/getANotification/:notificationId', AuthenticateHospital, VerifyAccount, controllers.getAnAppointmentNotification)



export default router