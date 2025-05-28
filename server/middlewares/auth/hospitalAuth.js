import HospitalModel from "../../model/Hospital.js";
import RefreshTokenModel from "../../model/RefreshToken.js";
import { sendResponse } from "../utils.js";
import jwt from "jsonwebtoken";

export const AuthenticateHospital = async (req, res, next) => {
    const accessToken = req.cookies.hospitaltoken;
    const accountId = req.cookies.hospitalauthid;
    //console.log('HOSPITAL AUTHENTICATE MIDDLEWARE', accessToken, accountId)
    try {
        if (accessToken) {
            try {
                const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_TOKEN_SECRET);
                let hospital;
                //console.log('decoded', decoded)
                const refreshTokenExist = await RefreshTokenModel.findOne({ accountId: decoded.id })
                if (decoded.accountType === 'hospital') {
                    hospital = await HospitalModel.findOne({ hospitalId: decoded.id });
                }
                if (!hospital) {
                    //console.log('VERIFICATION MIDDLEWARE 1')
                    return sendResponse(res, 404, false, null, 'User not found');
                }
                if (!refreshTokenExist) {
                    //console.log('VERIFICATION MIDDLEWARE 2')
                    return sendResponse(res, 401, false, null, 'UnAuthenicated');
                }
                req.hospital = hospital;
                return next();
            } catch (error) {
                if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
                    if (accountId) {
                        let hospital = await HospitalModel.findOne({ hospitalId: accountId });
                        const refreshTokenExist = await RefreshTokenModel.findOne({ accountId: accountId })
                        if (hospital && refreshTokenExist) {
                            const accessToken = hospital.getAccessToken()
                            res.cookie('hospitaltoken', accessToken, {
                                httpOnly: true,
                                sameSite: 'None',
                                secure: true,
                                maxAge: 15 * 60 * 1000, // 15 minutes
                            });
                            req.hospital = hospital;
                            return next();
                        }
                    }
                    //console.log('VERIFICATION MIDDLEWARE 3')
                    return sendResponse(res, 401, false, null, 'UnAuthenicated');
                }
            }
        } else if (accountId) {
            const hospital = await HospitalModel.findOne({ hospitalId: accountId });
            const refreshTokenExist = await RefreshTokenModel.findOne({ accountId: accountId })
            if (hospital && refreshTokenExist) {
                const accessToken = hospital.getAccessToken()
                res.cookie('hospitaltoken', accessToken, {
                    httpOnly: true,
                    sameSite: 'None',
                    secure: true,
                    maxAge: 15 * 60 * 1000, // 15 minutes
                });
                req.hospital = hospital;
                return next();
            }
        }
        //console.log('VERIFICATION MIDDLEWARE 4')
        return sendResponse(res, 401, false, null, 'UnAuthenicated');
    } catch (error) {
        console.error('Authentication error:', error);
        return sendResponse(res, 500, false, null, 'Server error during authentication');
    }
};

const SUSPENSION_TIME = 6 * 60 * 60 * 1000
export const VerifyAccount = async (req, res, next) => {
    const { verified, accountSuspended, blocked, temporaryAccountBlockTime } = req.hospital
    try {
        if(!verified){
            sendResponse(res, 401, false, null, 'You acount is not verified')
            return
        }
        if(blocked){
            sendResponse(res, 401, false, null, 'You acount has been blocked. contact admin for support')
            return
        }
        if(accountSuspended){
            console.log('REQ SUSPEN',accountSuspended)
            const timeDiff = Date.now() - new Date(temporaryAccountBlockTime).getTime();
            const remainingTime = Math.ceil((SUSPENSION_TIME - timeDiff) / (60 * 1000)); // in minutes
            return sendResponse(res, 403, false, null, `Account temporarily blocked. Try again in ${remainingTime} minutes.`);
        }
        return next();
    } catch (error) {
        console.log('UNABLE TO VERIFY HOSPITAL ACCOUNT', error)
        return sendResponse(res, 500, false, null, 'Unable to verify hospital account')
    }
}

export const AuthenticateHospitalSocket = async (socket, next) => {
    //console.log('Authenticating hospital socket:', socket.id)
    try {
        const cookies = socket.handshake.headers.cookie || '';  // Safeguard for missing cookies
        if (!cookies) {
            console.log('No cookies received');
            return next(new Error('No cookies provided'));
        }

        const parseCookies = (cookieString) => {
            return cookieString.split(';').reduce((acc, cookie) => {
                const [key, value] = cookie.trim().split('=');
                acc[key] = decodeURIComponent(value);
                return acc;
            }, {});
        };

        const cookieObj = parseCookies(cookies);
        const accessToken = cookieObj['hospitaltoken'];
        const accountId = cookieObj['hospitalauthid'];

        //console.log('Cookies:', cookies);
        //console.log('HOSPITAL','AccessToken:', accessToken, 'AccountId:', accountId);

        if (accessToken) {
            try {
                const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_TOKEN_SECRET);
                //console.log('Decoded token:', decoded);

                if (decoded.accountType === 'hospital') {
                    const user = await HospitalModel.findOne({ hospitalId: decoded.id });
                    const refreshTokenExist = await RefreshTokenModel.findOne({ accountId: decoded.id });
                    if (user && refreshTokenExist) {
                        socket.user = user;
                        if(!socket.user.verified){
                            return next(new Error('Account is not verified complete verification'));
                        }
                        if(socket.user.blocked){
                            return next(new Error('Account is not blocked contact support'));
                        }
                        return next();
                    }
                }
                return next(new Error('Invalid access token'));
            } catch (error) {
                if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
                    if (accountId) {
                        const user = await HospitalModel.findOne({ hospitalId: accountId });
                        const refreshTokenExist = await RefreshTokenModel.findOne({ accountId: accountId });
                        if (user && refreshTokenExist) {
                            socket.user = user;
                            if(!socket.user.verified){
                                return next(new Error('Account is not approved complete verification'));
                            }
                            if(socket.user.blocked){
                                return next(new Error('Account is not blocked contact support'));
                            }
                            socket.emit('tokenRefreshed', { accessToken: user.getAccessToken() });
                            return next();
                        }
                    }
                }

                console.error('Token verification error:', error);
                return next(new Error('Token expired or invalid'));
            }
        }

        if (accountId) {
            const user = await HospitalModel.findOne({ hospitalId: accountId });
            const refreshTokenExist = await RefreshTokenModel.findOne({ accountId: accountId });
            if (user && refreshTokenExist) {
                socket.user = user;
                if(!socket.user.verified){
                    return next(new Error('Account is not verified complete verification'));
                }
                if(socket.user.blocked){
                    return next(new Error('Account is not blocked contact support'));
                }
                socket.emit('tokenRefreshed', { accessToken: user.getAccessToken() });
                return next();
            }
        }

        return next(new Error('Unauthenticated'));
    } catch (error) {
        console.error('Authentication error:', error);
        return next(new Error('Server error during authentication'));
    }
};