/**
 * Applies service-worker updates instead of leaving the tab on a stale bundle.
 *
 * `registerType: 'autoUpdate'` installs the new worker and claims the page, but
 * it never reloads it, so the tab keeps running the previous JS until the next
 * navigation. That is the "one load behind after a deploy" effect, and it is
 * worst on iOS Safari, which has no hard refresh.
 *
 * Reloading mid-scene would drop a child back to the welcome screen, so a
 * pending update waits for a moment when nothing is in progress.
 */

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

let updateReady = false;
let safeToReload = true;

/** StoryPlayer reports whether reloading right now would interrupt the child. */
export function setSafeToReload(value: boolean): void {
  safeToReload = value;
  applyPendingUpdate();
}

function applyPendingUpdate(): void {
  if (!updateReady || !safeToReload) return;
  updateReady = false;
  window.location.reload();
}

export function initServiceWorkerAutoReload(): void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  // A first-ever install fires controllerchange too, but then there is no
  // stale bundle to replace and reloading would just flash the page.
  const hadController = Boolean(navigator.serviceWorker.controller);

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) return;
    updateReady = true;
    applyPendingUpdate();
  });

  // Safari only looks for a new worker on navigation, which a long-lived
  // standalone session may never perform. Poll, and check on every refocus.
  void navigator.serviceWorker.ready.then((registration) => {
    const check = () => {
      void registration.update().catch(() => {
        // Offline or the worker is gone; the next check will retry.
      });
    };

    window.setInterval(check, UPDATE_CHECK_INTERVAL_MS);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check();
    });
  });
}
