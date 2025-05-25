export const checkPermission = () => {
  if (!('serviceWorker' in navigator)) {
    throw new Error("No support for service worker!");
  }
  if (!('Notification' in window)) {
    throw new Error("No support for notification API");
  }
  if (!('PushManager' in window)) {
    throw new Error("No support for Push API");
  }
};

export const registerSW = async ({ email, backendURL, accountType, vapidKey }) => {
  const registration = await navigator.serviceWorker.register('/sw.js');
  if (registration.active) {
    registration.active.postMessage({
      type: 'INIT_PUSH',
      email,
      backendURL,
      accountType,
      vapidKey,
    });
  } else {
    navigator.serviceWorker.ready.then((reg) => {
      reg.active?.postMessage({
        type: 'INIT_PUSH',
        email,
        backendURL,
        accountType,
        vapidKey,
      });
    });
  }
  return registration;
};

export const requestNotificationPermission = async () => {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error("Notification permission not granted");
  }
};
