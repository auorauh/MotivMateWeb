const STORAGE_KEY = 'mm-scheduled-notifications';
const timers = [];

export function setNotificationHandler() {}

export function addNotificationReceivedListener() {
  return { remove() {} };
}

export function addNotificationResponseReceivedListener() {
  return { remove() {} };
}

export function removeNotificationSubscription(subscription) {
  subscription?.remove?.();
}

export async function getPermissionsAsync() {
  if (typeof Notification === 'undefined') return { status: 'denied' };
  return { status: Notification.permission === 'granted' ? 'granted' : Notification.permission };
}

export async function requestPermissionsAsync() {
  if (typeof Notification === 'undefined') return { status: 'denied' };
  const status = await Notification.requestPermission();
  return { status };
}

export async function getExpoPushTokenAsync() {
  return { data: '' };
}

function readScheduled() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function msUntil(hour, minute) {
  const next = new Date();
  next.setHours(hour, minute, 0, 0);
  if (next <= new Date()) next.setDate(next.getDate() + 1);
  return next.getTime() - Date.now();
}

function arm(notification) {
  const trigger = notification?.trigger;
  if (!trigger || typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  const id = setTimeout(() => {
    try {
      new Notification(notification.content?.title || 'MotivMate', {
        body: notification.content?.body || '',
      });
    } catch {
      /* Notification can throw if permission changes mid-session. */
    }
    if (trigger.repeats) arm(notification);
  }, msUntil(trigger.hour, trigger.minute));
  timers.push(id);
}

export async function scheduleNotificationAsync(notification) {
  const list = readScheduled();
  list.push(notification);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  arm(notification);
}

export async function cancelAllScheduledNotificationsAsync() {
  timers.splice(0).forEach((id) => clearTimeout(id));
  localStorage.removeItem(STORAGE_KEY);
}

export async function getAllScheduledNotificationsAsync() {
  return readScheduled();
}

export function restoreScheduledNotifications() {
  readScheduled().forEach(arm);
}

if (typeof window !== 'undefined') {
  restoreScheduledNotifications();
}
