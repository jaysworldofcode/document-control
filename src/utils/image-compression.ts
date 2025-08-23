/**
 * Client-side image compression utilities
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
}

/**
 * Compress an image file using HTML5 Canvas
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Promise<File> - The compressed image file
 */
export async function compressImage(
  file: File, 
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxWidth = 400,
    maxHeight = 400,
    quality = 0.8,
    format = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    const img = new Image();
    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img;
      
      // Scale down if image is larger than max dimensions
      if (width > maxWidth || height > maxHeight) {
        const scaleX = maxWidth / width;
        const scaleY = maxHeight / height;
        const scale = Math.min(scaleX, scaleY);
        
        width = width * scale;
        height = height * scale;
      }
      
      canvas.width = width;
      canvas.height = height;

      // Draw the resized image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob with compression
      canvas.toBlob((blob) => {
        if (blob) {
          // Create a new File object from the compressed blob
          const compressedFile = new File([blob], file.name, {
            type: format,
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        } else {
          reject(new Error('Failed to compress image'));
        }
      }, format, quality);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    
    // Create object URL from file
    const url = URL.createObjectURL(file);
    img.src = url;
    
    // Clean up object URL after image loads
    img.onload = () => URL.revokeObjectURL(url);
  });
}

/**
 * Get file size in human readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validate image file
 * @param file - File to validate
 * @param maxSize - Maximum file size in bytes
 * @returns Validation result
 */
export function validateImageFile(file: File, maxSize: number = 5 * 1024 * 1024): {
  isValid: boolean;
  error?: string;
} {
  // Check if it's an image
  if (!file.type.startsWith('image/')) {
    return {
      isValid: false,
      error: 'File must be an image'
    };
  }

  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size must be less than ${formatFileSize(maxSize)}`
    };
  }

  return { isValid: true };
}
