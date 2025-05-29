import { sendResponse, sendSms } from '../middlewares/utils.js';
import UssdNotificationModel from '../model/UssdNotification.js';
import AppointmentUssdRequestModel from '../model/AppointmentUssdRequest.js';
import AdminUssdNotificationModel from '../model/AdminUssdNotification.js';

const ussdNotificationStatus = ['pending', 'accepted', 'rejected']


export async function getAppointmentNotification(req, res) {
    const { hospitalId } = req.hospital;
    const { limit = 10, page = 1, read, status } = req.query;

    if (read && read !== 'true' && read !== 'false') {
        return sendResponse(res, 400, false, null, 'Read must be a boolean value');
    }

    try {
        const query = { hospitalId };
        if (read !== undefined) {
            query.read = read;
        }
        if(status){
            if(ussdNotificationStatus.includes(status.toLowerCase())){
                query.status = status.toLowerCase();
            }
        }

        // Step 1: Get all matching notifications
        const allNotifications = await UssdNotificationModel.find(query)
            .sort({ createdAt: -1 })
            .lean();

        const allUssdRequestIds = allNotifications.map(n => n.ussdRequestId);

        // Step 2: Find only valid requests (not solved or attended by same hospital)
        const validUssdRequests = await AppointmentUssdRequestModel.find({
            ussdRequestId: { $in: allUssdRequestIds },
            $or: [
                { solved: { $ne: true } },
                { attendedBy: hospitalId }
            ]
        })
        .select('ussdRequestId message city state issue day time date status solved attendedBy')
        .lean();

        // Map for quick lookup
        const ussdMap = {};
        validUssdRequests.forEach(req => {
            ussdMap[req.ussdRequestId] = req;
        });

        // Step 3: Filter notifications to those that have valid requests
        const filteredNotifications = allNotifications.filter(n => ussdMap[n.ussdRequestId]);

        const totalItems = filteredNotifications.length;
        const totalPages = Math.ceil(totalItems / limit);
        const skip = (Number(page) - 1) * Number(limit);

        const paginatedNotifications = filteredNotifications.slice(skip, skip + Number(limit));

        const enrichedNotifications = paginatedNotifications.map(notification => ({
            ...notification,
            ussdRequest: ussdMap[notification.ussdRequestId]
        }));

        return sendResponse(res, 200, true, {
            data: enrichedNotifications,
            total: totalItems,
            totalPages,
            currentPage: Number(page),
            limit: Number(limit)
        }, 'Appointment Notifications fetched successfully');

    } catch (error) {
        console.error('UNABLE TO GET HOSPITAL APPOINTMENT NOTIFICATIONS', error);
        return sendResponse(res, 500, false, null, 'Unable to get appointment notifications');
    }
}

export async function getAnAppointmentNotification(req, res) {
    const { hospitalId } = req.hospital;
    const { notificationId } = req.params;
    if(!notificationId) return sendResponse(res, 400, false, null, 'Notification ID is required');
    try {
        const notification = await UssdNotificationModel.findOne({ hospitalId, notificationId });
        if (!notification) {
            return sendResponse(res, 404, false, null, 'Notification not found');
        }

        const ussdRequest = await AppointmentUssdRequestModel.findOne({ ussdRequestId: notification.ussdRequestId })
            .select('-__v -_id -text -serviceCode -phoneNumber')
            .lean();
        if (!ussdRequest) {
            return sendResponse(res, 404, false, null, 'USSD request not found');
        }

        // Mark the notification as read
        notification.read = true;

        await notification.save();
        sendResponse(res, 200, true, { ...notification.toObject(), ussdRequest }, 'Notification fetched successfully');
    } catch (error) {
        console.error('UNABLE TO GET HOSPITAL NOTIFICATION', error);
        return sendResponse(res, 500, false, null, 'Unable to get notification');
    }
}

