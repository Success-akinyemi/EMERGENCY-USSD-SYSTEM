import express from 'express'
import * as controllers from '../controllers/pushNotification.controllers.js'

const router = express.Router()

router.post('/saveSubscription', controllers.saveSubscription)

export default router