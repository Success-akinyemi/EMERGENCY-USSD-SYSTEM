import mongoose from "mongoose";

const HospitalNotificationSchema = new mongoose.Schema({
    hospitalId: {
        type: String,
        required: [ true, 'Hospital Id is required' ]
    },
    notification: {
        type: String,
    },
    read: {
        type: Boolean,
        default: false
    }
},
{ timestamps: true }
)

const HospitalNotificationModel = mongoose.model('HospitalNotification', HospitalNotificationSchema)
export default HospitalNotificationModel