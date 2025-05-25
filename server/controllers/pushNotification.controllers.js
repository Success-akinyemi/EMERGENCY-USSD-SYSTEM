import { sendResponse } from "../middlewares/utils.js"
import PushNotificationModel from "../model/PushNotification.js"
import webpush from 'web-push';

const apiKeys = {
    publicKey: process.env.WEB_PUSH_PUBLIC_KEY,
    privateKey: process.env.WEB_PUSH_PRIVATE_KEY
}

webpush.setVapidDetails(
    `mailto:${process.env.NODEMAILER_USER}`,
    apiKeys.publicKey,
    apiKeys.privateKey
)

export async function saveSubscription(req, res) {
    const { subscription, email, accounType } = req.body

    try {

        const getSubscription = await PushNotificationModel.findOne({ email })
        if(getSubscription){
            getSubscription.data = subscription
            getSubscription.accounType = accounType
            await getSubscription.save()
        } else {
            await PushNotificationModel.create({
                data: subscription,
                email
            })
        }
        
        //console.log('SEEN', req.body)
        const sendNotification = sendCustomNotification({email: email, message: 'Notification saved'})
        sendResponse(res, 200, true, null, 'Subscription saved successful')
    } catch (error) {
        console.log('UNABLE TO SAVE SUBSCRIPTION', error)
        sendResponse(res, 500, false, null, 'Unable to save subcription')
    }
}

export async function removeSubscription(req, res) {
    const { email } = req.body

    try {
        const getSubscription = await PushNotificationModel.findOneAndDelete({ email })
        if(!getSubscription){
            return sendResponse(res, 404, false, null, 'Email does not exist')
        }

        sendResponse(res, 200, true, null, 'Successfull unsubscribe email')
    } catch (error) {
        console.log('UANBLE TO UNSUBSCRIBE EMAIL', error)
        sendResponse(res, 500, false, null, 'Unable to unsubscriber')
    }
}



//WEB PUSH FUNCTION
export async function sendCustomNotification({title, message, email}) {
  try {
    // Find the user in the PushNotificationModel by email
    const subscriber = await PushNotificationModel.findOne({ email }).exec();

    if (!subscriber) {
      console.error(`No subscriber found with email: ${email}`);
      return { success: false, message: 'Subscriber not found.' };
    }

    const { data } = subscriber;

    // Ensure the subscription object exists
    if (data && data.endpoint) {
      const notificationPayload = JSON.stringify({
        title: title || 'DMS',
        message,
      });

      try {
        await webpush.sendNotification(data, notificationPayload);
        console.log(`Notification sent to ${email}`);
        return { success: true, message: 'Notification sent successfully.' };
      } catch (error) {
        console.error(`Failed to send notification to ${email}`, error);
        return { success: false, message: 'Failed to send notification.' };
      }
    } else {
      return { success: false, message: 'Invalid push subscription data.' };
    }

  } catch (error) {
    console.error('UNABLE TO SEND NOTIFICATION', error);
    return { success: false, message: 'Unable to send push notification.' };
  }
}