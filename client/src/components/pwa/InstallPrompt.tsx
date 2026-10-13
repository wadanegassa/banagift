import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'banagifts-pwa-install-dismissed';

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (localStorage.getItem(DISMISS_KEY) === '1') return;

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  if (!visible || !deferred) return null;

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setVisible(false);
    setDeferred(null);
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  }

  return (
    <div
      className="fixed inset-x-3 z-[60] rounded border border-border bg-white p-3 shadow-lg md:inset-x-auto md:bottom-6 md:right-6 md:w-80"
      style={{ bottom: 'calc(4.25rem + env(safe-area-inset-bottom, 0px))' }}
      role="dialog"
      aria-label="Install BanaGifts app"
    >
      <div className="flex items-start gap-3">
        <img src="/logo.png" alt="" className="mt-0.5 h-9 w-9 shrink-0 rounded-sm object-cover" />
        <div className="min-w-0 flex-1">
          <p className="font-serif text-lg leading-tight text-text">Install BanaGifts</p>
          <p className="mt-1 text-xs text-muted">
            Add to your home screen for a faster, full-screen shopping experience.
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={install}>
              Install
            </Button>
            <Button size="sm" variant="ghost" onClick={dismiss}>
              Not now
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="rounded p-1 text-muted hover:bg-surface hover:text-text"
          aria-label="Dismiss install prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
