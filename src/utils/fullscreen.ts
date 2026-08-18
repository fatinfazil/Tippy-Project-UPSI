/**
 * Cross-browser helpers around the Fullscreen API (with WebKit fallbacks).
 *
 * Note: entering fullscreen must be triggered by a user gesture (tap/click),
 * otherwise browsers reject the request. Call `enterFullscreen` from within an
 * event handler such as a button tap.
 */

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element;
  webkitExitFullscreen?: () => void;
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => void;
};

export const isFullscreenSupported = (): boolean => {
  if (typeof document === 'undefined') return false;
  const el = document.documentElement as FullscreenElement;
  return Boolean(el.requestFullscreen || el.webkitRequestFullscreen);
};

export const isFullscreenActive = (): boolean => {
  if (typeof document === 'undefined') return false;
  const doc = document as FullscreenDocument;
  return Boolean(doc.fullscreenElement || doc.webkitFullscreenElement);
};

export const isLandscape = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(orientation: landscape)').matches;
};

export const enterFullscreen = async (): Promise<void> => {
  const el = document.documentElement as FullscreenElement;
  try {
    if (el.requestFullscreen) {
      await el.requestFullscreen();
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    }
  } catch (err) {
    // Rejected (e.g. no user gesture or unsupported) - fail quietly.
    console.warn('Enter fullscreen failed:', err);
  }
};

export const exitFullscreen = async (): Promise<void> => {
  const doc = document as FullscreenDocument;
  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else if (doc.webkitExitFullscreen) {
      doc.webkitExitFullscreen();
    }
  } catch (err) {
    console.warn('Exit fullscreen failed:', err);
  }
};

export const toggleFullscreen = async (): Promise<void> => {
  if (isFullscreenActive()) {
    await exitFullscreen();
  } else {
    await enterFullscreen();
  }
};
