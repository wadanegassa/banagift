import { useEffect, useState, type FormEvent } from 'react';
import { PageMeta } from '@/components/ui/PageMeta';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { useAdminSettings, useUpdateAdminSettings } from '@/hooks/useAdmin';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/types/api';

interface SettingsFormState {
  business_name: string;
  tagline: string;
  contact_phone: string;
  contact_email: string;
  currency: string;
  default_delivery_fee: string;
  free_delivery_threshold: string;
  delivery_areas: string;
  min_lead_time_days: string;
  announcement: string;
  privacy_notice: string;
  policy_text: string;
}

function toFormState(settings: Record<string, unknown>): SettingsFormState {
  const areas = Array.isArray(settings.delivery_areas) ? (settings.delivery_areas as string[]) : [];
  return {
    business_name: String(settings.business_name ?? ''),
    tagline: String(settings.tagline ?? ''),
    contact_phone: String(settings.contact_phone ?? ''),
    contact_email: String(settings.contact_email ?? ''),
    currency: String(settings.currency ?? 'ETB'),
    default_delivery_fee: String(settings.default_delivery_fee ?? 0),
    free_delivery_threshold:
      settings.free_delivery_threshold === null || settings.free_delivery_threshold === undefined
        ? ''
        : String(settings.free_delivery_threshold),
    delivery_areas: areas.join(', '),
    min_lead_time_days: String(settings.min_lead_time_days ?? 0),
    announcement: String(settings.announcement ?? ''),
    privacy_notice: String(settings.privacy_notice ?? ''),
    policy_text: String(settings.policy_text ?? ''),
  };
}

export function Settings() {
  const { data, isLoading, isError, refetch } = useAdminSettings();
  const updateSettings = useUpdateAdminSettings();
  const { show } = useToast();
  const [form, setForm] = useState<SettingsFormState | null>(null);

  useEffect(() => {
    if (data?.data) setForm(toFormState(data.data));
  }, [data]);

  if (isLoading || !form) return <Spinner />;
  if (isError) return <ErrorState message="Couldn't load settings." onRetry={() => refetch()} />;

  function update<K extends keyof SettingsFormState>(key: K, value: string) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    try {
      await updateSettings.mutateAsync({
        business_name: form.business_name,
        tagline: form.tagline,
        contact_phone: form.contact_phone,
        contact_email: form.contact_email,
        currency: form.currency,
        default_delivery_fee: Number(form.default_delivery_fee) || 0,
        free_delivery_threshold: form.free_delivery_threshold === '' ? null : Number(form.free_delivery_threshold),
        delivery_areas: form.delivery_areas
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean),
        min_lead_time_days: Number(form.min_lead_time_days) || 0,
        announcement: form.announcement,
        privacy_notice: form.privacy_notice,
        policy_text: form.policy_text,
      });
      show({ tone: 'success', title: 'Settings saved' });
    } catch (err) {
      show({ tone: 'error', title: 'Could not save settings', description: err instanceof ApiError ? err.message : undefined });
    }
  }

  return (
    <div>
      <PageMeta title="Settings" noIndex />
      <h1 className="font-serif text-3xl text-text">Settings</h1>
      <p className="mt-1 text-sm text-muted">These values power the storefront announcement, policy text, and delivery rules.</p>

      <form onSubmit={handleSubmit} className="mt-6 max-w-2xl space-y-6">
        <section className="border border-border bg-white p-5">
          <h2 className="font-serif text-xl text-text">Business</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="business_name">Business name</Label>
              <Input id="business_name" value={form.business_name} onChange={(e) => update('business_name', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="tagline">Tagline</Label>
              <Input id="tagline" value={form.tagline} onChange={(e) => update('tagline', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="contact_phone">Contact phone</Label>
              <Input id="contact_phone" value={form.contact_phone} onChange={(e) => update('contact_phone', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="contact_email">Contact email</Label>
              <Input id="contact_email" value={form.contact_email} onChange={(e) => update('contact_email', e.target.value)} />
            </div>
          </div>
        </section>

        <section className="border border-border bg-white p-5">
          <h2 className="font-serif text-xl text-text">Delivery &amp; pricing</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="currency">Currency (ISO code)</Label>
              <Input id="currency" value={form.currency} onChange={(e) => update('currency', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="default_delivery_fee">Default delivery fee</Label>
              <Input
                id="default_delivery_fee"
                type="number"
                min={0}
                step="0.01"
                value={form.default_delivery_fee}
                onChange={(e) => update('default_delivery_fee', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="free_delivery_threshold">Free delivery threshold (optional)</Label>
              <Input
                id="free_delivery_threshold"
                type="number"
                min={0}
                step="0.01"
                value={form.free_delivery_threshold}
                onChange={(e) => update('free_delivery_threshold', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="min_lead_time_days">Minimum lead time (days)</Label>
              <Input
                id="min_lead_time_days"
                type="number"
                min={0}
                value={form.min_lead_time_days}
                onChange={(e) => update('min_lead_time_days', e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="delivery_areas">Location suggestions (comma separated)</Label>
              <Input
                id="delivery_areas"
                value={form.delivery_areas}
                onChange={(e) => update('delivery_areas', e.target.value)}
                placeholder="Addis Ababa, Bole, Adama…"
              />
              <p className="mt-1 text-xs text-muted">
                Shown as checkout hints. Customers can type any city or area in Ethiopia.
              </p>
            </div>
          </div>
        </section>

        <section className="border border-border bg-white p-5">
          <h2 className="font-serif text-xl text-text">Storefront copy</h2>
          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="announcement">Announcement bar</Label>
              <Input id="announcement" value={form.announcement} onChange={(e) => update('announcement', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="policy_text">Policy text (shown at checkout)</Label>
              <Textarea id="policy_text" rows={3} value={form.policy_text} onChange={(e) => update('policy_text', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="privacy_notice">Privacy notice</Label>
              <Textarea id="privacy_notice" rows={3} value={form.privacy_notice} onChange={(e) => update('privacy_notice', e.target.value)} />
            </div>
          </div>
        </section>

        <Button type="submit" isLoading={updateSettings.isPending}>
          Save settings
        </Button>
      </form>
    </div>
  );
}
