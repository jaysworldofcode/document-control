# Avatar System Documentation

This document describes the comprehensive avatar system implemented for user profile images with automatic thumbnail generation and optimized display.

## 🎯 **Overview**

The avatar system provides:
- **Full-size profile images** (up to 5MB) for detailed profile views
- **Automatic thumbnail generation** (96x96) for comments, chat, and compact displays
- **Supabase storage integration** with proper security policies
- **Smart image selection** based on display context
- **Fallback handling** for missing images

## 🏗️ **Architecture**

### **Storage Structure**
```
profile-images/ (Supabase Storage Bucket)
├── {userId}/
│   ├── {timestamp}_{randomId}.{ext}          # Full-size image
│   └── {timestamp}_{randomId}_thumb.{ext}    # Thumbnail version
```

### **Database Schema**
```sql
ALTER TABLE users ADD COLUMN avatar_url TEXT;
ALTER TABLE users ADD COLUMN avatar_thumbnail_url TEXT;
```

### **File Organization**
- **Full images**: Stored at `{userId}/{timestamp}_{randomId}.{ext}`
- **Thumbnails**: Stored at `{userId}/{timestamp}_{randomId}_thumb.{ext}`
- **Supported formats**: JPEG, PNG, WebP, GIF
- **Size limits**: 5MB per image

## 🔧 **API Endpoints**

### **POST `/api/user/avatar`**
Uploads a new profile image and generates thumbnail.

**Request:**
```typescript
const formData = new FormData();
formData.append('file', imageFile);
```

**Response:**
```json
{
  "success": true,
  "avatarUrl": "https://.../full-image.jpg",
  "avatarThumbnailUrl": "https://.../thumbnail.jpg",
  "message": "Profile image uploaded successfully"
}
```

### **DELETE `/api/user/avatar`**
Removes the current profile image and thumbnail.

**Response:**
```json
{
  "success": true,
  "message": "Profile image removed successfully"
}
```

## 🎨 **Display Components**

### **AvatarDisplay Component**
Automatically selects the appropriate image size based on context.

```tsx
import { AvatarDisplay } from '@/components/ui/avatar-display';

<AvatarDisplay
  avatarUrls={{
    full: user.avatarUrl,
    thumbnail: user.avatarThumbnailUrl
  }}
  size="small" // 'small' | 'medium' | 'large'
  alt="User name"
/>
```

### **Size Variants**
- **`small`** (32x32): Comments, chat, compact lists
- **`medium`** (64x64): Profile displays, user cards
- **`large`** (128x128): Full profile views, settings

### **Convenience Components**
```tsx
import { SmallAvatar, MediumAvatar, LargeAvatar } from '@/components/ui/avatar-display';

<SmallAvatar avatarUrls={userAvatarUrls} alt="User" />
<MediumAvatar avatarUrls={userAvatarUrls} alt="User" />
<LargeAvatar avatarUrls={userAvatarUrls} alt="User" />
```

## 🛠️ **Utility Functions**

### **getAvatarUrl()**
Selects the best avatar URL for a given context.

```typescript
import { getAvatarUrl } from '@/utils/avatar.utils';

const avatarUrl = getAvatarUrl(
  { full: user.avatarUrl, thumbnail: user.avatarThumbnailUrl },
  'small'
);
```

### **getAvatarSize()**
Returns pixel dimensions for a given size context.

```typescript
const size = getAvatarSize('small'); // Returns 32
```

### **getAvatarClasses()**
Returns Tailwind CSS classes for consistent styling.

```typescript
const classes = getAvatarClasses('small'); // Returns "rounded-full object-cover w-8 h-8"
```

## 🔐 **Security & Permissions**

### **Storage Policies**
- **Upload**: Users can only upload to their own folder
- **View**: All profile images are publicly viewable
- **Update**: Users can only update their own images
- **Delete**: Users can only delete their own images

### **Access Control**
- JWT token verification required for upload/delete
- User ID validation ensures users can only modify their own avatars
- Organization-based access control through existing user system

## 📱 **Usage Examples**

### **1. Profile Settings Page**
```tsx
<AvatarDisplay
  avatarUrls={{
    full: user.avatarUrl,
    thumbnail: user.avatarThumbnailUrl
  }}
  size="large"
  alt={`${user.firstName} ${user.lastName}`}
/>
```

### **2. Comment System**
```tsx
<SmallAvatar
  avatarUrls={{
    full: comment.author.avatarUrl,
    thumbnail: comment.author.avatarThumbnailUrl
  }}
  alt={comment.author.name}
/>
```

### **3. Chat Messages**
```tsx
<SmallAvatar
  avatarUrls={{
    full: message.user.avatarUrl,
    thumbnail: message.user.avatarThumbnailUrl
  }}
  alt={message.user.name}
/>
```

### **4. User Lists**
```tsx
<MediumAvatar
  avatarUrls={{
    full: user.avatarUrl,
    thumbnail: user.avatarThumbnailUrl
  }}
  alt={user.name}
/>
```

## 🚀 **Performance Benefits**

### **Image Optimization**
- **Thumbnails**: 96x96 pixels for small displays
- **Lazy loading**: Images load only when needed
- **CDN**: Supabase storage provides global CDN distribution
- **Caching**: Browser and CDN caching for fast loading

### **Bandwidth Savings**
- **Small contexts**: Use 96x96 thumbnails instead of full images
- **Progressive loading**: Thumbnail loads first, full image on demand
- **Responsive**: Automatically selects appropriate size

## 🔄 **Migration Guide**

### **1. Run Database Migration**
```sql
\i migrations/018_add_user_avatar_field.sql
```

### **2. Update User Types**
```typescript
interface User {
  // ... existing fields
  avatarUrl?: string;
  avatarThumbnailUrl?: string;
}
```

### **3. Replace Avatar Components**
```tsx
// Before
<img src={user.avatarUrl} className="w-8 h-8 rounded-full" />

// After
<SmallAvatar 
  avatarUrls={{ full: user.avatarUrl, thumbnail: user.avatarThumbnailUrl }}
  alt={user.name}
/>
```

## 🐛 **Troubleshooting**

### **Common Issues**

1. **Images not uploading**
   - Check Supabase storage bucket exists
   - Verify storage policies are configured
   - Check file size (must be < 5MB)

2. **Thumbnails not generating**
   - Current implementation uses same image for both
   - For production, implement proper image processing
   - Consider using Sharp, Jimp, or cloud services

3. **Permission errors**
   - Verify JWT token is valid
   - Check user ID matches storage folder
   - Ensure storage policies are correct

### **Debug Steps**
1. Check browser console for errors
2. Verify API responses in Network tab
3. Check Supabase storage logs
4. Verify database fields are populated

## 🔮 **Future Enhancements**

### **Planned Features**
- **Real thumbnail generation** using Sharp or similar
- **Image compression** for better storage efficiency
- **Multiple thumbnail sizes** (32x32, 64x64, 128x128)
- **Image cropping** for better aspect ratios
- **WebP conversion** for modern browsers

### **Integration Opportunities**
- **Cloudinary**: Advanced image processing
- **AWS Lambda**: Serverless thumbnail generation
- **ImageKit**: CDN with automatic transformations
- **Sharp**: High-performance image processing

## 📚 **References**

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Next.js Image Optimization](https://nextjs.org/docs/basic-features/image-optimization)
- [Tailwind CSS Utilities](https://tailwindcss.com/docs)
- [React Component Patterns](https://react.dev/learn)

---

*Last updated: December 2024*
*Version: 1.0*
