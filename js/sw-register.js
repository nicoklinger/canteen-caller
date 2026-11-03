// Offline support: once loaded, the app keeps working if the canteen Wi-Fi drops.
export function registerServiceWorker() {
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}
