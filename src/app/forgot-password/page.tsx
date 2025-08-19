"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Mail, 
  ArrowLeft,
  FileText,
  Shield,
  CheckCircle
} from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate password reset API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app, you would send reset email via your backend
      console.log('Password reset requested for:', email);
      setEmailSent(true);
    } catch (error) {
      console.error('Password reset failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.push('/login');
  };

  const handleResendEmail = () => {
    setEmailSent(false);
    setEmail("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <div className="flex items-center gap-1">
              <FileText className="h-6 w-6 text-white" />
              <Shield className="h-4 w-4 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Document Control</h1>
          <p className="text-gray-600 text-sm mt-1">
            {emailSent ? "Check your email" : "Reset your password"}
          </p>
        </div>

        {/* Forgot Password Card */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <div className="text-center">
              {!emailSent ? (
                <>
                  <p className="text-sm text-gray-600 mb-2">Enter your email address</p>
                  <CardTitle className="text-2xl font-bold text-gray-900">Forgot password?</CardTitle>
                  <CardDescription className="text-gray-600 mt-2">
                    No worries, we'll send you reset instructions.
                  </CardDescription>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900">Check your email</CardTitle>
                  <CardDescription className="text-gray-600 mt-2">
                    We sent a password reset link to {email}
                  </CardDescription>
                </>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {!emailSent ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Reset Password Button */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
                  disabled={isLoading || !email}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending reset link...
                    </div>
                  ) : (
                    "Reset password"
                  )}
                </Button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="text-center text-sm text-gray-600">
                  <p>Didn't receive the email? Check your spam folder or</p>
                </div>
                
                <Button
                  onClick={handleResendEmail}
                  variant="outline"
                  className="w-full h-12 border-gray-200 hover:bg-gray-50"
                >
                  Try another email address
                </Button>
              </div>
            )}

            {/* Back to Login Link */}
            <div className="mt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={handleBackToLogin}
                className="w-full text-gray-600 hover:text-gray-900 font-medium"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to login
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            © 2025 Document Control System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
