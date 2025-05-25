import { useEffect, useState } from "react";
import axios from 'axios'
import toast from "react-hot-toast";

axios.defaults.baseURL = import.meta.env.VITE_SERVER_URL

export function useFetchState(query) {
    const [states, setStates] = useState({
      isFetching: true,
      data: null,
      status: null,
      serverError: null,
    });
  
    useEffect(() => {
      const fetchStatesData = async () => {
        try {
          const { data, status } =  
                                        await axios.get(`state/getStates`, {
                                            withCredentials: true,
                                        })
          if (status === 200) {
            setStates({ isFetching: false, data: data, status: status, serverError: null });
          } else {
            setStates({ isFetching: false, data: null, status: status, serverError: null });
          }
        } catch (error) {
            console.log('data hui', error)                                
          const errorMsg = error.response?.data?.data;
          toast.error(errorMsg || "Request Failed");
          setStates({ isFetching: false, data: null, status: null, serverError: error });
        }
      };
  
      fetchStatesData();
    }, [query]);
  
    return states;
  }