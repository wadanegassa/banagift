import { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ShieldCheck } from 'lucide-react';
import { PageMeta } from '@/components/ui/PageMeta';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { EmptyState } from '@/components/ui/EmptyState';
import { CartSummary } from '@/components/cart/CartSummary';
import { useCart } from '@/hooks/useCart';
import { usePublicSettings } from '@/hooks/useSettings';
import { useCreateOrder } from '@/hooks/useOrders';
import { useToast } from '@/components/ui/Toast';
import { checkoutSchema, toCreateOrderPayload, type CheckoutFormValues } from '@/lib/checkoutSchema';
import { saveLastOrder, saveMyOrdersPhone } from '@/lib/session';
import { ApiError } from '@/types/api';

/** Local calendar YYYY-MM-DD — avoids UTC day-shift rejecting valid Ethiopia delivery dates. */
function minDeliveryDate(leadDays: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + leadDays);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { data: settings } = usePublicSettings();
  const { show } = useToast();
  const navigate = useNavigate();
  const createOrder = useCreateOrder();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const leadDays = Number(settings?.min_lead_time_days ?? 0);
  const minDate = useMemo(() => minDeliveryDate(leadDays), [leadDays]);
  const currency = settings?.currency ?? 'ETB';
  const locationSuggestions = settings?.delivery_areas ?? [];
  const businessPhone = settings?.contact_phone;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customer_name: '',
      customer_phone: '',
      recipient_name: '',
      recipient_phone: '',
      city: '',
      delivery_address: '',
      delivery_date: minDate,
      delivery_time_window: '',
      delivery_instructions: '',
      gift_message: '',
      special_request: '',
    },
  });

  if (items.length === 0) {
    return (
      <div className="container-prose px-4 py-16 sm:px-6">
        <PageMeta title="Checkout" />
        <EmptyState
          title="Your cart is empty"
          description="Add a gift before checking out."
          action={
            <Link to="/gifts">
              <Button>Browse gifts</Button>
            </Link>
          }
        />
      </div>
    );
  }

  async function onSubmit(values: CheckoutFormValues) {
    setSubmitError(null);
    const payload = toCreateOrderPayload(
      values,
      items.map((item) => ({ product_id: item.productId, quantity: item.quantity })),
    );
    const idempotencyKey = crypto.randomUUID();

    try {
      const res = await createOrder.mutateAsync({ input: payload, idempotencyKey });
      saveLastOrder({
        order_reference: res.data.order_reference,
        tracking_token: res.data.tracking_token,
        total: res.data.total,
        currency: res.data.currency,
        delivery_date: res.data.delivery_date,
      });
      saveMyOrdersPhone(values.customer_phone);
      clearCart();
      show({ tone: 'success', title: 'Order received', description: `Reference ${res.data.order_reference}` });
      navigate('/order/confirmation', {
        state: {
          order_reference: res.data.order_reference,
          tracking_token: res.data.tracking_token,
          total: res.data.total,
          currency: res.data.currency,
          delivery_date: res.data.delivery_date,
        },
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else {
        setSubmitError('Something went wrong submitting your order. Please try again.');
      }
    }
  }

  const brand = settings?.business_name || 'BanaGifts';

  return (
    <div className="container-prose px-3 py-8 xs:px-4 sm:px-6 sm:py-12">
      <PageMeta title="Checkout" />
      <div className="flex items-center gap-3">
        <img src="/logo.png" alt="" className="h-11 w-11 rounded-sm object-cover sm:h-12 sm:w-12" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{brand}</p>
          <h1 className="font-serif text-3xl text-text sm:text-4xl">Request your gift</h1>
        </div>
      </div>
      <p className="mt-3 max-w-xl text-sm text-muted">
        {settings?.policy_text ||
          'Submit your order, then call us to confirm delivery, price in ETB, and payment. Nothing is charged online.'}
      </p>
      {businessPhone && (
        <a
          href={`tel:${businessPhone}`}
          className="mt-4 inline-flex min-h-11 items-center gap-2 border border-accent bg-accent px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-white"
        >
          Call to confirm · {businessPhone}
        </a>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-8 sm:mt-8 sm:gap-10 lg:grid-cols-[1fr_320px]" noValidate>
        <div className="space-y-6 sm:space-y-8">
          <fieldset className="border border-border bg-white p-4 xs:p-5">
            <legend className="px-1 font-serif text-lg text-text sm:text-xl">Your details</legend>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="customer_name" required>
                  Your name
                </Label>
                <Input id="customer_name" {...register('customer_name')} error={errors.customer_name?.message} />
                {errors.customer_name && <p className="mt-1 text-xs text-danger">{errors.customer_name.message}</p>}
              </div>
              <div>
                <Label htmlFor="customer_phone" required>
                  Your phone number
                </Label>
                <Input
                  id="customer_phone"
                  type="tel"
                  placeholder="09xxxxxxxx or +2519xxxxxxxx"
                  {...register('customer_phone')}
                  error={errors.customer_phone?.message}
                />
                {errors.customer_phone && <p className="mt-1 text-xs text-danger">{errors.customer_phone.message}</p>}
                <p className="mt-1 text-xs text-muted">We use this number to confirm your order by phone.</p>
              </div>
            </div>
          </fieldset>

          <fieldset className="border border-border bg-white p-4 xs:p-5">
            <legend className="px-1 font-serif text-lg text-text sm:text-xl">Recipient &amp; delivery</legend>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="recipient_name" required>
                  Recipient's name
                </Label>
                <Input id="recipient_name" {...register('recipient_name')} error={errors.recipient_name?.message} />
                {errors.recipient_name && <p className="mt-1 text-xs text-danger">{errors.recipient_name.message}</p>}
              </div>
              <div>
                <Label htmlFor="recipient_phone">Recipient's phone (optional)</Label>
                <Input id="recipient_phone" type="tel" {...register('recipient_phone')} />
              </div>
              <div>
                <Label htmlFor="city" required>
                  City / town / area
                </Label>
                <Input
                  id="city"
                  list="ethiopia-locations"
                  placeholder="Any location in Ethiopia (e.g. Addis Ababa, Bole)"
                  {...register('city')}
                  error={errors.city?.message}
                />
                <datalist id="ethiopia-locations">
                  {locationSuggestions.map((area) => (
                    <option key={area} value={area} />
                  ))}
                </datalist>
                {errors.city && <p className="mt-1 text-xs text-danger">{errors.city.message}</p>}
                <p className="mt-1 text-xs text-muted">Type any city or area — we confirm delivery by phone.</p>
              </div>
              <div>
                <Label htmlFor="delivery_date" required>
                  Delivery date
                </Label>
                <Input id="delivery_date" type="date" min={minDate} {...register('delivery_date')} error={errors.delivery_date?.message} />
                {errors.delivery_date && <p className="mt-1 text-xs text-danger">{errors.delivery_date.message}</p>}
                {leadDays > 0 && (
                  <p className="mt-1 text-xs text-muted">At least {leadDays} day{leadDays === 1 ? '' : 's'} notice is needed.</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="delivery_address" required>
                  Delivery address
                </Label>
                <Textarea
                  id="delivery_address"
                  rows={2}
                  placeholder="Subcity, landmark, building, or full directions"
                  {...register('delivery_address')}
                  error={errors.delivery_address?.message}
                />
                {errors.delivery_address && <p className="mt-1 text-xs text-danger">{errors.delivery_address.message}</p>}
              </div>
              <div>
                <Label htmlFor="delivery_time_window">Preferred time (optional)</Label>
                <Input id="delivery_time_window" placeholder="e.g. Morning, after 2pm" {...register('delivery_time_window')} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="delivery_instructions">Delivery instructions (optional)</Label>
                <Textarea id="delivery_instructions" rows={2} {...register('delivery_instructions')} />
              </div>
            </div>
          </fieldset>

          <fieldset className="border border-border bg-white p-4 xs:p-5">
            <legend className="px-1 font-serif text-lg text-text sm:text-xl">A personal touch</legend>
            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="gift_message">Gift message (optional)</Label>
                <Textarea id="gift_message" rows={3} {...register('gift_message')} />
              </div>
              <div>
                <Label htmlFor="special_request">Special request (optional)</Label>
                <Textarea id="special_request" rows={2} {...register('special_request')} />
              </div>
            </div>
          </fieldset>

          <fieldset className="border border-border bg-white p-4 xs:p-5">
            <legend className="px-1 font-serif text-lg text-text sm:text-xl">Review</legend>
            <ul className="mt-4 divide-y divide-border text-sm">
              {items.map((item) => (
                <li key={item.productId} className="flex justify-between py-2">
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>{(item.price * item.quantity).toLocaleString('en-ET')} {currency}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex items-start gap-3 rounded border border-border bg-surface/60 p-4">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sage" aria-hidden="true" />
              <p className="text-xs text-muted">
                {settings?.privacy_notice ||
                  'We use your contact details only to confirm and fulfill your order. We do not sell personal information.'}
              </p>
            </div>

            <label className="mt-4 flex items-start gap-2 text-sm text-text">
              <input type="checkbox" className="mt-0.5 h-4 w-4" {...register('consent')} />
              <span>
                I agree to be contacted by phone to confirm this order, availability, and payment.
              </span>
            </label>
            {errors.consent && <p className="mt-1 text-xs text-danger">{errors.consent.message}</p>}
          </fieldset>

          {submitError && (
            <div className="rounded border border-danger/40 bg-danger/5 p-4 text-sm text-danger">{submitError}</div>
          )}
        </div>

        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <CartSummary
            subtotal={subtotal}
            currency={currency}
            note="Price shown in ETB. Final delivery fee is confirmed when you call us."
          />
          <div className="mobile-sticky-actions space-y-2">
            <Button type="submit" fullWidth size="lg" isLoading={isSubmitting || createOrder.isPending} className="min-h-11">
              Submit order request
            </Button>
            <p className="text-center text-xs text-muted">
              After submitting, call us to confirm. No online payment.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
