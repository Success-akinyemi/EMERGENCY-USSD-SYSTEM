import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { addAppointmentsTime } from '../../../Helpers/apis/hospital/apis'

function AdjustTime({ setSelectedCard }) {
    const [ formData, setFormData ] = useState({})
    const [ addingTime, setAddingTime ] = useState(false)

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value })
    }

    const handleAddTime = async () => {
        if(!formData?.time || formData?.time < 1) return toast.error('Please enter a number of time greater than zero')
        
        try {
            setAddingTime(true)
            const res = await addAppointmentsTime(formData)
            if(res.success) {
                toast.success(res.message)
                setSelectedCard()
            } else {
                toast.error(res.message)
            }
        } catch (error) {
            toast.error('Unable to add time')
        } finally {
            setAddingTime(false)
        }
    }

  return (
    <div className='flex flex-col'>
        <h3 className="title text-[18px]">Adjust the appointment time for all users today</h3>
        
        <p className='text-[14px]'>Note wil add time accros all appointments schedule for today</p>

        <p className="text-dark-blue">Date: </p>

        <div className="inputGroup flex-col p-0 mt-3">
            <label className='label'>Time to add in Minutes</label>
            <input onChange={handleChange} id='time' type="number" className="input p-0" />
        </div>
        <p className='text-[13px] font-semibold'>{ formData?.time ? (formData?.time / 60).toFixed(2) : 0} hour(s)</p>

        <div onClick={() => handleAddTime()} className="btn2 mt-4 text-center">
            { addingTime ? 'Adding Time' : 'Add Time' }
        </div>
    </div>
  )
}

export default AdjustTime
