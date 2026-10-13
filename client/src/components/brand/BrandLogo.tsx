import { cn } from '@/lib/cn';

export interface BrandLogoProps {
  className?: string;
  /** Show the wordmark next to the mark */
  withWordmark?: boolean;
  wordmark?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'h-9 w-9',
  md: 'h-11 w-11',
  lg: 'h-14 w-14',
} as const;

export function BrandLogo({
  className,
  withWordmark = false,
  wordmark = 'BanaGifts',
  size = 'md',
}: BrandLogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <img
        src="/logo.png"
        alt={wordmark}
        width={56}
        height={56}
        className={cn('shrink-0 rounded-sm object-cover', sizeMap[size])}
      />
      {withWordmark && (
        <span className="truncate font-serif text-xl tracking-wide text-text xs:text-2xl">{wordmark}</span>
      )}
    </span>
  );
}
