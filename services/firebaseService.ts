import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Placeholder config - in a real app, this comes from process.env
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "ziyarat-app.firebaseapp.com",
  projectId: "ziyarat-app",
  storageBucket: "ziyarat-app.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

let messaging: any = null;

try {
  // Only initialize if we are in a browser environment and config is somewhat valid
  // For this demo, we won't crash if it fails, just log a warning.
  // const app = initializeApp(firebaseConfig);
  // messaging = getMessaging(app);
  console.log("Firebase Service initialized (Mock Mode)");
} catch (error) {
  console.warn("Firebase initialization failed:", error);
}

export const requestNotificationPermission = async (): Promise<string | null> => {
  if (!messaging) {
    // Return a mock token for the demo
    return "mock_fcm_token_" + Date.now();
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY' });
      return token;
    }
  } catch (error) {
    console.error('An error occurred while retrieving token. ', error);
  }
  return null;
};

export const onMessageListener = (callback: (payload: any) => void) => {
  if (!messaging) return;
  
  onMessage(messaging, (payload) => {
    callback(payload);
  });
};