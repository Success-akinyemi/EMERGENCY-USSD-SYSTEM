import axios from "axios"


axios.defaults.baseURL = import.meta.env.VITE_SERVER_URL
axios.defaults.withCredentials = true

export async function register(formData){
    try {
        const res = await axios.post('/hospital/auth/register', formData, 
            {
                withCredentials: true,
                headers: { "Content-Type": "multipart/form-data" }
            }
        )
        if(res.data.success){
            return res.data
        }
    } catch (error) {
        const res = error.response.data || 'Unable to register hospital'
        console.log('ERROR', res)
        return res
    }
}

export async function login(formData){
    try {
        const res = await axios.post('/hospital/auth/login', formData, {withCredentials: true})
        if(res.data.success){
            return res.data
        }
    } catch (error) {
        const res = error.response.data || 'Unable to login hospital'
        return res
    }
}

export async function logout(formData){
    try {
        const res = await axios.post('/hospital/auth/logout', formData, {withCredentials: true})
        return res.data
    } catch (error) {
        const res = error.response.data || 'Unable to logout hosipital'
        return res
    }
}

export async function updateHospital(formData){
    try {
        const res = await axios.post('/hospital/auth/updateHospital', formData, 
            {
                withCredentials: true,
                headers: { "Content-Type": "multipart/form-data" }
            }
        )
        if(res.data.success){
            return res.data
        }
    } catch (error) {
        const res = error.response.data || { data: 'Unable to create new category'}
        return res
    }
}

export async function updatePassword(formData){
    try {
        const res = await axios.post('/hospital/auth/logout', formData, {withCredentials: true})
        if(res.data.success){
            return res.data
        }
    } catch (error) {
        const res = error.response.data || 'Unable to logout hosipital'
        return res
    }
}

export async function verifyToken(formData){
    try {
        const res = await axios.get('/hospital/auth/verifyToken', formData, {withCredentials: true})
        if(res.data.success){
            return res.data
        }
    } catch (error) {
        const res = error.response.data || 'Unable to refresh token'
        return res
    }
}

/**EMERGENCY */
//mark emergency ussd Request as read
export async function markNotificationAsRead(formData){
    try {
        const res = await axios.post('/hospital/emergency/markNotificationAsRead', formData, {withCredentials: true})
        if(res.data.success){
            return res.data
        }
    } catch (error) {
        const res = error.response.data || 'Unable to mark notification as read'
        return res
    }
}

//accept emergency ussd Request
export async function acceptRequest(formData){
    try {
        const res = await axios.post('/hospital/emergency/acceptRequest', formData, {withCredentials: true})
        if(res.data.success){
            return res.data
        } else {
            return res.data
        }
    } catch (error) {
        const res = error.response.data || 'Unable to accept ussd emergency request'
        return res
    }
}

//reject emergency ussd Request
export async function rejectRequest(formData){
    try {
        const res = await axios.post('/hospital/emergency/rejectRequest', formData, {withCredentials: true})
        if(res.data.success){
            return res.data
        }
    } catch (error) {
        const res = error.response.data || 'Unable to reject ussd emergency request'
        return res
    }
}

/**APPOINTMENT */
//mark appointment ussd Request as read
export async function markAppointmentNotificationAsRead(formData){
    try {
        const res = await axios.post('/hospital/appointment/markNotificationAsRead', formData, {withCredentials: true})
        if(res.data.success){
            return res.data
        }
    } catch (error) {
        const res = error.response.data || 'Unable to mark appointment notification as read'
        return res
    }
}

//accept appointment ussd Request
export async function acceptAppointmentRequest(formData){
    try {
        const res = await axios.post('/hospital/appointment/acceptRequest', formData, {withCredentials: true})
        console.log('klop',res)
        if(res.data.success){
            return res.data
        } else{
            return res.data
        }
    } catch (error) {
        const res = error.response.data || 'Unable to accept ussd appointment request'
        console.log('res', res)
        return res
    }
}

//reject appointment ussd Request
export async function rejectAppointRequest(formData){
    try {
        const res = await axios.post('/hospital/appointment/rejectRequest', formData, {withCredentials: true})
        if(res.data.success){
            return res.data
        }
    } catch (error) {
        const res = error.response.data || 'Unable to reject ussd appointment request'
        return res
    }
}