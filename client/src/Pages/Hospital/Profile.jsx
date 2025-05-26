import { useDispatch, useSelector } from "react-redux";
import PushNotifications from "../../Components/Helpers/PushNotifications"
import Sidebar from "../../Components/Hospital/Sidebar"
import { useEffect, useState } from "react";
import InputField from "../../Components/Helpers/InputField";
import { useFetchState } from "../../Helpers/apis/fetch";
import AutoComplete from "../../Components/Helpers/AutoComplete";
import { updateHospital } from "../../Helpers/apis/hospital/apis";
import toast from "react-hot-toast";
import { signInSuccess } from "../../Redux/hospital/hospitalSlice";

function Profile() {
    const data  = useSelector((state) => state.hospital);
    const hospital = data?.currentUser
    const dispatch = useDispatch()

    const [ formData, setFormData ] = useState({})
    const [ city, setCity ] = useState('')
    const [ lat, setLat ] = useState('')
    const [ lng, setLng ] = useState('')

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value })
    }

        useEffect(() => {
        if (city && lat && lng) {
          setFormData(prev => {
            // Only update if values are different
            if (prev.city === city && prev.lat === lat && prev.lng === lng) {
              return prev; // No change
            }
      
            return {
              ...prev,
              city,
              lat,
              lng
            };
          });
        }
      }, [city, lat, lng]);

    //console.log('hospital', hospital)
    const { data: stateData, isFetching: isFetchingStates } = useFetchState()
    
    /**
     * 
    useEffect(() => {
        console.log('Form Data:', formData);
    }, [formData]);
     */

    const [ errorMsg, setErrorMsg ] = useState('')
    const [ loading, setLoading ] = useState(false)
    const handleProfileUpdate = async () => {
        if(loading) return
        try {
            setLoading(true)
            const res = await updateHospital(formData)
            if(res.success){
                toast.success(res.message || 'Hospital update successfully')
                dispatch(signInSuccess(res?.data))
            } else {
                setErrorMsg(res.message)
                setTimeout(() => {
                    setErrorMsg('');
                }, 4000);
                toast.error(res.message)
            }
        } catch (error) {
            setErrorMsg('Unable to update hospital')
            setTimeout(() => {
                setErrorMsg('');
            }, 4000);
            toast.error('Unable to update hospital')
        } finally {
            setLoading(false)
        }
    }
  return (
    <div className="flex w-full min-h-screen">
        <div className="w-[20%]">
            <Sidebar />
        </div>

      <div className="w-[80%]">
        <div className="page flex flex-col items-center justify-center">
            <h1 className="mt-3 title text-left w-full">Profile</h1>

            {/**SHOW PROFILE */}
            <div className="flex flex-col w-full items-start mt-5 mb-5 gap-3">
                <div className="">
                    <h3 className="title text-[15px]">Hospital ID</h3>
                    <p>{hospital.hospitalId}</p>
                </div>
                <div className="">
                    <h3 className="title text-[15px]">Hospital Name</h3>
                    <p>{hospital.name}</p>
                </div>
                <div className="">
                    <h3 className="title text-[15px]">Hospital Email</h3>
                    <p>{hospital.email}</p>
                </div>
                <div className="">
                    <h3 className="title text-[15px]">Hospital Phone Number</h3>
                    <p>{hospital.phoneNumber}</p>
                </div>
                <div className="">
                    <h3 className="title text-[15px]">State</h3>
                    <p>{hospital.state}</p>
                </div>
                                <div className="">
                    <h3 className="title text-[15px]">City</h3>
                    <p>{hospital.city}</p>
                </div>
                <div className="">
                    <h3 className="title text-[15px]">Hospital Address</h3>
                    <p>{hospital.address}</p>
                </div>
            </div>

            {/**UPDATE PROFILE */}
            <div className="flex flex-col max-small-phone:w-[95%] max-phone:w-[90%] w-[40%] border-dark-blue border-[3px] p-1.5 rounded-[4px] ">
                <h2 className="title max-phone:text-[16px] text-[17px]">Update Profile</h2>
                <div className="inputGroup mt-3 flex-col items-start justify-start gap-1">
                    <label className='label text-green-500'>Hospital Name:</label>
                    <div className="w-full mt-[-2px]">
                        <input defaultValue={hospital.name} id={'name'} onChange={handleChange} type={'text'} className="input border-b-gray-300 focus:border-b-dark-blue" />
                    </div>
                </div>

                <div className="inputGroup mt-3 flex-col items-start justify-start gap-[-8px]">
                    <label className='label text-green-500'>Hospital Phone Number:</label>
                    <div className="w-full mt-[-2px]">
                        <input className="input border-b-gray-300 focus:border-b-dark-blue" defaultValue={hospital.phoneNumber} id={'phoneNumber'} onChange={handleChange} type={'text'} />
                    </div>
                </div>

                {
                    isFetchingStates ? (
                        <p className="">Loading States...</p>
                    ): (
                        <div className="inputGroup mt-3 flex-col items-start justify-start gap-[-8px]">
                            <label className='label text-green-500'>State</label>
                            <div className="w-full mt-[-2px]">
                                <select name="state" id="state" onChange={handleChange} className="input border-b-gray-300 focus:border-b-dark-blue">
                                    <option value="">Select State</option>
                                    {
                                        stateData?.data?.map((item, idx) => (
                                            <option key={idx} value={item.state} >{item.state}</option>
                                        ))
                                    }
                                </select>
                            </div>
                        </div>
                    )
                }

                <div className="inputGroup mt-3 flex-col items-start justify-start gap-[-8px]">
                    <label className='label text-green-500'>City</label>
                    <div className="w-full mt-[-2px]">
                        <AutoComplete setCity={setCity} setLat={setLat} setLng={setLng} />
                    </div>
                </div>

                <div className="inputGroup mt-3 flex-col items-start justify-start gap-[-8px]">
                    <label className='label text-green-500'>Address</label>
                    <div className="w-full mt-[-2px]">
                        <input className="input border-b-gray-300 focus:border-b-dark-blue" defaultValue={hospital.address} id={'address'} onChange={handleChange} type={'text'} />
                    </div>
                </div>

                <p className="errorText text-center text-[17px] mt-4">{errorMsg}</p>
                <div className="mt-7">
                    <button onClick={handleProfileUpdate} className="btn2 w-full">{ loading ? 'Updating...' : 'Update'}</button>
                </div>

            </div>

            {/**NOTIFICATIONS */}
            <div className="flex flex-col w-full text-left items-start mb-4">
                <h3 className="title text-[15px]">Enable Push notifcation</h3>
                <p>Allow push notifications to get updates on emergencies and appointments</p>
                
                <PushNotifications />
            </div>
            
        </div>
      </div>
    </div>
  )
}

export default Profile
