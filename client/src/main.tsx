import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from '@/App';
import '@/index.css';

/** Force the yellow BanaGifts mark — browsers often keep an old /favicon.ico forever. */
function forceBrandFavicon() {
  document.querySelectorAll('link[rel*="icon"]').forEach((el) => el.remove());
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/png';
  link.href = '/banagifts-tab-icon.png';
  document.head.appendChild(link);
}
forceBrandFavicon();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root was not found');
}

// No-op in dev when VitePWA.devOptions.enabled is false; real SW is built for production.
try {
  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      const onVisible = () => {
        if (document.visibilityState === 'visible') {
          void registration.update();
        }
      };
      document.addEventListener('visibilitychange', onVisible);
    },
  });
} catch {
  // Ignore missing SW during local development.
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
