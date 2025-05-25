import mongoose from "mongoose";

const EmergencyUssdRequestSchema = new mongoose.Schema({
    ussdRequestId:{
        type: String,
        unique: true,
    },
    phoneNumber: {
        type: String
    },
    message: {
        type: String
    },
    sessionId: {
        type: String,
        unique: true
    },
    notificationType: {
        type: String,
        default: 'Emergency',
    },
    selectedAccident: {
        type: String
    },
    selectedPlace: {
        type: String
    },
    city: {
        type: String
    },
    lat: {
        type: Number
    },
    lng: {
        type: Number
    },
    state: {
        type: String
    },
    solved: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        default: 'Pending',
        enum: ['Pending', 'Solved', 'Rejected']
    },
    attendedBy: {
        type: String
    },
    patientName: {
        type: String
    },
    

    serviceCode: {
        type: String
    },
    text: {
        type: String
    }
},
{ timestamps: true }
)

const EmergencyUssdRequestModel = mongoose.model('EmergencyUssdRequest', EmergencyUssdRequestSchema)
export default EmergencyUssdRequestModel