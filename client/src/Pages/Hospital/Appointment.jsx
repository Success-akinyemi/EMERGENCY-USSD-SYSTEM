import { useLocation } from "react-router-dom"
import Sidebar from "../../Components/Hospital/Sidebar"
import { useFetchAppointment } from "../../Helpers/apis/hospital/fetch"
import Spinner from "../../Components/Helpers/Spinner"
import { useState } from "react"
import { markAppointmentNotificationAsRead, rejectAppointRequest } from "../../Helpers/apis/hospital/apis"
import { useSelector } from "react-redux"
import toast from "react-hot-toast"

function Appointment({ setSelectedCard, setAppointmentId }) {
    const loc = useLocation()
    const pathName = loc.pathname.split('/')[3]
    const { data: appointmentData, isFetching } = useFetchAppointment(pathName)
    const data = appointmentData?.data
    
    const hospitalData  = useSelector((state) => state.hospital);
    const hospital = hospitalData?.currentUser

    //apis
    const [ marking, setMarking ] = useState(false)
    const handleMarkAsRead = async (hospitalId, notificationId) => {
        if(!hospitalId) return toast.error('Hospital Id is required')
        if(!notificationId) return toast.error('Notification Id is required')
        if(marking) return
        const formData = { hospitalId, notificationId }
        try {
            setMarking(true)
            //console.log('formData', formData)
            const res = await markAppointmentNotificationAsRead(formData)
            if(res.success){
                toast.success(res.message)
                window.location.reload()
            }else {
                toast.error(res.message)
            }
        } catch (error) {
            toast.error(`Unable to mark Appointment ${notificationId} as read`)
        } finally {
            setMarking(false)
        }
    }

  //accept ussd req
  const [ acceptingRequest, setAcceptingRequest ] = useState(false)
  const handleAcceptRequest = async (hospitalId, notificationId) => {
    if(!notificationId) return toast.error('Notification Id is required')
    if(acceptingRequest) return
    const formData = { notificationId }

    try {
        setAppointmentId(notificationId)
        setSelectedCard('acceptAppointment')
    } catch (error) {
        console.log('error', error)
        toast.error(`Unable to accept Appointment ${notificationId}`)
    } finally {
        setAcceptingRequest(false)
    }
  }

  //reject ussd req
  const [ rejectingRequest, setRejectingRequest ] = useState(false)
  const handleRejectRequest = async (hospitalId, notificationId) => {
    if(!notificationId) return toast.error('Notification Id is required')
    if(rejectingRequest) return
    const formData = { notificationId }

    try {
        setRejectingRequest(true)
        //console.log('formData', formData)
        const res = await rejectAppointRequest(formData)
        if(res.success){
            toast.success(res.message)
            window.location.reload()
        }else {
            toast.error(res.message)
        }
    } catch (error) {
        toast.error(`Unable to reject Notification ${notificationId}`)
    } finally {
        setRejectingRequest(false)
    }
  }


  return (
    <div className="flex w-full min-h-screen">
      <div className="w-[20%]">
        <Sidebar />
      </div>

      <div className="w-[80%]">
        {
            isFetching ? (
                <div className="flex items-center justify-center">
                    <Spinner />
                </div>
            ) : (
                <div className="page">
                    <h1 className="title">Appointment Request</h1>

                    <div className="flex flex-col w-full items-start mt-5 mb-5 gap-3">
                        <div className="">
                            <h3 className="title text-[15px]">Request Id</h3>
                            <p>{data?.ussdRequest?.ussdRequestId}</p>
                        </div>
                        <div className="">
                            <h3 className="title text-[15px]">Issue</h3>
                            <p>{data?.ussdRequest?.issue}</p>
                        </div>
                        <div className="">
                            <h3 className="title text-[15px]">Solved</h3>
                            <p className={`${data?.ussdRequest?.solved ? `text-green-500` : `text-red-500`}`}>{data?.ussdRequest?.solved ? 'Attended' : 'No Attended to'}</p>
                        </div>
                        <div className="">
                            <h3 className="title text-[15px]">Message</h3>
                            <p>{data?.ussdRequest?.message}</p>
                        </div>
                        <div className="">
                            <h3 className="title text-[15px]">Appointment Date</h3>
                            <p>
                                {
                                    data?.ussdRequest?.date && (
                                        new Date(data?.ussdRequest?.date).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })

                                    )
                                }
                            </p>
                        </div>
                        <div className="">
                            <h3 className="title text-[15px]">Appointment Time</h3>
                            <p>{data?.ussdRequest?.time}</p>
                        </div>
                    </div>

                    <div className="my-3">
                        <button onClick={() => handleMarkAsRead(hospital.hospitalId, data.notificationId)} className="p-2 border btn2">{data?.read ? "Read" : <span className="cursor-pointer">Mark as Read</span>}</button>
                    </div>
                    <div className="flex gap-2">
                        {
                            data?.status.toLowerCase() === 'accepted' 
                            ? 
                            <span className="btn2 py-1 px-1 bg-green-500 cursor-not-allowed">Accepted</span> 
                            :
                            data?.status.toLowerCase() === 'rejected'
                            ?
                            <span onClick={() => handleAcceptRequest(hospital.hospitalId, data)} className="btn2 py-1 px-1 bg-green-500">Accept</span>
                            :
                            <span className=""> <span onClick={() => handleAcceptRequest(hospital.hospitalId, data)} className="btn2 py-1 px-1 bg-green-500">Accept</span>  <span onClick={() => handleRejectRequest(hospital.hospitalId, item.notificationId)} className="btn2 py-1 px-1 bg-red-500">Reject</span> </span>
                        }
                    </div>
                </div>
            )
        }
      </div>
    </div>
  )
}

export default Appointment
