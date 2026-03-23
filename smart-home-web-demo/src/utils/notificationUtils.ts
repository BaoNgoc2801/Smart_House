export async function ensureNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return false;
  }
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const res = await Notification.requestPermission();
  return res === 'granted';
}

export function showBrowserNotification(title: string, body: string) {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return;
  }
  if (Notification.permission !== 'granted') return;
  new Notification(title, { body });
}

export function speak(text: string) {
  if (typeof window === 'undefined' || typeof window.speechSynthesis === 'undefined') {
    return;
  }
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  synth.speak(utterance);
}

