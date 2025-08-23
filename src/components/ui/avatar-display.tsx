import React from 'react';
import { User } from 'lucide-react';
import { getAvatarUrl, getAvatarClasses, AvatarUrls } from '@/utils/avatar.utils';

interface AvatarDisplayProps {
  avatarUrls: AvatarUrls;
  size?: 'small' | 'medium' | 'large';
  alt?: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
}

export function AvatarDisplay({ 
  avatarUrls, 
  size = 'medium', 
  alt = 'User avatar',
  className = '',
  fallbackIcon = <User className="h-full w-full" />
}: AvatarDisplayProps) {
  const avatarUrl = getAvatarUrl(avatarUrls, size);
  const avatarClasses = getAvatarClasses(size);
  const isPlaceholder = avatarUrl === '/api/placeholder/96/96';

  if (isPlaceholder || !avatarUrl) {
    return (
      <div className={`${avatarClasses} ${className} bg-primary/10 flex items-center justify-center text-primary`}>
        {fallbackIcon}
      </div>
    );
  }

  return (
    <img
      src={avatarUrl}
      alt={alt}
      className={`${avatarClasses} ${className}`}
      loading="lazy"
    />
  );
}

// Convenience components for common sizes
export function SmallAvatar(props: Omit<AvatarDisplayProps, 'size'>) {
  return <AvatarDisplay {...props} size="small" />;
}

export function MediumAvatar(props: Omit<AvatarDisplayProps, 'size'>) {
  return <AvatarDisplay {...props} size="medium" />;
}

export function LargeAvatar(props: Omit<AvatarDisplayProps, 'size'>) {
  return <AvatarDisplay {...props} size="large" />;
}
