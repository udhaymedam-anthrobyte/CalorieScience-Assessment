import React, { useState } from 'react';
import { cn } from '../../lib/utils';

interface AvatarWithFallbackProps {
  src: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AvatarWithFallback: React.FC<AvatarWithFallbackProps> = ({
  src,
  name,
  size = 'md',
  className,
}) => {
  const [failed, setFailed] = useState(false);

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  const sizeClass =
    size === 'sm'
      ? 'h-8 w-8 text-xs'
      : size === 'lg'
      ? 'h-12 w-12 text-sm'
      : 'h-10 w-10 text-xs';

  if (failed || !src) {
    return (
      <div
        aria-label={name}
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full border border-slate-200 bg-teal-50 font-display font-semibold text-teal-800',
          sizeClass,
          className
        )}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={cn(
        'shrink-0 rounded-full border border-slate-200 object-cover bg-slate-100',
        sizeClass,
        className
      )}
    />
  );
};
