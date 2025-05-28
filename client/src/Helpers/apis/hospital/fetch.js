import { useEffect, useState } from "react";
import axios from 'axios'
import toast from "react-hot-toast";

axios.defaults.baseURL = import.meta.env.VITE_SERVER_URL

/**
 * 
export function useFetchNotification(page = 1, limit = 10, read) {
    const [notification, setNotification] = useState({
        isFetching: true,
        data: null,
        status: null,
        serverError: null,
    });

    useEffect(() => {
        const fetchNotificationData = async () => {
            try {
                const params = new URLSearchParams();
                params.append("page", page);
                params.append("limit", limit);
                if (read !== undefined) params.append("read", read);

                const { data, status } = await axios.get(
                    `hospital/ussd/getUssdNotification?${params.toString()}`,
                    { withCredentials: true }
                );

                if (status === 200) {
                    setNotification({
                        isFetching: false,
                        data,
                        status,
                        serverError: null,
                    });
                } else {
                    setNotification({
                        isFetching: false,
                        data: null,
                        status,
                        serverError: null,
                    });
                }
            } catch (error) {
                const errorMsg = error?.response?.data?.data;
                toast.error(errorMsg || "Request Failed");
                setNotification({
                    isFetching: false,
                    data: null,
                    status: null,
                    serverError: error,
                });
            }
        };
        fetchNotificationData();
    }, [page, limit, read]);

    return notification;
}

 */

//get all emergencies
export function useFetchNotification(query) {
    const [notification, setNotification] = useState({
      isFetching: true,
      data: null,
      status: null,
      serverError: null,
    });
  
    useEffect(() => {
      const fetchNotificationData = async () => {
        try {
          const { data, status } = await axios.get(`hospital/emergency/getUssdNotification${query || ''}`, {
            withCredentials: true,
          });
  
          if (status === 200) {
            setNotification({ isFetching: false, data: data, status: status, serverError: null });
          } else {
            setNotification({ isFetching: false, data: null, status: status, serverError: null });
          }
        } catch (error) {
          const errorMsg = error.response?.data?.data;
          toast.error(errorMsg || "Request Failed");
          setNotification({ isFetching: false, data: null, status: null, serverError: error });
        }
      };
  
      fetchNotificationData();
    }, [query]);
  
    return notification;
  }
  
//get all appointments
export function useFetchAppointments(query) {
    const [notification, setNotification] = useState({
      isFetching: true,
      data: null,
      status: null,
      serverError: null,
    });
  
    useEffect(() => {
      const fetchNotificationData = async () => {
        try {
          const { data, status } = await axios.get(`hospital/appointment/getUssdNotification${query || ''}`, {
            withCredentials: true,
          });
  
          if (status === 200) {
            setNotification({ isFetching: false, data: data, status: status, serverError: null });
          } else {
            setNotification({ isFetching: false, data: null, status: status, serverError: null });
          }
        } catch (error) {
          const errorMsg = error.response?.data?.data;
          toast.error(errorMsg || "Request Failed");
          setNotification({ isFetching: false, data: null, status: null, serverError: error });
        }
      };
  
      fetchNotificationData();
    }, [query]);
  
    return notification;
  }

//get an appointent
export function useFetchAppointment(query){
    if(!query) return toast.error('Appointment Id is required')
    const [ appointment, setAppointment] = useState({ isFetching: true, data: null, status: null, serverError: null, })
    useEffect(() => {
        const fetchAppointmentData = async () => {
            try {
                const { data, status} = await axios.get(`hospital/appointment/getANotification/${query}`, {withCredentials: true})
                //console.log('Data from Hooks>>>', data, 'STATUS', status)

                if(status === 200){
                    setAppointment({ isFetching: false, data: data, status: status, serverError: null})
                } else{
                    setAppointment({ isFetching: false, data: null, status: status, serverError: null})
                }
            } catch (error) {
                const errorMsg = error.response.data.data
                toast.error(errorMsg || 'Request Failed')
                setAppointment({ isFetching: false, data: null, status: null, serverError: error})
            }
        }
        fetchAppointmentData()
    }, [query])

    return appointment
}
  
