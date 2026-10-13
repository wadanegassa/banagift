import { Outlet } from 'react-router-dom';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';

export function StorefrontLayout() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-bg text-text">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-accent focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <AnnouncementBar />
      <Navbar />
      <main id="main-content" className="flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <MobileBottomNav />
      <InstallPrompt />
    </div>
  );
}