export async function markNotificationAsRead(req, res) {
    const { hospitalId } = req.hospital;
    const { notificationId } = req.body;
    if(!notificationId) return sendResponse(res, 400, false, null, 'Notification ID is required');

    try {
        const notification = await UssdNotificationModel.findOne({ hospitalId, notificationId });
        if (!notification) {
            return sendResponse(res, 404, false, null, 'Notification not found');
        }

        notification.read = notification.read ? false : true; // Toggle read status
        await notification.save();

        const ussdRequest = await AppointmentUssdRequestModel.findOne({ ussdRequestId: notification.ussdRequestId })
        .select('-__v -_id')
        .lean();

        sendResponse(res, 200, true, { ...notification.toObject(), ussdRequest }, `Notification marked as ${notification.read ? 'read' : 'unread'}`);
    } catch (error) {
        console.error('UNABLE TO MARK NOTIFICATION AS READ', error);
        return sendResponse(res, 500, false, null, 'Unable to mark notification as read');
    }
}

export async function acceptNotification(req, res) {
    const { hospitalId, name, phoneNumber, address, city, state } = req.hospital;
    const { notificationId, day, date, time } = req.body;
    if(!notificationId) return sendResponse(res, 400, false, null, 'Notification ID is required');

    try {
        const notification = await UssdNotificationModel.findOne({ hospitalId, notificationId });
        if (!notification) {
            return sendResponse(res, 404, false, null, 'Notification not found');
        }

        const ussdRequestId = notification.ussdRequestId
        const getRequest = await AppointmentUssdRequestModel.findOne({ ussdRequestId });
        if (!getRequest) {
            return sendResponse(res, 404, false, null, 'Ussd Request not found');
        }

        // Update the notification status to accepted
        notification.status = 'accepted';
        notification.read = true
        await notification.save();

        if(getRequest.solved){
            sendResponse(res, 200, false, null, 'Ussd Request is no longer active')
            return
        } else {
            //update ussd request
            getRequest.solved = true
            getRequest.status = 'Solved'
            getRequest.attendedBy = hospitalId
            getRequest.day = day
            getRequest.date = date
            getRequest.time = time
            await getRequest.save()

            const message = `
                    Your ${getRequest?.notificationType} Request has been recived by ${name}, \n
                    Address: ${address} ${city} ${state} \n
                    RequestId: ${getRequest?.ussdRequestId} \n
                    Hospital Phone Number: ${phoneNumber}
                `
            /**
             //send sms to the user
                 console.log('getRequest?.phoneNumber', getRequest?.phoneNumber)
             const sendSmsMessage = await sendSms({ to: `+${getRequest?.phoneNumber}`, message  })
             
             let smsResponse
             if(sendSmsMessage.success){
                 smsResponse = sendSmsMessage.data
             } else {
                 smsResponse = sendSmsMessage.data
             }
             console.log('sendSmsMessage.data', sendSmsMessage.data)
             
             * 
             */

            await AdminUssdNotificationModel.create({
                hospitalId,
                ussdRequestId,
                notificationId,
                notificationType: 'Appointment',
                message
            })
            //create aleart to admin
            
            sendResponse(res, 200, true, notification, `Request accepted successfully.`);
            return
        }


    } catch (error) {
        console.error('UNABLE TO ACCEPT REQUEST', error);
        return sendResponse(res, 500, false, null, 'Unable to accept request');
    }
}

export async function rejectNotification(req, res) {
    const { hospitalId } = req.hospital;
    const { notificationId } = req.body;
    if(!notificationId) return sendResponse(res, 400, false, null, 'Notification ID is required');

    try {
        const notification = await UssdNotificationModel.findOne({ hospitalId, notificationId });
        if (!notification) {
            return sendResponse(res, 404, false, null, 'Notification not found');
        }

        // Update the notification status to accepted
        notification.status = 'rejected';
        await notification.save();

        sendResponse(res, 200, true, notification, 'Request rejected successfully');
    } catch (error) {
        console.error('UNABLE TO REJECTS USSD REQUEST', error);
        return sendResponse(res, 500, false, null, 'Unable to reject request');
    }
}

//admin