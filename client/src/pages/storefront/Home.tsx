import { Link } from 'react-router-dom';
import { ArrowRight, Phone, Search, PhoneCall, Truck, Gift as GiftIcon } from 'lucide-react';
import { PageMeta } from '@/components/ui/PageMeta';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductCardSkeleton } from '@/components/products/ProductCardSkeleton';
import { ProductImage } from '@/components/products/ProductImage';
import { ErrorState } from '@/components/ui/ErrorState';
import { usePublicSettings } from '@/hooks/useSettings';
import { useCategories } from '@/hooks/useCategories';
import { useProducts } from '@/hooks/useProducts';

const steps = [
  { icon: Search, title: '1. Browse', body: 'Pick a gift from our collection.' },
  { icon: GiftIcon, title: '2. Request', body: 'Send delivery details for anywhere in Ethiopia — no payment online.' },
  { icon: PhoneCall, title: '3. Call us', body: 'Phone the shop to confirm the gift, price in ETB, and payment.' },
  { icon: Truck, title: '4. We deliver', body: 'After confirmation, we arrange delivery to your location.' },
];

export function Home() {
  const { data: settings } = usePublicSettings();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const {
    data: featured,
    isLoading: featuredLoading,
    isError: featuredError,
    refetch: refetchFeatured,
  } = useProducts({ featured: true, limit: 8 });

  const currency = settings?.currency ?? 'ETB';
  const phone = settings?.contact_phone;
  const visibleCategories = (categories?.data ?? []).filter((c) => c.is_active).slice(0, 6);

  return (
    <>
      <PageMeta
        title={`${settings?.business_name || 'BanaGifts'} — Gifts in Ethiopia`}
        description="Order thoughtful gifts in Ethiopia. Confirm by phone. Delivered to your city."
      />

      {/* Hero — full-bleed editorial composition */}
      <section className="relative min-h-[min(78vh,760px)] overflow-hidden border-b border-border bg-surface">
        <div className="absolute inset-0 placeholder-art opacity-40" aria-hidden="true" />
        <div
          className="pointer-events-none absolute inset-x-3 bottom-3 top-auto aspect-[5/3] overflow-hidden border border-border md:inset-y-0 md:left-auto md:right-0 md:top-0 md:aspect-auto md:w-[52%] md:border-0"
          aria-hidden="true"
        >
          <img
            src="https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1400&q=80"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)]/70 via-transparent to-transparent md:bg-gradient-to-l md:from-transparent md:via-transparent md:to-[var(--bg)]" />
          <div className="absolute inset-[10%] hidden border border-accent/15 md:block" />
          <div className="absolute bottom-4 left-4 right-4 border border-border bg-[var(--white)] p-3 sm:p-5 md:bottom-[14%] md:left-[14%] md:right-[14%]">
            <p className="font-serif text-lg text-text sm:text-2xl">Garden Rose Bouquet</p>
            <p className="mt-1 text-xs text-muted sm:text-sm">Hand-tied, finished with linen ribbon.</p>
          </div>
        </div>
        <div className="relative container-prose flex min-h-[min(78vh,760px)] flex-col justify-start px-3 pb-[42%] pt-10 xs:px-4 sm:px-6 sm:pt-16 md:max-w-[48%] md:justify-center md:pb-16">
          <div className="flex items-center gap-3 sm:gap-4">
            <img
              src="/logo.png"
              alt=""
              width={88}
              height={88}
              className="h-16 w-16 shrink-0 rounded-sm object-cover shadow-sm xs:h-20 xs:w-20 sm:h-24 sm:w-24"
            />
            <p className="font-serif text-4xl leading-none tracking-tight text-accent xs:text-5xl sm:text-6xl md:text-7xl">
              {settings?.business_name || 'BanaGifts'}
            </p>
          </div>
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-sage xs:text-xs xs:tracking-[0.22em]">
            {settings?.tagline || 'Gifts for Ethiopia — confirmed by phone'}
          </p>
          <h1 className="mt-5 max-w-md font-serif text-2xl leading-snug text-text xs:text-3xl sm:mt-6 sm:text-4xl">
            Simple gifts. Clear prices in Birr. Confirmed by phone.
          </h1>
          <p className="mt-3 max-w-md text-sm text-muted sm:mt-4 sm:text-base">
            Choose a gift, tell us where to deliver — any city or area — then call us to confirm. Payment is arranged
            by phone, not online.
          </p>
          <div className="mt-6 flex w-full flex-col gap-2.5 xs:flex-row xs:flex-wrap sm:mt-8 sm:gap-3">
            <Link
              to="/gifts"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-accent bg-accent px-6 py-3 text-xs font-medium uppercase tracking-wide text-white transition-colors hover:bg-accent/90"
            >
              Explore Gifts <ArrowRight className="h-4 w-4" />
            </Link>
            {phone ? (
              <a
                href={`tel:${phone}`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-text/35 bg-[var(--bg)]/80 px-6 py-3 text-xs font-medium uppercase tracking-wide text-text transition-colors hover:border-accent hover:text-accent"
              >
                <Phone className="h-4 w-4" /> Call us
              </a>
            ) : (
              <Link
                to="/contact"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-text/35 bg-[var(--bg)]/80 px-6 py-3 text-xs font-medium uppercase tracking-wide text-text transition-colors hover:border-accent hover:text-accent"
              >
                Contact
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Featured categories */}
      <section className="container-prose px-3 py-10 xs:px-4 sm:px-6 sm:py-16">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-serif text-2xl text-text sm:text-3xl">Shop by category</h2>
          <Link to="/gifts" className="shrink-0 text-sm font-medium text-accent hover:underline">
            View all
          </Link>
        </div>
        <div className="-mx-3 mt-6 flex gap-3 overflow-x-auto px-3 pb-2 snap-x snap-mandatory sm:mx-0 sm:mt-8 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 md:grid-cols-6">
          {categoriesLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton-shimmer aspect-square w-[42vw] shrink-0 rounded sm:w-auto" />
            ))}
          {!categoriesLoading &&
            visibleCategories.map((category) => (
              <Link
                key={category.id}
                to={`/gifts?category=${category.slug}`}
                className="group flex w-[42vw] shrink-0 snap-start flex-col items-center gap-2 text-center sm:w-auto sm:gap-3"
              >
                <div className="aspect-square w-full overflow-hidden rounded border border-border">
                  <ProductImage
                    src={category.image_url}
                    alt={category.name}
                    className="h-full w-full"
                    iconOnly={!category.image_url}
                  />
                </div>
                <span className="line-clamp-2 text-xs font-medium text-text group-hover:text-accent sm:text-sm">
                  {category.name}
                </span>
              </Link>
            ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="border-t border-border bg-surface/60">
        <div className="container-prose px-3 py-10 xs:px-4 sm:px-6 sm:py-16">
          <div className="flex items-end justify-between gap-3">
            <h2 className="font-serif text-2xl text-text sm:text-3xl">Featured this season</h2>
            <Link to="/gifts" className="shrink-0 text-sm font-medium text-accent hover:underline">
              View all
            </Link>
          </div>

          {featuredError ? (
            <div className="mt-8">
              <ErrorState message="We couldn't load featured gifts." onRetry={() => refetchFeatured()} />
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-3 xs:gap-4 sm:mt-8 sm:gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {featuredLoading && Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
              {!featuredLoading &&
                (featured?.data ?? []).map((product) => (
                  <ProductCard key={product.id} product={product} currency={currency} />
                ))}
            </div>
          )}

          {!featuredLoading && !featuredError && (featured?.data ?? []).length === 0 && (
            <p className="mt-8 text-sm text-muted">Featured gifts will appear here soon.</p>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="container-prose px-3 py-10 xs:px-4 sm:px-6 sm:py-16">
        <h2 className="font-serif text-2xl text-text sm:text-3xl">How it works</h2>
        <div className="mt-8 grid gap-6 sm:mt-10 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step.title} className="relative border-l border-border pl-4 sm:pl-5">
              <span className="font-serif text-2xl text-accent/40 sm:text-3xl">0{index + 1}</span>
              <div className="mt-2 flex items-center gap-2">
                <step.icon className="h-4 w-4 text-sage" aria-hidden="true" />
                <h3 className="font-medium text-text">{step.title}</h3>
              </div>
              <p className="mt-2 text-sm text-muted">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Experience section */}
      <section className="border-t border-border bg-surface/60">
        <div className="container-prose grid gap-8 px-3 py-10 xs:px-4 sm:gap-10 sm:px-6 sm:py-16 md:grid-cols-2 md:items-center">
          <div className="order-2 aspect-[4/3] overflow-hidden border border-border md:order-1">
            <img
              src="https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=1200&q=80"
              alt="Curated gift box tied with ribbon"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="order-1 md:order-2">
            <h2 className="font-serif text-2xl text-text sm:text-3xl">Kept simple — mostly by phone.</h2>
            <p className="mt-4 text-sm text-muted sm:text-base">
              This shop is built for Ethiopia: browse online, then talk to a real person. We confirm the gift, the
              delivery place, and payment in Ethiopian Birr over the phone.
            </p>
            <p className="mt-4 text-sm text-muted sm:text-base">
              Deliver to Addis Ababa, regional cities, or any area you write on the order form. If we can arrange it,
              we will tell you when you call.
            </p>
          </div>
        </div>
      </section>

      {/* Contact strip */}
      <section className="container-prose px-3 py-10 xs:px-4 sm:px-6 sm:py-14">
        <div className="flex flex-col items-stretch justify-between gap-5 border border-border bg-white px-4 py-8 text-center xs:px-6 sm:flex-row sm:items-center sm:py-10 sm:text-left">
          <div>
            <h2 className="font-serif text-xl text-text sm:text-2xl">Prefer to talk first?</h2>
            <p className="mt-2 text-sm text-muted">Call the shop — we help you choose and confirm delivery.</p>
          </div>
          {phone && (
            <a
              href={`tel:${phone}`}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded border border-accent bg-accent px-6 py-3 text-xs font-medium uppercase tracking-wide text-white transition-colors hover:bg-accent/90"
            >
              <Phone className="h-4 w-4" /> {phone}
            </a>
          )}
        </div>
      </section>
    </>
  );
}
