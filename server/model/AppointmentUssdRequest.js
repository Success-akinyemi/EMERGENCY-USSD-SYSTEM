import mongoose from "mongoose";

const AppointmentUssdRequestSchema = new mongoose.Schema({
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
        default: 'Appointment',
    },
    state: {
        type: String
    },
    city: {
        type: String
    },
    issue: {
        type: String
    },
    hospitalId: {
        type: String
    },
    lat: {
        type: Number
    },
    lng: {
        type: Number
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
        type: String //hospital Id
    },
    day:{
        type: String,
    },
    date: {
        type: Date
    },
    time: {
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

const AppointmentUssdRequestModel = mongoose.model('AppointmentUssdRequest', AppointmentUssdRequestSchema)
export default AppointmentUssdRequestModel