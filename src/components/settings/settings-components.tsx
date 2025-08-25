"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Camera, Upload, Check, X, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { compressImage, validateImageFile } from "@/utils/image-compression";

interface AvatarUploadProps {
  currentAvatar?: string;
  onAvatarChange?: (avatar: string) => void;
  onAvatarRemove?: () => void;
}

export function AvatarUpload({ currentAvatar, onAvatarChange, onAvatarRemove }: AvatarUploadProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        // Create preview URL immediately for better user experience
        const previewFromOriginal = URL.createObjectURL(file);
        setPreviewUrl(previewFromOriginal);
        
        // Set the file immediately to prevent null file issues
        setSelectedFile(file);
        
        // Compress the image in background
        const compressedFile = await compressImage(file, {
          maxWidth: 400,
          maxHeight: 400,
          quality: 0.8,
          format: 'image/jpeg'
        });
        
        // Update with compressed file
        setSelectedFile(compressedFile);
        
        // Create new preview URL from compressed file
        const compressedUrl = URL.createObjectURL(compressedFile);
        
        // Release the original preview URL only after we have the new one
        URL.revokeObjectURL(previewFromOriginal);
        setPreviewUrl(compressedUrl);
        
        // Show compression info
        const originalSize = (file.size / 1024 / 1024).toFixed(2);
        const compressedSize = (compressedFile.size / 1024 / 1024).toFixed(2);
        const savings = ((file.size - compressedFile.size) / file.size * 100).toFixed(1);
        
        toast({
          title: "Image compressed",
          description: `Compressed from ${originalSize}MB to ${compressedSize}MB (${savings}% smaller)`,
        });
      } catch (error) {
        console.error('Image compression failed:', error);
        // Fallback to original file if not already set
        setSelectedFile(file);
        
        // Make sure we have a preview URL
        if (!previewUrl) {
          const url = URL.createObjectURL(file);
          setPreviewUrl(url);
        }
        
        toast({
          title: "Compression failed",
          description: "Using original image file.",
        });
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        variant: "destructive",
        title: "No image selected",
        description: "Please select an image to upload",
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Upload failed');
      }
      
      const result = await response.json();
      
      // Call the callback with the new avatar URL
      if (result.avatarUrl && onAvatarChange) {
        onAvatarChange(result.avatarUrl);
      }
      
      // Clean up
      setIsDialogOpen(false);
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }

      toast({
        title: "Success",
        description: "Profile image uploaded successfully!",
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!currentAvatar) return;

    setIsRemoving(true);
    try {
      const response = await fetch('/api/user/avatar', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Remove failed');
      }

      // Call the callback to remove avatar
      onAvatarRemove?.();
      
      toast({
        title: "Success",
        description: "Profile image removed successfully!",
      });

    } catch (error) {
      console.error('Remove error:', error);
      toast({
        variant: "destructive",
        title: "Remove failed",
        description: error instanceof Error ? error.message : "Failed to remove image",
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-background shadow-sm hover:bg-primary-foreground transition-colors"
          aria-label="Change profile picture"
          title="Change profile picture"
        >
          <Camera className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Profile Picture</DialogTitle>
          <DialogDescription>
            Choose a new profile picture. Your image will be automatically resized and compressed. 
            Any image format is supported (JPG, PNG, GIF, etc).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="w-32 h-32 rounded-full border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : currentAvatar ? (
                <img src={currentAvatar} alt="Current avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Upload Image</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar-upload">Select Image</Label>
            <Input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="cursor-pointer"
            />
          </div>

          {selectedFile && (
            <div className="text-sm text-muted-foreground">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          )}

          {currentAvatar && !selectedFile && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={handleRemove}
                disabled={isRemoving}
                className="text-destructive hover:text-destructive"
              >
                {isRemoving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Remove Current Image
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Password strength indicator component
interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const getPasswordStrength = (password: string): { score: number; feedback: string; color: string } => {
    if (!password) return { score: 0, feedback: "Enter a password", color: "text-gray-500" };
    
    let score = 0;
    const checks = [
      { test: password.length >= 8, point: 1 },
      { test: /[a-z]/.test(password), point: 1 },
      { test: /[A-Z]/.test(password), point: 1 },
      { test: /\d/.test(password), point: 1 },
      { test: /[^a-zA-Z\d]/.test(password), point: 1 },
    ];

    score = checks.reduce((acc, check) => acc + (check.test ? check.point : 0), 0);

    const feedback = [
      "Very Weak",
      "Weak", 
      "Fair",
      "Good",
      "Strong"
    ][score] || "Very Weak";

    const colors = [
      "text-red-600",
      "text-red-500",
      "text-yellow-500",
      "text-blue-500",
      "text-green-600"
    ];

    return { score, feedback, color: colors[score] || colors[0] };
  };

  const strength = getPasswordStrength(password);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Password Strength</span>
        <span className={`text-sm font-medium ${strength.color}`}>
          {strength.feedback}
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${
            strength.score === 0 ? 'bg-gray-300' :
            strength.score === 1 ? 'bg-red-500' :
            strength.score === 2 ? 'bg-red-400' :
            strength.score === 3 ? 'bg-yellow-500' :
            strength.score === 4 ? 'bg-blue-500' :
            'bg-green-500'
          }`}
          style={{ width: `${(strength.score / 5) * 100}%` }}
        />
      </div>
    </div>
  );
}
