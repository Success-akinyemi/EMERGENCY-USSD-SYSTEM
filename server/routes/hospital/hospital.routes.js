import express from 'express'
import * as controllers from '../../controllers/hospital/hospital.controllers.js'
import { uploadMiddleware } from '../../middlewares/utils.js'
import { AuthenticateHospital, VerifyAccount } from '../../middlewares/auth/hospitalAuth.js'

const router = express.Router()

//POST

//GET
router.get('/getHospitals', controllers.getHospitals)



export default router