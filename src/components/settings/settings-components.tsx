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
import { Camera, Upload, Check, X } from "lucide-react";

interface AvatarUploadProps {
  currentAvatar?: string;
  onAvatarChange?: (avatar: string) => void;
}

export function AvatarUpload({ currentAvatar, onAvatarChange }: AvatarUploadProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = () => {
    if (selectedFile && previewUrl) {
      // In a real app, this would upload to a server
      console.log("Uploading avatar:", selectedFile.name);
      onAvatarChange?.(previewUrl);
      setIsDialogOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
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
          className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
        >
          <Camera className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Profile Picture</DialogTitle>
          <DialogDescription>
            Choose a new profile picture. Recommended size is 400x400px.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="w-32 h-32 rounded-full border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleUpload}
            disabled={!selectedFile}
          >
            <Check className="h-4 w-4 mr-2" />
            Upload
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
