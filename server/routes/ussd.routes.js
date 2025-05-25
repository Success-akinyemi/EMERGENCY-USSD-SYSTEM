import express from 'express'
import * as controllers from '../controllers/ussd.controllers.js'

const router = express.Router()

router.post('/', controllers.ussd)

export default router