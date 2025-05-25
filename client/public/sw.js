let userEmail = null;
let backendURL = null;
let accountType = null

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const postMessageToClients = (data) => {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage(data);
    });
  });
};

const saveSubscription = async (subscription) => {
  if (!userEmail || !backendURL) {
    console.warn("User email or backend URL not set in service worker.");
    return { success: false, message: "Email or backend URL not set" };
  }

  const body = { subscription, email: userEmail, accountType };
  console.log('body', body)
  try {
    const response = await fetch(`${backendURL}/pushNotification/saveSubscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    //console.log('push response', response)
    return await response.json();
  } catch (error) {
    console.error("Failed to save subscription:", error);
    return { success: false, message: "Failed to save subscription" };
  }
};

self.addEventListener("message", async (event) => {
  if (event.data && event.data.type === 'INIT_PUSH') {
    userEmail = event.data.email;
    backendURL = event.data.backendURL;
    accountType = event.data.accountType

    try {
      const subscription = await self.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(event.data.vapidKey),
      });

      const response = await saveSubscription(subscription);
      postMessageToClients({
        type: 'SUBSCRIPTION_RESULT',
        success: response.success,
        message: response?.message || 'Push subscription processed.',
      });
    } catch (error) {
      console.error("Subscription error:", error);
      postMessageToClients({
        type: 'SUBSCRIPTION_RESULT',
        success: false,
        message: 'Push subscription failed',
      });
    }
  }
});

self.addEventListener("push", (e) => {
  let notificationData = { title: "DMS", body: "Welcome to DMS" };
  if (e.data) {
    try {
      const data = JSON.parse(e.data.text());
      notificationData.title = data.title || notificationData.title;
      notificationData.body = data.message || notificationData.body;
    } catch (err) {
      console.error("Push data parsing error:", err);
    }
  }
  self.registration.showNotification(notificationData.title, {
    body: notificationData.body,
  });
});
