/**
 * Registers the production service worker and forces a reload once a new
 * version takes control.
 *
 * `registerType: 'autoUpdate'` already skip-waits the worker. Without a
 * client-side reload, iOS Safari / installed PWAs keep showing the previous
 * JS bundle until the tab is closed. Checking again on visibility change
 * covers the common case of a child leaving the app open for days.
 */
import { registerSW } from 'virtual:pwa-register';

const UPDATE_INTERVAL_MS = 15 * 60 * 1000;

export function registerPwaUpdates(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;

      const check = () => {
        void registration.update();
      };

      window.setInterval(check, UPDATE_INTERVAL_MS);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });
      window.addEventListener('pageshow', (event) => {
        if (event.persisted) check();
      });
    },
  });
}
