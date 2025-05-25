import mongoose from "mongoose";

const AdminUssdNotificationSchema = new mongoose.Schema({
    hospitalId: {
        type: String
    },
    ussdRequestId: {
        type: String
    },
    notificationId: {
        type: String
    },
    notificationType: {
        type: String,
        required: [ true, 'Notification type is required' ],
        enum: ['Emergency', 'Appointment']
    },
    message: {
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

const AdminUssdNotificationModel = mongoose.model('adminUssdNotification', AdminUssdNotificationSchema)
export default AdminUssdNotificationModel