import { useSelector } from "react-redux";
import PushNotifications from "../../Components/Helpers/PushNotifications"
import Sidebar from "../../Components/Hospital/Sidebar"
import { useEffect, useState } from "react";
import InputField from "../../Components/Helpers/InputField";
import { useFetchState } from "../../Helpers/apis/fetch";
import AutoComplete from "../../Components/Helpers/AutoComplete";

function Profile() {
    const data  = useSelector((state) => state.hospital);
    const hospital = data?.currentUser

    const [ formData, setFormData ] = useState({})
    const [ city, setCity ] = useState('')
    const [ lat, setLat ] = useState('')
    const [ lng, setLng ] = useState('')

    const handleChange = () => {
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

    console.log('hospital', hospital)
    const { data: stateData, isFetching } = useFetchState()
    console.log('stateData',stateData)

    useEffect(() => {
        console.log('Form Data:', formData);
    }, [formData]);
  return (
    <div className="flex w-full min-h-screen">
        <div className="w-[20%]">
            <Sidebar />
        </div>

      <div className="w-[80%]">
        <div className="page flex flex-col items-center justify-center">
            <h1 className="mt-3 title text-left w-full">Profile</h1>

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


            </div>

            <PushNotifications />
            profile
        </div>
      </div>
    </div>
  )
}

export default Profile
