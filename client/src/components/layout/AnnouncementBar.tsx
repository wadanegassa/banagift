import { usePublicSettings } from '@/hooks/useSettings';

export function AnnouncementBar() {
  const { data: settings } = usePublicSettings();
  const message = settings?.announcement;
  if (!message) return null;

  return (
    <div className="bg-[#FFD100] px-3 py-2 text-center text-[11px] leading-snug tracking-wide text-[#111] xs:px-4 xs:text-xs sm:text-sm">
      <p className="mx-auto max-w-3xl font-medium">{message}</p>
    </div>
  );
}
