import { sendResponse } from "../middlewares/utils.js"
import StateModel from "../model/States.js"

function slugify(state) {
  return state
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')   // Replace spaces with hyphens
    .replace(/[^\w\-]+/g, '') // Remove all non-word characters except hyphens
    .replace(/\-\-+/g, '-');  // Replace multiple hyphens with single hyphen
}

//validate landmarks
function isValidLandmark(landmark) {
  return (
    typeof landmark === 'object' &&
    typeof landmark.place === 'string' &&
    typeof landmark.lat === 'number' &&
    typeof landmark.lng === 'number' &&
    !isNaN(landmark.lat) &&
    !isNaN(landmark.lng)
  );
}

function enrichValidLandmarks(landmarks) {
  if (!Array.isArray(landmarks)) return [];

  return landmarks
    .filter(isValidLandmark)
    .map(l => ({
      ...l,
      location: {
        type: 'Point',
        coordinates: [l.lng, l.lat]
      }
    }));
}


//new state
export async function newState(req, res) {
    const { state } = req.body
    if(!state) return sendResponse(res, 400, false, null, 'State is required')

    const slug = slugify(state)
    try {
        const getState = await StateModel.findOne({ slug })
        if(getState) return sendResponse(res, 409, false, null, 'State already exist')

        const createState = await StateModel.create({ state, slug, active: true, cities: [] })

        sendResponse(res, 201, true, createState, 'New state created')
    } catch (error) {
        console.log('UNABLE TO ADD NEW STATE', error)
        sendResponse(res, 500, false, null, 'Unable to add new state')
    }
}

//udpate state
export async function updateState(req, res) {
    const { state, id } = req.body
    if(!id) return sendResponse(res, 400, false, null, 'State Id is required')
    if(!state) return sendResponse(res, 400, false, 'State is required')

    const slug = slugify(state)
    try {
        const getState = await StateModel.findById({ _id: id })
        if(!getState) return sendResponse(res, 409, false, null, 'State not found')

        getState.state = state
        getState.slug = slug
        await getState.save()

        sendResponse(res, 201, true, getState, 'State updated successful')
    } catch (error) {
        console.log('UNABLE TO ADD NEW STATE', error)
        sendResponse(res, 500, false, null, 'Unable to add new state')
    }
}

//activate state
export async function activateState(req, res) {
    const { id } = req.body
    if(!id) return sendResponse(res, 400, false, null, 'Sate Id is required')
    try {
        const getState = await StateModel.findById({ _id: id }).select('-__v')
        if(!getState) return sendResponse(res, 404, false, null, 'State does not exist')
        
        getState.active = true
        await getState.save()
        sendResponse(res, 200, true, getState, 'State activated successfully')
    } catch (error) {
        console.log('UNABLE TO ACTIVATE STATE', error)
        sendResponse(res, 500, false, null, 'Unable to activate state')
    }
}

//deactivate state
export async function deActivateState(req, res) {
    const { id } = req.params
    if(!id) return sendResponse(res, 400, false, null, 'Sate Id is required')

    try {
        const getState = await StateModel.findById({ _id: id }).select('-__v')
        if(!getState) return sendResponse(res, 404, false, null, 'State does not exist')
        
        getState.active = false
        await getState.save()
        sendResponse(res, 200, true, getState, 'State activated successfully')
    } catch (error) {
        console.log('UNABLE TO DEACTIVATE STATE', error)
        sendResponse(res, 500, false, null, 'Unable to deactivate state')
    }
}

//delete state
export async function deleteState(req, res) {
    const { id } = req.params
    try {
        const getState = await StateModel.findByIdAndDelete({ _id: id })
        if(!getState) return sendResponse(res, 404, false, null, 'State not found')

        sendResponse(res, 200, true, null, 'State deleted successfully')
    } catch (error) {
        console.log('UNABLE TO DELETE STATE', error)
        sendResponse(res, 500, false, null, 'Unable to delete state')
    }
}

//get all state (public)
export async function getStates(req, res) {
    
    try {
        const getState = await StateModel.find({ active: true }).select('-__v')

        sendResponse(res, 200, true, getState, 'State fetched successfully')
    } catch (error) {
        console.log('UNABLE TO GET ALL STATES', error)
        sendResponse(res, 500, false, null, 'Unable to get all states')
    }
}

//get all state (admin)
export async function getAllStates(req, res) {
    
    try {
        const getState = await StateModel.find({ }).select('-__v')

        sendResponse(res, 200, true, getState, 'State fetched successfully')
    } catch (error) {
        console.log('UNABLE TO GET ALL STATES', error)
        sendResponse(res, 500, false, null, 'Unable to get all states')
    }
}

//get a state
export async function getState(req, res) {
    const { id } = req.params
    if(!id) return sendResponse(res, 400, false, null, 'Sate Id is required')

    try {
        const getState = await StateModel.findById({ _id: id }).select('-__v')
        if(!getState) return sendResponse(res, 404, false, null, 'State does not exist')

        sendResponse(res, 200, true, getState, 'State fetched successfully')
    } catch (error) {
        console.log('UNABLE TO GET STATE', error)
        sendResponse(res, 500, false, null, 'Unable to get state')
    }
}

//new city to a state
export async function newCity(req, res) {
    const { id, city, landmark } = req.body
    if(!id) return sendResponse(res, 400, false, null, 'State Id is required')
    if(!city) return sendResponse(res, 400, false, null, 'City is required')
    
    if(landmark){
        const validateLandmark = enrichValidLandmarks(landmark)
        if(!validateLandmark) return sendResponse(res, 400, false, null, 'Invalid landmark format')
    }
    try {
        const getState = StateModel.findById({ _id: id })
        if(!getState) return sendResponse(res, 404, false, null, 'State not found')

        const data = { city, landmarks: landmark || [] }
        getStates.cities.push(data)
        await getStates.save()

        sendResponse(res, 200, true, getStates, 'City added successfull')
    } catch (error) {
        console.log('UNABLE TO CREATE NEW CITY', error)
        sendResponse(res, 500, false, null, 'unable to create new city')
    }
}

//update a city of a state

//new landmark

//update landmark

//delete a city

//get cities of a state