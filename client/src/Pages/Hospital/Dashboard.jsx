import { useEffect } from "react";
import Sidebar from "../../Components/Hospital/Sidebar";
import io from 'socket.io-client';
import TopNotifications from "../../Components/Hospital/TopNotifications";
import TopAppointments from "../../Components/Hospital/TopAppointments";

const socket = io(`${import.meta.env.VITE_SOCKET_BASE_URL}/hospital`, {
  transports: ['websocket'],
  withCredentials: true,
});

socket.on('connect_error', (err) => {
  console.error('Socket connection error:', err.message);
});

function Dashboard({ setSelectedCard, setUssdRequestData, setAppointmentId }) {
  useEffect(() => {
    const audio = new Audio('/notification1.wav');

    // Ask for notification permission
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    const handleNewEmergency = (data) => {
      if (data.success) {
        setSelectedCard('ussdNotification');
        setUssdRequestData(data?.data);

        // Play sound
        audio.play().catch(err => {
          console.warn("Audio play blocked:", err);
        });

        // Show browser notification
        if (Notification.permission === 'granted') {
          new Notification('🚨 New Emergency', {
            body: `From ${data?.data?.request?.state}, ${data?.data?.request?.city}`,
            //icon: '/emergency-icon.png' // Optional icon
          });
        }
      }
    };

    socket.on('newUssdEmergency', handleNewEmergency);

    return () => {
      socket.off('newUssdEmergency', handleNewEmergency);
    };
  }, [setSelectedCard, setUssdRequestData]);

  return (
    <div className="flex w-full min-h-screen">
      <div className="w-[20%]">
        <Sidebar />
      </div>
      <div className="w-[80%]">
        <div className="mt-2">
            <TopNotifications />
        </div>

        <div className="mt-[-3rem]">
            <TopAppointments setSelectedCard={setSelectedCard} setAppointmentId={setAppointmentId} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
