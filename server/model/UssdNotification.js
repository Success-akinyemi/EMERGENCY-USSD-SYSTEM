import mongoose from "mongoose";

const UssdNotificationSchema = new mongoose.Schema({
    hospitalId: {
        type: String
    },
    ussdRequestId: {
        type: String
    },
    notificationId: {
        type: String
    },
    read: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    }
},
{ timestamps: true }
)

const UssdNotificationModel = mongoose.model('ussdNotification', UssdNotificationSchema)
export default UssdNotificationModel