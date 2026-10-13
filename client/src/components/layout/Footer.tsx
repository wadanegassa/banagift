import { Link } from 'react-router-dom';
import { Phone, Mail } from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { usePublicSettings } from '@/hooks/useSettings';

export function Footer() {
  const { data: settings } = usePublicSettings();
  const brand = settings?.business_name || 'BanaGifts';
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface">
      <div className="container-prose grid gap-8 px-3 py-10 xs:px-4 sm:gap-10 sm:px-6 sm:py-14 md:grid-cols-3">
        <div>
          <BrandLogo withWordmark wordmark={brand} size="md" />
          <p className="mt-3 max-w-xs text-sm text-muted">
            {settings?.tagline || 'Gifts across Ethiopia — confirmed by phone.'}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Explore</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link to="/gifts" className="text-text hover:text-accent">
                Gifts
              </Link>
            </li>
            <li>
              <Link to="/orders" className="text-text hover:text-accent">
                My orders
              </Link>
            </li>
            <li>
              <Link to="/track" className="text-text hover:text-accent">
                Track an order
              </Link>
            </li>
            <li>
              <Link to="/contact" className="text-text hover:text-accent">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Get in touch</p>
          <ul className="mt-3 space-y-2 text-sm">
            {settings?.contact_phone && (
              <li>
                <a href={`tel:${settings.contact_phone}`} className="flex items-center gap-2 text-text hover:text-accent">
                  <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                  {settings.contact_phone}
                </a>
              </li>
            )}
            {settings?.contact_email && (
              <li>
                <a
                  href={`mailto:${settings.contact_email}`}
                  className="flex items-center gap-2 text-text hover:text-accent"
                >
                  <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                  {settings.contact_email}
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-border px-4 py-5 text-center text-xs text-muted sm:px-6">
        &copy; {year} {brand}. All rights reserved.
      </div>
    </footer>
  );
}
