/**
 * Avatar utility functions for handling profile image display
 */

export interface AvatarUrls {
  full?: string | null;
  thumbnail?: string | null;
}

/**
 * Get the appropriate avatar URL based on the context and size needed
 * @param avatarUrls - Object containing full and thumbnail avatar URLs
 * @param size - Size context: 'small' (comments/chat), 'medium' (profile), 'large' (full profile)
 * @returns The appropriate avatar URL or fallback
 */
export function getAvatarUrl(avatarUrls: AvatarUrls, size: 'small' | 'medium' | 'large' = 'medium'): string {
  // For small contexts (comments, chat), prefer thumbnail
  if (size === 'small' && avatarUrls.thumbnail) {
    return avatarUrls.thumbnail;
  }
  
  // For medium contexts (profile display), prefer full size
  if (size === 'medium' && avatarUrls.full) {
    return avatarUrls.full;
  }
  
  // For large contexts (full profile), use full size
  if (size === 'large' && avatarUrls.full) {
    return avatarUrls.full;
  }
  
  // Fallback chain: thumbnail -> full -> default
  if (avatarUrls.thumbnail) {
    return avatarUrls.thumbnail;
  }
  
  if (avatarUrls.full) {
    return avatarUrls.full;
  }
  
  // Return a default avatar placeholder
  return '/api/placeholder/96/96';
}

/**
 * Get avatar display size in pixels based on context
 * @param size - Size context
 * @returns Size in pixels
 */
export function getAvatarSize(size: 'small' | 'medium' | 'large'): number {
  switch (size) {
    case 'small':
      return 32; // For comments, chat, etc.
    case 'medium':
      return 64; // For profile displays
    case 'large':
      return 128; // For full profile views
    default:
      return 64;
  }
}

/**
 * Get avatar CSS classes based on size
 * @param size - Size context
 * @returns CSS classes string
 */
export function getAvatarClasses(size: 'small' | 'medium' | 'large'): string {
  const baseClasses = 'rounded-full object-cover';
  
  switch (size) {
    case 'small':
      return `${baseClasses} w-8 h-8`;
    case 'medium':
      return `${baseClasses} w-16 h-16`;
    case 'large':
      return `${baseClasses} w-32 h-32`;
    default:
      return `${baseClasses} w-16 h-16`;
  }
}
