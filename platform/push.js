import { API_URL } from './env';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

export async function registerPushServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  return navigator.serviceWorker.register('/sw.js');
}

export async function currentPushSubscription() {
  if (!('serviceWorker' in navigator)) return null;
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return null;
  return registration.pushManager.getSubscription();
}

export async function enablePush(email) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { ok: false, message: 'This browser cannot receive push notifications.' };
  }
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return {
      ok: false,
      message: 'Notifications are blocked. On iPhone, open MotivMate from the home-screen icon and allow notifications.',
    };
  }
  const keyResponse = await fetch(`${API_URL}/api/push/vapid`);
  if (!keyResponse.ok) {
    return { ok: false, message: 'Push is not configured on the server yet.' };
  }
  const { publicKey } = await keyResponse.json();
  const registration = await registerPushServiceWorker();
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });
  const save = await fetch(`${API_URL}/api/users/push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, subscription }),
  });
  if (!save.ok) return { ok: false, message: 'Could not save this device for push.' };
  return { ok: true };
}

export async function disablePush(email) {
  const subscription = await currentPushSubscription();
  if (subscription) await subscription.unsubscribe();
  await fetch(`${API_URL}/api/users/push`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
}
