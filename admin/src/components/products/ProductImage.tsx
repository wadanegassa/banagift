import { useState } from 'react';
import { Gift } from 'lucide-react';
import { getInitials } from '@/lib/format';
import { cn } from '@/lib/cn';

export interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  iconOnly?: boolean;
}

/**
 * Renders a product/category photo, gracefully falling back to a styled
 * CSS-gradient placeholder with initials when the URL is missing or fails
 * to load (e.g. seeded mock storage paths that have no real binary).
 */
export function ProductImage({ src, alt, className, iconOnly }: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const showPlaceholder = !src || failed;

  if (showPlaceholder) {
    return (
      <div
        className={cn('placeholder-art flex items-center justify-center', className)}
        role="img"
        aria-label={alt}
      >
        {iconOnly ? (
          <Gift className="h-8 w-8 text-accent/50" aria-hidden="true" />
        ) : (
          <span className="font-serif text-3xl text-accent/60">{getInitials(alt)}</span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn('object-cover', className)}
    />
  );
}
