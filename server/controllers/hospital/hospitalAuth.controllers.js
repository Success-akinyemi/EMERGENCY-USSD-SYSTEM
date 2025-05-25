import { generateUniqueCode, sendResponse, uploadToCloudinary } from "../../middlewares/utils.js";
import HospitalModel from "../../model/Hospital.js";
import RefreshTokenModel from "../../model/RefreshToken.js";
import jwt from 'jsonwebtoken'

const MAX_LOGIN_ATTEMPTS = 4
const SUSPENSION_TIME = 6 * 60 * 60 * 1000

//register hospital
export async function register(req, res) {
    const { name, email, password, phoneNumber, address, state, city, country, lat, lng, quickResponseMessage, profileImg } = req.body;
    const { image } = req.files || {};
    //Validate email
    if (!email || !email.includes('@')) {
        return sendResponse(res, 400, false, null, 'Invalid email address');
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) return sendResponse(res, 400, false, `Invalid Email Address`);
    //Validate password at least 6 characters and at one special character
    if (!password || password.length < 6) {
        return sendResponse(res, 400, false, null, 'Password must be at least 6 characters');
    }
    const passwordRegex = /^(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;
    if (!passwordRegex.test(password)) {
        return sendResponse(res, 400, false, null, 'Password must contain at least one special character');
    }
    if (!name) return sendResponse(res, 400, false, null, 'Hospital Name is required')
    if (!phoneNumber) return sendResponse(res, 400, false, null, 'Phone number is required')
    if (!address) return sendResponse(res, 400, false, null, 'Address is required')
    if (!state) return sendResponse(res, 400, false, null, 'State is required')
    if (!city) return sendResponse(res, 400, false, null, 'City is required')
    //if (!country) return sendResponse(res, 400, false, null, 'Country is required')

    try {
        //upload image
        let profileImgUrl
        if(image?.[0]){
            profileImgUrl = await uploadToCloudinary(image[0].buffer, 'community/images', 'image')
        }

        // Check if the hospital already exists
        const existingHospitalEmail = await HospitalModel.findOne({ email });
        const existingHospitalPhoneNumber = await HospitalModel.findOne({ phoneNumber });

        if (existingHospitalEmail) {
            return sendResponse(res, 409, false, null, 'Hospital email already exists');
        }
        if(existingHospitalPhoneNumber) {
            return sendResponse(res, 409, false, null, 'Hospital number already exist')
        }

        const hospitalId = await generateUniqueCode(8);

        const location = {
            type: "Point",
            coordinates: [ lng, lat]
        }
        const newHospital = await HospitalModel.create({
            hospitalId,
            name,
            email,
            password,
            phoneNumber,
            address,
            state,
            city,
            country,
            location,
            quickResponseMessage,
            profileImg: profileImgUrl
        });

        const accessToken = newHospital.getAccessToken()
        const refreshToken = newHospital.getRefreshToken()

        //refresh token
        const refreshTokenExist = await RefreshTokenModel.findOne({ accountId: newHospital.hospitalId })
        if(refreshTokenExist){
            refreshTokenExist.refreshToken = refreshToken
            await refreshTokenExist.save()
        } else {
            await RefreshTokenModel.create({
                accountId: newHospital?.hospitalId,
                refreshToken,
            })
        }

        ///set and send cookies
        //res.cookie('hospitaltoken', accessToken, {
        //    httpOnly: true,
        //    sameSite: 'None',
        //    secure: true,
        //    maxAge: 15 * 60 * 1000, // 15 minutes
        //});
        res.cookie('hospitalauthaccessid', newHospital?.hospitalId, {
            httpOnly: true,
            sameSite: 'None',
            secure: true,
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });

        // Send success response
        const { password: _, verified, accountSuspended, noOfLoginAttempts, temporaryAccountBlockTime, ...hospitalData } = newHospital._doc;
        sendResponse(res, 201, true, hospitalData, 'Hospital registered successfully');
    } catch (error) {
        console.log('ERROR REGISTERING HOSPITAL:', error);
        sendResponse(res, 500, false, null, 'Error registering hospital');
    }
}

//verify email via otp
export async function verifyHospitalEmail(req, res) {
   const { otp } = req.body;
   if (!otp) return sendResponse(res, 400, false, null, 'OTP is required')

    try {
        
    } catch (error) {
        console.log('ERROR VERIFYING HOSPITAL EMAIL:', error);
        sendResponse(res, 500, false, null, 'Error verifying hospital email');
    }
}

//login
export async function login(req, res) {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone) return sendResponse(res, 400, false, null, 'Email is required')
    if (!password) return sendResponse(res, 400, false, null, 'Password is required')

    try {
        let hospital
        if(emailOrPhone.includes('@')) {
            hospital = await HospitalModel.findOne({ email: emailOrPhone }).select('+password');
        } else {
            hospital = await HospitalModel.findOne({ phoneNumber: emailOrPhone }).select('+password');
        }
        if (!hospital) return sendResponse(res, 404, false, null, 'Hospital not found')

        if(!hospital.verified) return sendResponse(res, 403, false, null, 'Hospital not verified')
        
                //check if hospital is still in the six hours of suspension
                if (hospital.accountSuspended && hospital.temporaryAccountBlockTime) {
                    const timeDiff = Date.now() - new Date(hospital.temporaryAccountBlockTime).getTime();
                    if (timeDiff < SUSPENSION_TIME) {
                        const remainingTime = Math.ceil((SUSPENSION_TIME - timeDiff) / (60 * 1000)); // in minutes
                        return sendResponse(res, 403, false, null, `Account temporarily blocked. Try again in ${remainingTime} minutes.`);
                    } else {
                        // Reset suspension if time has passed
                        hospital.accountSuspended = false;
                        hospital.temporaryAccountBlockTime = null;
                        hospital.noOfLoginAttempts = 0;
                        await hospital.save();
                    }
                } else {
                    // Reset suspension if time has passed
                    hospital.accountSuspended = false;
                    hospital.temporaryAccountBlockTime = null;
                    hospital.noOfLoginAttempts = 0;
                    await hospital.save();
                }

        const isMatch = await hospital.matchPassword(password);
        //if (!isMatch) return sendResponse(res, 401, false, null, 'Invalid credentials')
            if(!isMatch){
                hospital.noOfLoginAttempts += 1
                await hospital.save()
                if(hospital.noOfLoginAttempts >= MAX_LOGIN_ATTEMPTS){
                    hospital.accountSuspended = true
                    hospital.temporaryAccountBlockTime = new Date(); // Set suspension start time
                    await hospital.save();
                    return sendResponse(res, 403, false, null, `Too many failed attempts. Your account is blocked for 6 hours.`);
                } else {
                    return sendResponse(res, 403, false, null, `Wrong credentials ${MAX_LOGIN_ATTEMPTS - hospital.noOfLoginAttempts} login attempts left`)
                }
    
            } else {
                hospital.accountSuspended = false
                hospital.noOfLoginAttempts = 0
                hospital.temporaryAccountBlockTime = null
                hospital.lastLogin = Date.now()
                await hospital.save();
            }

        const accessToken = hospital.getAccessToken()
        const refreshToken = hospital.getRefreshToken()

        //refresh token
        const refreshTokenExist = await RefreshTokenModel.findOne({ accountId: hospital.hospitalId })
        if(refreshTokenExist){
            refreshTokenExist.refreshToken = refreshToken
            await refreshTokenExist.save()
        } else {
            await RefreshTokenModel.create({
                accountId: hospital?.hospitalId,
                refreshToken,
            })
        }

        ///set and send cookies
        res.cookie('hospitaltoken', accessToken, {
            httpOnly: true,
            sameSite: 'None',
            secure: true,
            maxAge: 15 * 60 * 1000, // 15 minutes
        });
        res.cookie('hospitalauthid', hospital?.hospitalId, {
            httpOnly: true,
            sameSite: 'None',
            secure: true,
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });

        // Send success response
        const { password: _, blocked, verified, accountSuspended, noOfLoginAttempts, temporaryAccountBlockTime, ...hospitalData } = hospital._doc;
        //sendResponse(res, 200, true, hospitalData, 'Hospital logged in successfully');
        res.status(200).json({
            success: true,
            message: 'Hospital logged in successfully',
            data: hospitalData,
            token: accessToken,
        });
    } catch (error) {
        console.log('ERROR LOGGING IN HOSPITAL:', error);
        sendResponse(res, 500, false, null, 'Error logging in hospital');
    }
}

