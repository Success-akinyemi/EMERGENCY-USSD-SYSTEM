import { useState } from "react"
import { acceptAppointmentRequest } from "../../../Helpers/apis/hospital/apis"
import toast from "react-hot-toast"

function AcceptAppointment({ appointmentId }) {
    const [ formData, setFormData ] = useState({ notificationId: appointmentId.notificationId })
    const handleChange = (e) => {
        if (e.target.id === "time") {
            const [hour, minute] = e.target.value.split(":").map(Number);

            const period = hour >= 12 ? "PM" : "AM";
            const hour12 = hour % 12 || 12;

            setFormData({ ...formData, time: `${hour12}:${minute < 10 ? '0' + minute : minute} ${period}` })
        } else {
            setFormData({ ...formData, [e.target.id]: e.target.value })
        }
    }

    //accept ussd req
    const [ acceptingRequest, setAcceptingRequest ] = useState(false)
    const handleAcceptRequest = async (hospitalId, notificationId) => {
    if(!formData?.notificationId) return toast.error('Notification Id is required')
    if(!formData?.date) return toast.error('Appointment Date is required')
    if(!formData?.time) return toast.error('Appointment Day is required')

    if(acceptingRequest) return

    try {
        setAcceptingRequest(true)
        const res = await acceptAppointmentRequest(formData)
        console.log('resresres',res)
        if(res.success){
            toast.success(res.message)
            window.location.reload()
        }else {
            toast.error(res.message)
        }
    } catch (error) {
        console.log('error', error)
        toast.error(`Unable to accept Appointment ${notificationId}`)
    } finally {
        setAcceptingRequest(false)
    }
  }


  return (
    <div>
        <h1 className="title text-[30px]">Accept Appointment</h1>
        <p className="text-left text-[14px] font-bold">{appointmentId?.ussdRequest?.status}</p>

        <div className="flex flex-col gap-3 mt-5 mb-5">
            <div className="flex  flex-col gap-1.5">
                <h1 className="title text-[17px]">Request Id:</h1>
                <p className="">{appointmentId?.ussdRequestId}</p>
            </div>

            <div className="flex  flex-col gap-1.5">
                <h1 className="title text-[17px]">Notification Id:</h1>
                <p className="">{appointmentId?.notificationId}</p>
            </div>

            <div className="flex  flex-col gap-1.5">
                <h1 className="title text-[17px]">Message:</h1>
                <p className="">{appointmentId?.ussdRequest?.message}</p>
            </div>

            <div className="flex  flex-col gap-1.5">
                <h1 className="title text-[17px]">Enter Date:</h1>
                <input 
                    type="date" 
                    name="date" 
                    id="date" 
                    onChange={handleChange} 
                    min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                />
            </div>

            <div className="flex  flex-col gap-1.5">
                <h1 className="title text-[17px]">Enter Time:</h1>
                <input type="time" name="time" id="time" onChange={handleChange} />
            </div>
        </div>

        <div className="flex w-full">
            <button onClick={handleAcceptRequest} className="btn2 w-full">{ acceptingRequest ? 'Accepting' : 'Accept'}</button>
        </div>
    </div>
  )
}

export default AcceptAppointment
