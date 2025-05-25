import HospitalModel from "../model/Hospital.js";
import OtpModel from "../model/Otp.js";
import cloudinary from "cloudinary";
import multer from "multer";
import AfricasTalkingSDK from 'africastalking';
import { config } from "dotenv";
config()
import axios from 'axios'
import twilioClient from "./twilioConfig.js";

export async function generateUniqueCode(length) {
    const generateUserId = () => {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let hospitalId = ''; 

        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            hospitalId += characters[randomIndex]; 
        }

        return hospitalId;
    };

    let hospitalId;
    let exists = true;

    while (exists) {
        hospitalId = generateUserId();
        const existingId = await HospitalModel.findOne({ hospitalId: hospitalId });
        exists = existingId !== null; 
    }

    return hospitalId;
}

export const sendResponse = (res, statusCode, success, data, message) => {
    return res.status(statusCode).json({ success: success, data: data, message: message ? message : '' });
};

export async function generateOtp({ email, length, accountType}) {
    const deleteOtpCode = await OtpModel.deleteMany({ email: email })
    const generateOtp = () => {
        const min = Math.pow(10, length - 1);  
        const max = Math.pow(10, length) - 1;         
        const otp = Math.floor(min + Math.random() * (max - min + 1)).toString(); 
        return otp;
    };

    let otp;
    let exists = true;

    while (exists) {
        otp = generateOtp();
        exists = await OtpModel.findOne({ code: otp });
    }

    const otpCode = await OtpModel.create({
        email: email,
        otp: otp,
        accountType: accountType
    });

    console.log('NEW OTP MODEL', otpCode);

    return otp;
}

// Configure Cloudinary
cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    timeout: 120000, // 120 seconds
  });

  // Configure Multer
const storage = multer.memoryStorage(); // Use memory storage for direct streaming
const upload = multer({ storage });

export const uploadMiddleware = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "trackUrl", maxCount: 1 },
  { name: "trackImg", maxCount: 1 },
]);


  // Helper for uploading files to Cloudinary
export function uploadToCloudinary(fileBuffer, folder, resourceType) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.v2.uploader.upload_stream(
        { folder, resource_type: resourceType },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
  
      const bufferStream = new PassThrough();
      bufferStream.end(fileBuffer); // End the stream with the buffer
      bufferStream.pipe(uploadStream); // Pipe the buffer to the Cloudinary stream
    });
  }

  /**
   * 

  export async function sendSms({ to, message }) {
    if(!Array.isArray(to)) return { success: false, data: 'to value must be an array of numbers' }
    if(!message) return { success: false, data: 'Provide a message to send' }
    
    const credentials = {
        apiKey: `${process.env.AT_API_KEY}`,
        username: `${process.env.AT_USER_NAME}`,
    };

    const AfricasTalking = AfricasTalkingSDK(credentials);

    const sms = AfricasTalking.SMS;

    const options = {
        to: to,
        message: `${message}`,
        from: `${process.env.AT_SENDER}`
    };

    try {
        const sendMessage = await sms.send(options)
        console.log('SMS Message Sent')
        return { success: true, data: 'SMS Message sent successfull' }
    } catch (error) {
        console.log('UNABLE TO SEND MESSAGE', error)
        return { success: false, data: 'Unable to send SMS message'  }
    }
}
   */

/**
 * 

export async function sendSms({ to, message }) {
    if (!Array.isArray(to)) {
        return { success: false, data: 'to value must be an array of numbers' };
    }

    if (!message) {
        return { success: false, data: 'Provide a message to send' };
    }

    // Convert data to URL-encoded format
    const data = new URLSearchParams();
    data.append('username', process.env.AT_USER_NAME);
    data.append('message', message);
    data.append('senderId', process.env.AT_SENDER);
    data.append('to', to.join(',')); // Join phone numbers with comma

    try {
        const response = await axios.post(
            'https://api.africastalking.com/version1/messaging',
            data,
            {
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    apiKey: process.env.AT_API_KEY
                }
            }
        );

        console.log('SMS Message Sent', response.data);
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            data: error.response?.data || error.message || 'An error occurred'
        };
    }
}
 */

/**
 * 
export async function sendSms({ to, message }) {
    try {
        const sendOtpCode = await twilioClient.messages.create({
            body: `${message}`,
            from: `${process.env.TWILIO_PHONE_NUMBER}`,
            to: `${to}`,
            //messagingServiceSid: process.env.TWILIO_MESSAGE_SID
        })
        console.log('sendOtpCode', sendOtpCode?.data)
        return { success: true, data: `SMS SENT SUCCESSFUL TO ${to}` }
    } catch (error) {
        console.log('UNABLE TO SEND SMS', error)
        return { success: false, data: 'Unable to send sms' }
    }
}
 */


export async function sendSms({ to, message }) {
    const data = {
        body: `${message}`,
        from: 'DMS',
        to: `${to}`,
        api_token: process.env.SMS_TOKEN,
        gateway: "direct-refund",
        //customer_reference: "HXYSJWKKSLOX",
        //callback_url: "https://www.airtimenigeria.com/api/reports/sms"
    };

    try {
        const response = await axios.post('https://www.bulksmsnigeria.com/api/v2/sms', data, {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            }
        });

        console.log('SMS Sent:', response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Error sending SMS:', error.response?.data || error.message);
        return { success: false, data: error.response?.data || error.message };
    }
}
