import express from 'express'
import * as controllers from '../controllers/states.controllers.js'

const router = express.Router()

//POST
router.post('/newState', controllers.newState)
router.post('/updateState', controllers.updateState)
router.post('/deleteState', controllers.deleteState)
router.post('/activateState', controllers.activateState)
router.post('/deActivateState', controllers.deActivateState)
router.post('/newCity', controllers.newCity)


//GET
router.get('/getStates', controllers.getStates)
router.get('/getAllStates', controllers.getAllStates)
router.get('/getState/:id', controllers.getState)


export default router