import { useSelector } from 'react-redux';
import { checkPermission, requestNotificationPermission, registerSW } from './Helpers/script';

const PushNotifications = ({ }) => {
    const data  = useSelector((state) => state.hospital);
    const user = data?.currentUser
    const email = user.email
    const accountType = user.accountType
    
  const enableNotifications = async () => {
    try {
      checkPermission();
      await requestNotificationPermission();
      const registerUser= await registerSW({
        email,
        accountType,
        backendURL: `${import.meta.env.VITE_SERVER_URL}`,
        vapidKey: `${import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY}`,
      });
      //console.log('registerUser', registerUser)
      //alert("Notifications enabled!");
    } catch (error) {
      console.error("Error enabling notifications:", error);
    }
  };

  return (
    <div>
        <button 
            onClick={enableNotifications} 
            className={`btn2`}
        >
            Enable Notifications
        </button>
    </div>
  );
};

export default PushNotifications;