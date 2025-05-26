import { useEffect, useState } from 'react'
import InputField from '../../Components/Helpers/InputField'
import AutoComplete from '../../Components/Helpers/AutoComplete'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { register } from '../../Helpers/apis/hospital/apis'
import LoadingBtn from '../../Components/Helpers/LoadingBtn'
import { useFetchState } from '../../Helpers/apis/fetch'

function Register() {
    const [ formData, setFormData ] = useState({})
    const [ city, setCity ] = useState('')
    const [ lat, setLat ] = useState('')
    const [ lng, setLng ] = useState('')
    const [ errorMsg, setErrorMsg ] = useState('')
    const [ loading, setLoading ] = useState(false)

    const navigate = useNavigate()
    const { data: stateData, isFetching: isFetchingStates } = useFetchState()


    const handleChange = (e) => {
        setFormData({
            ...formData, 
            [e.target.id]: e.target.value
        })
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

      useEffect(() => {
        console.log('Form Data:', formData);
      }, [formData]);
      
      const handleSubmit = async (e) => {
        const requiredFields = {
            name: 'Hospital name',
            email: 'Email address',
            password: 'Password',
            phoneNumber: 'Phone number',
            state: 'State',
            city: 'City',
            address: 'Address',
          };
        
          const missingFields = Object.entries(requiredFields)
            .filter(([key]) => !formData[key])
            .map(([_, label]) => label);
        
          if (missingFields.length > 0) {
            const message = `Please fill in the following: ${missingFields.join(', ')}`;
            setErrorMsg(message);
            setTimeout(() => {
              setErrorMsg('');
            }, 4000);
            return;
          }

        try {
            setLoading(true)
            const res = await register(formData)
            if(res.success){
                toast.success('Hospital Registered successfully')
                navigate('/hospital/login')
            } else {
                setErrorMsg(res.message)
                setTimeout(() => {
                    setErrorMsg('');
                }, 4000);
                toast.error(res.message)
            }
        } catch (error) {
            setErrorMsg('Unable to register hospital')
            setTimeout(() => {
                setErrorMsg('');
            }, 4000);
            toast.error('Unable to register hospital')
        } finally {
            setLoading(false)
        }
      }

  return (
    <div className='flex items-center justify-center h-screen w-screen'>
      <div className="max-small-phone:w-[90%] max-phone:w-[95%] w-[500px] border-[3px] border-red-500 p-4 rounded-[8px]">
        <h2 className="text-[32px] font-extrabold bg-gradient-to-r from-red-500 to-green-500 bg-clip-text text-transparent text-center">Register</h2>

        <div className="formGroup max-h-[75vh] overflow-y-auto scrollbar">
            <div className="inputGroup mt-3 flex-col items-start justify-start gap-1">
                <label className='label text-green-500'>Hospital Name:</label>
                <div className="w-full mt-[-2px]">
                    <InputField placeholder={'Enter Hospital Name'} id={'name'} onChange={handleChange} type={'text'} />
                </div>
            </div>

            <div className="inputGroup mt-3 flex-col items-start justify-start gap-1">
                <label className='label text-green-500'>Hospital Email Address:</label>
                <div className="w-full mt-[-2px]">
                    <InputField placeholder={'Enter Hospital email address'} id={'email'} onChange={handleChange} type={'email'} />
                </div>
            </div>

            <div className="inputGroup mt-3 flex-col items-start justify-start gap-1">
                <label className='label text-green-500'>Enter password:</label>
                <div className="w-full mt-[-2px]">
                    <InputField placeholder={'Enter Password'} id={'password'} onChange={handleChange} type={'password'} />
                </div>
            </div>

            <div className="inputGroup mt-3 flex-col items-start justify-start gap-1">
                <label className='label text-green-500'>Hospital Phone Number:</label>
                <div className="w-full mt-[-2px]">
                    <InputField placeholder={'Enter Hospital Phone Number'} id={'phoneNumber'} onChange={handleChange} type={'text'} />
                </div>
            </div>

            <div className="inputGroup mt-3 flex-col items-start justify-start gap-1">
                <div className="w-full mt-[-2px]">
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
                    {/**
                     * 
                    <InputField placeholder={'Enter State'} id={'state'} onChange={handleChange} type={'text'} />
                     */}
                </div>
            </div>

            {/**City drop down here */}
            <div className="inputGroup mt-3 flex-col items-start justify-start gap-1">
                <label className='label text-green-500'>City:</label>
                <div className="w-full mt-[6px]">
                    <AutoComplete setCity={setCity} setLat={setLat} setLng={setLng} />
                </div>
            </div>

            <div className="inputGroup mt-3 flex-col items-start justify-start gap-1">
                <label className='label text-green-500'>Address:</label>
                <div className="w-full mt-[-2px]">
                    <InputField placeholder={'Enter descrptive address'} id={'address'} onChange={handleChange} type={'text'} />
                </div>
            </div>

            <p className="errorText text-center text-[17px] mt-4">{errorMsg}</p>

            { loading ? (
                <LoadingBtn />
                ) : (
                    <div onClick={handleSubmit} className="btn">
                        Register
                    </div>
                ) 
            }   
            <p className="text-center text-[17px] mt-4">Don't have an account? <span onClick={() => navigate('/hospital/login')} className='text-red-500 cursor-pointer font-bold'>Login</span></p>
        </div>
      </div>
    </div>
  )
}

export default Register
