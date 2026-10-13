import { NavLink } from 'react-router-dom';
import { ClipboardList, Gift, House, Phone, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useCart } from '@/hooks/useCart';

const items = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/gifts', label: 'Gifts', icon: Gift },
  { to: '/cart', label: 'Cart', icon: ShoppingBag, cart: true },
  { to: '/orders', label: 'Orders', icon: ClipboardList },
  { to: '/contact', label: 'Contact', icon: Phone },
] as const;

export function MobileBottomNav() {
  const { itemCount } = useCart();

  return (
    <nav
      aria-label="Mobile primary"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-bg/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom))' }}
    >
      <ul className="grid grid-cols-5">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={'end' in item ? item.end : false}
              className={({ isActive }) =>
                cn(
                  'relative flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 px-1 pt-1.5 text-[10px] font-medium uppercase tracking-wide text-muted transition-colors',
                  isActive && 'text-accent',
                )
              }
            >
              <span className="relative">
                <item.icon className="h-5 w-5" aria-hidden="true" strokeWidth={1.75} />
                {'cart' in item && item.cart && itemCount > 0 && (
                  <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-accent px-1 text-[9px] font-semibold text-white">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </span>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
