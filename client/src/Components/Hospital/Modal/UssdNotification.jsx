import { useState } from 'react'
import { acceptRequest, rejectRequest } from '../../../Helpers/apis/hospital/apis'
import toast from 'react-hot-toast'
import LoadingBtn from '../../Helpers/LoadingBtn'

function UssdNotification({ ussdRequestData }) {

      //accept ussd req
  const [ acceptingRequest, setAcceptingRequest ] = useState(false)
  const handleAcceptRequest = async (notificationId) => {
    if(!notificationId) return toast.error('Notification Id is required')
    if(acceptingRequest) return
    const formData = { notificationId }

    try {
        setAcceptingRequest(true)
        console.log('formData', formData)
        const res = await acceptRequest(formData)
        if(res.success){
            toast.success(res.message)
            window.location.reload()
        }else {
            toast.error(res.message)
        }
    } catch (error) {
        toast.error(`Unable to accept Notification ${notificationId}`)
    } finally {
        setAcceptingRequest(false)
    }
  }

  //reject ussd req
  const [ rejectingRequest, setRejectingRequest ] = useState(false)
  const handleRejectRequest = async (notificationId) => {
    if(!notificationId) return toast.error('Notification Id is required')
    if(rejectingRequest) return
    const formData = { notificationId }

    try {
        setRejectingRequest(true)
        console.log('formData', formData)
        const res = await rejectRequest(formData)
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
    <div>
      <h1 className='title text-[24px]'>Ussd Notification</h1>
      
      <div className="flex flex-col gap-1 mb-3 mt-5">
        <div className="flex flex-col">
            <h2 className='text-dark-blue font-bold text-[17px]'>Notification Id</h2>
            <p>{ussdRequestData?.notification?.notificationId}</p>
        </div>

        <div className="flex flex-col">
            <h2 className='text-dark-blue font-bold text-[17px]'>Request Id</h2>
            <p>{ussdRequestData?.notification?.ussdRequestId}</p>
        </div>

        <div className="flex flex-col">
            <h2 className='text-dark-blue font-bold text-[17px]'>Message</h2>
            <p>{ussdRequestData?.request?.message}</p>
        </div>
      </div>

    {
        acceptingRequest || rejectingRequest ? (
            <div className="">
                <LoadingBtn bgStyle={`${acceptingRequest ? 'bg-green-500' : 'bg-red-500'}`} />
            </div>
        ) : (
        <div className="flex items-center justify-between max-phone:flex-col gap-8">
            <div onClick={() => handleAcceptRequest(ussdRequestData?.notification?.notificationId)} className="btn2 bg-green-500 flex flex-1 items-center justify-center hover:bg-green-600">Accept</div>
            <div onClick={() => handleRejectRequest(ussdRequestData?.notification?.notificationId)} className="btn2 bg-red-500 flex flex-1 items-center justify-center hover:bg-red-600">Reject</div>
        </div>
        )
    }
    </div>
  )
}

export default UssdNotification
