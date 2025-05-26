import { sendResponse } from "../../middlewares/utils.js";

export async function newAdmin(req, res) {
    const { name, email, profileImg, permission, role } = req.body
}

export async function login(req, res) {
    const { email, password } = req.body;
    if(!email) return sendResponse(res, 400, false, null, 'Email is required');
    if(!password) return sendResponse(res, 400, false, null, 'Password is required');

    try {
        
    } catch (error) {
        console.error('UNABLE TO LOGIN ADMIN', error);
        return sendResponse(res, 500, false, null, 'Unable to login admin');
        
    }
}   