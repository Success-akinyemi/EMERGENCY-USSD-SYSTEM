import { useEffect, useState } from 'react'
import InputField from '../../Components/Helpers/InputField'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { login } from '../../Helpers/apis/hospital/apis'
import LoadingBtn from '../../Components/Helpers/LoadingBtn'
import { useDispatch } from 'react-redux'
import { signInSuccess } from '../../Redux/hospital/hospitalSlice'

function Login() {
    const dispatch = useDispatch()
    const [ formData, setFormData ] = useState({})
    const [ errorMsg, setErrorMsg ] = useState('')
    const [ loading, setLoading ] = useState(false)
    const navigate = useNavigate()

    const handleChange = (e) => {
        setFormData({
            ...formData, 
            [e.target.id]: e.target.value
        })
    }

      useEffect(() => {
        console.log('Form Data:', formData);
      }, [formData]);
      
      const handleSubmit = async (e) => {
        const requiredFields = {
            emailOrPhone: 'Email address',
            password: 'Password',
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
            const res = await login(formData)
            if(res.success){
                toast.success('Hospital login successfully')
                localStorage.setItem('dmsquickresponse', res?.token)
                dispatch(signInSuccess(res?.data))
                navigate('/hospital/dashboard')
            } else {
                setErrorMsg(res.message)
                setTimeout(() => {
                    setErrorMsg('');
                }, 4000);
                toast.error(res.message)
            }
        } catch (error) {
            setErrorMsg('Unable to login hospital')
            setTimeout(() => {
                setErrorMsg('');
            }, 4000);
            toast.error('Unable to login hospital')
        } finally {
            setLoading(false)
        }
      }

  return (
    <div className='flex items-center justify-center h-screen w-screen'>
      <div className="max-small-phone:w-[90%] max-phone:w-[95%] w-[500px] border-[3px] border-red-500 p-4 rounded-[8px]">
        <h2 className="text-[32px] font-extrabold bg-gradient-to-r from-red-500 to-green-500 bg-clip-text text-transparent text-center">Login</h2>

        <div className="formGroup max-h-[75vh] overflow-y-auto scrollbar">

            <div className="inputGroup mt-3 flex-col items-start justify-start gap-1">
                <label className='label text-green-500'>Hospital Email Address or Phone Number:</label>
                <div className="w-full mt-[-2px]">
                    <InputField placeholder={'Enter Hospital email address or phone number'} id={'emailOrPhone'} onChange={handleChange} type={'text'} />
                </div>
            </div>

            <div className="inputGroup mt-3 flex-col items-start justify-start gap-1">
                <label className='label text-green-500'>Enter password:</label>
                <div className="w-full mt-[-2px]">
                    <InputField placeholder={'Enter Password'} id={'password'} onChange={handleChange} type={'password'} />
                </div>
            </div>  

            <p className="errorText text-center text-[17px] mt-4">{errorMsg}</p>

            {
                loading ? (
                    <LoadingBtn />
                ) : (
                    <div onClick={handleSubmit} className="btn">
                        Login
                    </div>
                )
            }
            <p className="text-center text-[17px] mt-4">Don't have an account? <span onClick={() => navigate('/hospital/register')} className='text-red-500 cursor-pointer font-bold'>Register</span></p>
        </div>
      </div>
    </div>
  )
}

export default Login
