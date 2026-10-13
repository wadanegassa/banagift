import { useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Menu, X, Phone, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/cn';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { useCart } from '@/hooks/useCart';
import { usePublicSettings } from '@/hooks/useSettings';

const links = [
  { to: '/gifts', label: 'Gifts' },
  { to: '/orders', label: 'My orders' },
  { to: '/track', label: 'Track' },
  { to: '/contact', label: 'Contact' },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { itemCount } = useCart();
  const { data: settings } = usePublicSettings();
  const brand = settings?.business_name || 'BanaGifts';
  const phone = settings?.contact_phone;
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/95 backdrop-blur-md">
      <div className="container-prose flex items-center justify-between gap-3 px-3 py-3 xs:px-4 sm:px-6 sm:py-4">
        <Link to="/" className="min-w-0" onClick={() => setMenuOpen(false)} aria-label={brand}>
          <BrandLogo withWordmark wordmark={brand} size="md" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'text-sm font-medium uppercase tracking-wide text-muted transition-colors hover:text-accent',
                  isActive && 'text-accent',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1">
          {phone && (
            <a
              href={`tel:${phone}`}
              aria-label={`Call ${phone}`}
              className="hidden h-11 items-center gap-2 px-2 text-sm font-medium text-accent hover:underline sm:flex"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              <span className="hidden lg:inline">{phone}</span>
            </a>
          )}
          <Link
            to="/cart"
            aria-label={`Cart, ${itemCount} item${itemCount === 1 ? '' : 's'}`}
            className="relative flex h-11 w-11 items-center justify-center rounded text-text hover:bg-surface"
          >
            <ShoppingBag className="h-5 w-5" aria-hidden="true" />
            {itemCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded text-text hover:bg-surface md:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          className="fixed inset-x-0 bottom-0 top-[calc(3.25rem+env(safe-area-inset-top,0px))] z-50 overflow-y-auto border-t border-border bg-bg md:hidden"
          aria-label="Mobile"
        >
          <div className="flex min-h-full flex-col px-4 py-4">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'border-b border-border py-4 text-base font-medium uppercase tracking-wide text-muted',
                    isActive && 'text-accent',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
            <Link
              to="/cart"
              onClick={() => setMenuOpen(false)}
              className="border-b border-border py-4 text-base font-medium uppercase tracking-wide text-muted"
            >
              Cart{itemCount > 0 ? ` (${itemCount})` : ''}
            </Link>
            {phone && (
              <a
                href={`tel:${phone}`}
                className="mt-6 flex min-h-12 items-center justify-center gap-2 border border-accent bg-accent px-4 text-base font-medium text-white"
              >
                <Phone className="h-4 w-4" aria-hidden="true" /> Call {phone}
              </a>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
