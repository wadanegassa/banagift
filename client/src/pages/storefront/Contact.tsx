import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { PageMeta } from '@/components/ui/PageMeta';
import { usePublicSettings } from '@/hooks/useSettings';
import { Skeleton } from '@/components/ui/Skeleton';

export function Contact() {
  const { data: settings, isLoading } = usePublicSettings();
  const phone = settings?.contact_phone;

  const brand = settings?.business_name || 'BanaGifts';

  return (
    <div className="container-prose px-3 py-8 xs:px-4 sm:px-6 sm:py-12">
      <PageMeta title="Contact" description={`Call ${brand} to confirm gifts and delivery in Ethiopia.`} />
      <div className="flex items-center gap-3">
        <img src="/logo.png" alt="" className="h-12 w-12 rounded-sm object-cover sm:h-14 sm:w-14" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{brand}</p>
          <h1 className="font-serif text-3xl text-text sm:text-4xl">Call us</h1>
        </div>
      </div>
      <p className="mt-3 max-w-md text-sm text-muted">
        Most questions are fastest by phone — gift choice, delivery location, price in Birr, and payment.
      </p>

      {phone && (
        <a
          href={`tel:${phone}`}
          className="mt-8 flex min-h-14 items-center justify-center gap-3 border border-accent bg-accent px-6 py-4 text-base font-medium text-white sm:max-w-md"
        >
          <Phone className="h-5 w-5" /> {phone}
        </a>
      )}

      <div className="mt-8 grid gap-4 sm:mt-10 sm:gap-6 sm:grid-cols-2">
        {isLoading ? (
          <>
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </>
        ) : (
          <>
            {settings?.contact_email && (
              <a
                href={`mailto:${settings.contact_email}`}
                className="flex min-h-[5.5rem] items-start gap-4 border border-border bg-white p-4 transition-colors hover:border-accent xs:p-6"
              >
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="font-medium text-text">Email</p>
                  <p className="mt-1 break-all text-sm text-muted">{settings.contact_email}</p>
                </div>
              </a>
            )}
            <div className="flex items-start gap-4 border border-border bg-white p-4 xs:p-6">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
              <div className="min-w-0">
                <p className="font-medium text-text">Delivery</p>
                <p className="mt-1 text-sm text-muted">
                  Any city or area in Ethiopia you write on the order form. We confirm by phone whether delivery is
                  possible and the fee in ETB.
                </p>
              </div>
            </div>
            {settings?.min_lead_time_days !== undefined && (
              <div className="flex items-start gap-4 border border-border bg-white p-4 xs:p-6">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="font-medium text-text">Lead time</p>
                  <p className="mt-1 text-sm text-muted">
                    Please allow at least {settings.min_lead_time_days} day
                    {Number(settings.min_lead_time_days) === 1 ? '' : 's'} before your delivery date.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {settings?.privacy_notice && (
        <p className="mt-10 max-w-2xl border-t border-border pt-6 text-xs text-muted">{settings.privacy_notice}</p>
      )}
    </div>
  );
}