//forgot password
export async function forgotPassword(req, res) {
    const { email } = req.body;
    if (!email) return sendResponse(res, 400, false, null, 'Email is required')

    try {
        
    } catch (error) {
        console.log('ERROR SENDING OTP:', error);
        sendResponse(res, 500, false, null, 'Error sending OTP');
    }
}

//update password
export async function resetPassword(req, res) {
    const { hospitalId, password, confirmPassword } = req.body;

    if (!hospitalId) return sendResponse(res, 400, false, null, 'Hospital ID is required')
    if (!password) return sendResponse(res, 400, false, null, 'Password is required')

    //Validate password at least 6 characters and at one special character
    if (!password || password.length < 6) {
        return sendResponse(res, 400, false, null, 'Password must be at least 6 characters');
    }
    const passwordRegex = /^(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;
    if (!passwordRegex.test(password)) {
        return sendResponse(res, 400, false, null, 'Password must contain at least one special character');
    }
    if (!confirmPassword) return sendResponse(res, 400, false, null, 'Confirm password is required')
    if (password !== confirmPassword) return sendResponse(res, 400, false, null, 'Password and confirm password do not match')
    try {
        const hospital = await HospitalModel.findOne({ hospitalId }).select('+password');
        if (!hospital) return sendResponse(res, 404, false, null, 'Hospital not found')

        const isMatch = await hospital.matchPassword(password);
        if (isMatch) return sendResponse(res, 401, false, null, 'Password already in use')
    
        hospital.password = password
        await hospital.save()

        sendResponse(res, 200, true, null, 'Password updated successfully')
    } catch (error) {
        console.log('ERROR UPDATING HOSPITAL PASSWORD:', error);
        sendResponse(res, 500, false, null, 'Error updating hospital password');
    }
}

//update hospital details
export async function updateHospital(req, res) {
    const { hospitalId } = req.hospital 
    const { name, phoneNumber, address, state, city, country, lat, lng, quickResponseMessage, profileImg } = req.body;
    const { image } = req.files || {};

    try {
        let profileImgUrl
        if(image?.[0]){
            profileImgUrl = await uploadToCloudinary(image[0].buffer, 'community/images', 'image')
        }

        const hospital = await HospitalModel.findOne({ hospitalId });
        
        let location
        if(lat && lng) {
            location = {
                type: "Point",
                coordinates: [ lng, lat]
            }
        }

        if(name) hospital.name = name
        if(phoneNumber) hospital.phoneNumber = phoneNumber
        if(address) hospital.address = address
        if(state) hospital.state = state
        if(city) hospital.city = city
        if(country) hospital.country = country
        if(lat && lng) hospital.location = location
        if(quickResponseMessage) hospital.quickResponseMessage = quickResponseMessage
        if(profileImgUrl) hospital.profileImg = profileImg

        const { password: _, ...hospitalData } = hospital._doc;
        sendResponse(res, 200, true, hospitalData, 'Hospital updated')
    } catch (error) {
        console.log('ERROR UPDATING HOSPITAL:', error);
        sendResponse(res, 500, false, null, 'Error updating hospital');
    }
}

//update password
export async function updatePassword(req, res) {
    const { hospitalId } = req.hospital
    const { password, confirmPassword } = req.body;

    if (!hospitalId) return sendResponse(res, 400, false, null, 'Hospital ID is required')
    if (!password) return sendResponse(res, 400, false, null, 'Password is required')

    //Validate password at least 6 characters and at one special character
    if (!password || password.length < 6) {
        return sendResponse(res, 400, false, null, 'Password must be at least 6 characters');
    }
    const passwordRegex = /^(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;
    if (!passwordRegex.test(password)) {
        return sendResponse(res, 400, false, null, 'Password must contain at least one special character');
    }
    if (!confirmPassword) return sendResponse(res, 400, false, null, 'Confirm password is required')
    if (password !== confirmPassword) return sendResponse(res, 400, false, null, 'Password and confirm password do not match')
    try {
        const hospital = await HospitalModel.findOne({ hospitalId }).select('+password');

        const isMatch = await hospital.matchPassword(password);
        if (isMatch) return sendResponse(res, 401, false, null, 'Password already in use')
    
        hospital.password = password
        await hospital.save()

        sendResponse(res, 200, true, null, 'Password updated successfully')
    } catch (error) {
        console.log('ERROR UPDATING HOSPITAL PASSWORD:', error);
        sendResponse(res, 500, false, null, 'Error updating hospital password');
    }
}

//logout hospital
export async function logout(req, res) {
    const { hospitalId } = req.body;

    if (!hospitalId) return sendResponse(res, 400, false, null, 'Hospital ID is required')

    try {
        //delete refresh token
        await RefreshTokenModel.findOneAndDelete({ accountId: hospitalId })

        //clear cookies
        res.clearCookie('hospitaltoken', {
            httpOnly: true,
            sameSite: 'None',
            secure: true,
        });
        res.clearCookie('hospitalauthid', {
            httpOnly: true,
            sameSite: 'None',
            secure: true,
        });

        sendResponse(res, 200, true, null, 'Logged out successfully')
    } catch (error) {
        console.log('ERROR LOGGING OUT HOSPITAL:', error);
        sendResponse(res, 500, false, null, 'Error logging out hospital');
    }
}

//verify hospital token
export async function verifyToken(req, res) {
    const accessToken = req.cookies.hospitaltoken;
    const accountId = req.cookies.hospitalauthid;
    try {
        if (accessToken) {
            try {
                const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_TOKEN_SECRET);

                if (decoded.accountType !== 'hospital') {
                    return sendResponse(res, 403, false, 'Unauthorized access');
                }

                const hospital = await HospitalModel.findOne({ hospitalId: decoded.id });
                if (!hospital) return sendResponse(res, 404, false, 'Hospital not found');
                const refreshTokenExist = await RefreshTokenModel.findOne({ accountId });
                if (!refreshTokenExist) return sendResponse(res, 401, false, 'Unauthenticated');

                // Remove sensitive data before sending the response
                const { password, noOfLoginAttempts, temporaryAccountBlockTime, verified, accountSuspended, isBlocked, resetPasswordToken, resetPasswordExpire, subscriptionPriceId, subscriptionId, _id, ...userData } = hospital._doc;
                //return sendResponse(res, 200, true, userData, accessToken);
                return res.status(200).json({
                    success: true,
                    message: 'Hospital verified successfully',
                    data: userData,
                    token: accessToken,
                });
            } catch (error) {
                if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
                    return handleTokenRefresh(res, accountId);
                }
                return sendResponse(res, 401, false, 'Invalid token');
            }
        } else if (accountId) {
            return handleTokenRefresh(res, accountId);
        }

        return sendResponse(res, 401, false, 'Unauthenticated');
    } catch (error) {
        console.error('UNABLE TO VERIFY TOKEN', error);
        return sendResponse(res, 500, false, 'Unable to verify token');
    }
}

async function handleTokenRefresh(res, accountId) {
    if (!accountId) return sendResponse(res, 401, false, 'Unauthenticated');

    const hospital = await HospitalModel.findOne({ hospitalId: accountId });
    if (!hospital) return sendResponse(res, 404, false, 'Hospital not found');

    const refreshTokenExist = await RefreshTokenModel.findOne({ accountId });
    if (!refreshTokenExist) return sendResponse(res, 401, false, 'Invalid refresh token');

    const newAccessToken = hospital.getAccessToken();
    res.cookie('hospitaltoken', newAccessToken, {
        httpOnly: true,
        sameSite: 'None',
        secure: true,
        maxAge: 15 * 60 * 1000, // 15 minutes
    });

    const { password, noOfLoginAttempts, temporaryAccountBlockTime, verified, accountSuspended, isBlocked, resetPasswordToken, resetPasswordExpire, subscriptionPriceId, subscriptionId, _id, ...userData } = hospital._doc;
    //return sendResponse(res, 200, true, userData, newAccessToken);
    res.status(200).json({
        success: true,
        message: 'Hospital verified successfully',
        data: userData,
        token: newAccessToken,
    });
    return
}
