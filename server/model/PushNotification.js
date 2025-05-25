import mongoose from "mongoose";

const PushNotificationSchema = new mongoose.Schema({
    data: {
        type: Object
    },
    email: {
        type: String,
        required: [ true, 'Email address is required' ],
        unique: [ true, 'Email already exist' ],
    }
},
{ timestamps: true }
)

const PushNotificationModel = mongoose.model('push-notification', PushNotificationSchema)
export default PushNotificationModel