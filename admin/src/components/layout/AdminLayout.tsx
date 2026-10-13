import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FolderTree,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { cn } from '@/lib/cn';
import { useAuth } from '@/hooks/useAuth';

const STOREFRONT_URL = (import.meta.env.VITE_STOREFRONT_URL as string | undefined) || 'http://localhost:5173';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/categories', label: 'Categories', icon: FolderTree },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export function AdminLayout() {
  const { logout, email } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen bg-bg text-text">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-64 transform border-r border-border bg-white transition-transform lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-5">
          <BrandLogo withWordmark wordmark="BanaGifts" size="sm" />
          <button
            type="button"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-col gap-1 px-3 py-4" aria-label="Admin">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded px-3 py-2.5 text-sm font-medium text-muted hover:bg-surface hover:text-text',
                  isActive && 'bg-accent/10 text-accent',
                )
              }
            >
              <link.icon className="h-4 w-4" aria-hidden="true" />
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 w-64 border-t border-border p-4">
          <a
            href={STOREFRONT_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-1 py-1.5 text-xs text-muted hover:text-accent"
          >
            <ExternalLink className="h-3.5 w-3.5" /> View storefront
          </a>
          {email && <p className="truncate px-1 pb-2 pt-1 text-xs text-muted">{email}</p>}
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded px-1 py-1.5 text-sm font-medium text-text hover:text-accent"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-text/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-white px-4 py-3 lg:hidden">
          <button type="button" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
            <Menu className="h-5 w-5" />
          </button>
          <BrandLogo withWordmark wordmark="BanaGifts" size="sm" />
          <span className="w-5" />
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
