import { cn } from '@/lib/cn';

export interface BrandLogoProps {
  className?: string;
  withWordmark?: boolean;
  wordmark?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
  lg: 'h-12 w-12',
} as const;

export function BrandLogo({
  className,
  withWordmark = false,
  wordmark = 'BanaGifts',
  size = 'md',
}: BrandLogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <img
        src="/logo.png"
        alt={wordmark}
        width={48}
        height={48}
        className={cn('shrink-0 rounded-sm object-cover', sizeMap[size])}
      />
      {withWordmark && <span className="truncate font-serif text-xl text-text">{wordmark}</span>}
    </span>
  );
}
