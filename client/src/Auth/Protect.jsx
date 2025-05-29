import { useDispatch, useSelector } from "react-redux";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {jwtDecode} from 'jwt-decode';
import { useEffect } from "react";
import axios from "axios"
import { verifyToken } from "../Helpers/apis/hospital/apis";
import { signInSuccess } from "../Redux/hospital/hospitalSlice";

axios.defaults.baseURL = import.meta.env.VITE_SERVER_URL

axios.defaults.withCredentials = true 

function AuthorizeHospital() {
    const data  = useSelector((state) => state.hospital);
    const hospital = data?.currentUser
    const token = localStorage.getItem('dmsquickresponse');
    const tokenExist = !!token;
    const dispatch = useDispatch()
    const navigate = useNavigate()
    
    useEffect(() => {
        const checkAuth = async () => {
          if (!tokenExist && !hospital) {
            console.log('No token and no hospital data');
            toast.error('PLEASE LOGIN');
            navigate('/hospital/login');
            return;
          }
      
          if (!token) {
            console.log('No token found');
            navigate('/hospital/login');
            return;
          }
      
          const decodedToken = jwtDecode(token);
      
          if (decodedToken.exp * 1000 < Date.now()) {
            // Token is expired
            try {
              const res = await verifyToken();
              if (res.success) {
                localStorage.setItem('dmsquickresponse', res?.token);
                dispatch(signInSuccess(res?.data));
                //next()
                //navigate('/hospital/dashboard');
              } else {
                console.log('Unable to refresh token res', res);
                //setErrorMsg(res.message);
                //setTimeout(() => setErrorMsg(''), 4000);
                toast.error(res.message || res.data);
                navigate('/hospital/login');
              }
            } catch (error) {
              console.log('Unable to refresh token', error);
              toast.error('Unable to refresh token');
              navigate('/hospital/login');
            }
            //toast.error('Session expired, Please login');
            //navigate('/hospital/login');
          }
        };
      
        checkAuth(); // ✅ call async function
      }, [data, tokenExist]);
    
      return tokenExist && hospital ? <Outlet /> : <Navigate to={'/'} />;
    }

    export {AuthorizeHospital}