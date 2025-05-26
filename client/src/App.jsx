import React, { useState } from 'react'
import LandingPage from './Pages/LandingPage'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Login from './Pages/Hospital/Login'
import Register from './Pages/Hospital/Register'
import toast, { Toaster } from 'react-hot-toast'
import Dashboard from './Pages/Hospital/Dashboard'
import { AuthorizeHospital } from './Auth/Protect'
import Profile from './Pages/Hospital/Profile'
import UssdNotification from './Components/Hospital/Modal/UssdNotification'
import { useEffect } from 'react'
import Emergencies from './Pages/Hospital/Emergencies'
import Appointments from './Pages/Hospital/Appointments'
import AcceptAppointment from './Components/Hospital/Modal/AcceptAppointment'
import AdminDashboard from './Pages/Admin/Dashboard'

function App() {
    const [ selectedCard, setSelectedCard ] = useState()
    const [ ussdRequestData, setUssdRequestData ] = useState()
    const [ appointmentId, setAppointmentId ] = useState()


    const closePopup = () => {
      setSelectedCard(null);
    };

    useEffect(() => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
            console.log('HELO')
        if (event.data?.type === 'SUBSCRIPTION_RESULT') {
            const { success, message } = event.data;
            alert(message);
            toast.success(message)
        }
        });
    }
    }, []);


    const renderPopup = () => {

        switch(selectedCard){
          case 'ussdNotification' : 
            return (
              <div>
                <UssdNotification closePopup={closePopup} ussdRequestData={ussdRequestData} />
              </div>
            )

            case 'acceptAppointment' : 
            return (
              <div>
                <AcceptAppointment closePopup={closePopup} appointmentId={appointmentId} />
              </div>
            )
        }
      }

  return (
    <div className='app'>
        {
            selectedCard && (
              <>
                <div className='popup-overlay z-40 fixed flex items-center justify-center top-0 left-0 w-[100vw] h-[100vh] bg-[#A59B9B4D] '>
                  <div className={`z-50 max-small-phone:w-[95%] max-phone:w-[90%] w-[551px] bg-white shadow-xl rounded-[12px] p-4 flex flex-col`}>

                    <div  className="flex justify-end items-end">
                        <div onClick={() => setSelectedCard('')} className="text-red-500 transition-all hover:text-red-700 cursor-pointer">
                            Close
                        </div>
                    </div>

                    <div className='w-full z-[99999] mt-2'>
                        {renderPopup()}
                    </div>

                  </div>
                </div>
              </>
            )
        }
    <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<LandingPage />} />
          {/**HOSPITAL */}
          <Route path='/hospital/register' element={<Register />} />
          <Route path='/hospital/login' element={<Login />} />
            <Route element={<AuthorizeHospital />}>
                <Route path='/hospital/dashboard' element={<Dashboard setSelectedCard={setSelectedCard} setUssdRequestData={setUssdRequestData} setAppointmentId={setAppointmentId} />} />
            </Route>
            <Route element={<AuthorizeHospital />}>
                <Route path='/hospital/emergencies' element={<Emergencies />} />
            </Route>
            <Route element={<AuthorizeHospital />}>
                <Route path='/hospital/appointments' element={<Appointments setSelectedCard={setSelectedCard} setAppointmentId={setAppointmentId} />} />
            </Route>
            <Route element={<AuthorizeHospital />}>
                <Route path='/hospital/profile' element={<Profile />} />
            </Route>

            {/**ADMIN */}
            <Route element={<AuthorizeHospital />}>
            </Route>
                <Route path='/admin/dashboard' element={<AdminDashboard setSelectedCard={setSelectedCard} setUssdRequestData={setUssdRequestData} />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
