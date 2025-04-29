// Utility for browser notification and sound/vibration

export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

export function showBrowserNotification(title: string, options?: NotificationOptions) {
  if ('Notification' in window && Notification.permission === 'granted') {
    const n = new Notification(title, options);
    return n;
  }
}

export function playNotificationSound() {
  const audio = new Audio('/notification-chime.mp3');
  audio.volume = 0.5;
  audio.play();
}

export function vibrateNotification() {
  if (navigator.vibrate) {
    navigator.vibrate([100, 30, 100]);
  }
}
