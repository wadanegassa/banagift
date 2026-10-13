import { config } from '../config.js';
import { mockSettings } from '../lib/mockDb.js';
import { getSupabaseAdmin } from '../lib/supabase.js';
import type { BusinessSettingsMap } from '../types/models.js';

/** Keys that may be exposed to the public (never secrets / internal ops data). */
const PUBLIC_SETTING_KEYS = [
  'business_name',
  'tagline',
  'contact_phone',
  'contact_email',
  'currency',
  'default_delivery_fee',
  'free_delivery_threshold',
  'delivery_areas',
  'min_lead_time_days',
  'announcement',
  'privacy_notice',
  'policy_text',
] as const;

/** Keys an admin is allowed to write via PATCH /api/admin/settings. */
export const WRITABLE_SETTING_KEYS = PUBLIC_SETTING_KEYS;

export async function getAllSettings(): Promise<BusinessSettingsMap> {
  if (config.useMockDb) {
    return mockSettings.getAll();
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('business_settings').select('key, value');
  if (error) throw error;
  const map: BusinessSettingsMap = {};
  for (const row of data ?? []) map[row.key] = row.value;
  return map;
}

export async function getPublicSettings(): Promise<BusinessSettingsMap> {
  const all = await getAllSettings();
  const publicSettings: BusinessSettingsMap = {};
  for (const key of PUBLIC_SETTING_KEYS) {
    if (key in all) publicSettings[key] = all[key];
  }
  return publicSettings;
}

export async function updateSettings(
  patch: Record<string, unknown>,
  actorId: string | null,
): Promise<BusinessSettingsMap> {
  const entries = Object.entries(patch).filter(([key]) =>
    (WRITABLE_SETTING_KEYS as readonly string[]).includes(key),
  );

  if (config.useMockDb) {
    for (const [key, value] of entries) mockSettings.set(key, value);
    return getAllSettings();
  }

  const supabase = getSupabaseAdmin();
  for (const [key, value] of entries) {
    // JSONB value column is NOT NULL — omit optional null thresholds by deleting the row.
    if (value === null || value === undefined) {
      const { error } = await supabase.from('business_settings').delete().eq('key', key);
      if (error) throw error;
      continue;
    }
    const { error } = await supabase
      .from('business_settings')
      .upsert({ key, value, updated_by: actorId, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) throw error;
  }
  return getAllSettings();
}
