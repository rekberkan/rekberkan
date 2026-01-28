/*
 * KAHADE LOGIN PAGE - Modern Design
 * Brand color: #000000
 */

import { useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { ShieldCheck, Envelope, Lock, Eye, EyeSlash, ArrowRight, Spinner } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

// Error code to user-friendly message mapping
const getErrorMessage = (error: any): { title: string; description: string } => {
  const code = error.response?.data?.code || error.code;
  const message = error.response?.data?.message || error.message;
  const status = error.response?.status;

  // Handle specific error codes
  switch (code) {
    case 'ACCOUNT_LOCKED':
      const lockedUntil = error.response?.data?.lockedUntil;
      const remainingMinutes = error.response?.data?.remainingMinutes;
      return {
        title: 'Account Locked',
        description: remainingMinutes 
          ? `Too many failed login attempts. Please try again in ${remainingMinutes} minutes.`
          : 'Your account has been temporarily locked due to too many failed login attempts.'
      };
    
    case 'ACCOUNT_SUSPENDED':
      const suspendReason = error.response?.data?.suspendReason;
      return {
        title: 'Account Suspended',
        description: suspendReason 
          ? `Your account has been suspended: ${suspendReason}. Please contact support.`
          : 'Your account has been suspended. Please contact support for assistance.'
      };
    
    case 'MFA_TOKEN_REQUIRED':
      return {
        title: 'MFA Required',
        description: 'Please enter your two-factor authentication code to continue.'
      };
    
    case 'MFA_INVALID':
      return {
        title: 'Invalid MFA Code',
        description: 'The two-factor authentication code you entered is incorrect. Please try again.'
      };
    
    case 'EMAIL_NOT_VERIFIED':
      return {
        title: 'Email Not Verified',
        description: 'Please verify your email address before logging in. Check your inbox for the verification link.'
      };
    
    default:
      break;
  }

  // Handle HTTP status codes
  switch (status) {
    case 401:
      return {
        title: 'Invalid Credentials',
        description: 'The email or password you entered is incorrect. Please check and try again.'
      };
    
    case 403:
      return {
        title: 'Access Denied',
        description: message || 'You do not have permission to access this account.'
      };
    
    case 429:
      return {
        title: 'Too Many Requests',
        description: 'You have made too many login attempts. Please wait a few minutes before trying again.'
      };
    
    case 500:
    case 502:
    case 503:
      return {
        title: 'Server Error',
        description: 'We are experiencing technical difficulties. Please try again later.'
      };
    
    default:
      // Network error
      if (error.code === 'ERR_NETWORK' || !error.response) {
        return {
          title: 'Connection Error',
          description: 'Unable to connect to the server. Please check your internet connection and try again.'
        };
      }
      
      return {
        title: 'Login Failed',
        description: message || 'An unexpected error occurred. Please try again.'
      };
  }
};

export default function Login() {
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showMfaInput, setShowMfaInput] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    mfaCode: '',
    remember: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Missing Information', { 
        description: 'Please enter both email and password to continue.' 
      });
      return;
    }

    try {
      await login(formData.email, formData.password);
      toast.success('Welcome back!', {
        description: 'You have successfully logged in.'
      });
    } catch (error: any) {
      const { title, description } = getErrorMessage(error);
      
      // Check if MFA is required
      if (error.response?.data?.code === 'MFA_TOKEN_REQUIRED') {
        setShowMfaInput(true);
        toast.info(title, { description });
      } else {
        toast.error(title, { description });
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-8">
            <img src="/images/logo.svg" alt="Kahade" className="h-8 w-auto" />
          </Link>
          
          <h1 className="text-3xl font-bold mb-2 text-black">Welcome Back</h1>
          <p className="text-[#6B7280] mb-8">
            Sign in to your account to continue
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-black">Email</Label>
              <div className="relative">
                <Envelope className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" weight="regular" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                  required
                  className="pl-10 bg-white border-[#E5E5E5] focus:border-black focus:ring-black h-12"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-black">Password</Label>
                <Link href="/forgot-password" className="text-sm text-black hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" weight="regular" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="pl-10 pr-10 bg-white border-[#E5E5E5] focus:border-black focus:ring-black h-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-black transition-colors"
                >
                  {showPassword ? <EyeSlash className="w-5 h-5" weight="regular" /> : <Eye className="w-5 h-5" weight="regular" />}
                </button>
              </div>
            </div>

            {/* MFA Input - shown when required */}
            {showMfaInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2"
              >
                <Label htmlFor="mfaCode" className="text-black">Two-Factor Authentication Code</Label>
                <Input
                  id="mfaCode"
                  type="text"
                  value={formData.mfaCode}
                  onChange={(e) => setFormData({ ...formData, mfaCode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="bg-white border-[#E5E5E5] focus:border-black focus:ring-black h-12 text-center text-lg tracking-widest"
                />
                <p className="text-xs text-[#6B7280]">
                  Enter the code from your authenticator app
                </p>
              </motion.div>
            )}
            
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={formData.remember}
                onCheckedChange={(checked) => setFormData({ ...formData, remember: checked as boolean })}
                className="border-[#E5E5E5] data-[state=checked]:bg-black data-[state=checked]:border-black"
              />
              <Label htmlFor="remember" className="text-sm cursor-pointer text-[#6B7280]">
                Remember me
              </Label>
            </div>
            
            <Button 
              type="submit" 
              className="btn-primary w-full h-12"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner className="mr-2 w-4 h-4 animate-spin" weight="bold" />
                  Processing...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 w-4 h-4" weight="bold" />
                </>
              )}
            </Button>
          </form>
          
          <p className="mt-8 text-center text-sm text-[#6B7280]">
            Don't have an account?{' '}
            <Link href="/register" className="text-black hover:underline font-semibold">
              Sign up now
            </Link>
          </p>
        </motion.div>
      </div>
      
      {/* Right Side - Visual */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-8 bg-black relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative z-10 text-center"
        >
          <div className="w-48 h-48 mx-auto mb-8 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
            <ShieldCheck className="w-24 h-24 text-white" weight="duotone" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-white">
            Secure Transactions with Kahade
          </h2>
          <p className="text-white/70 max-w-sm mx-auto">
            The trusted escrow platform for secure online transactions.
          </p>
          
          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 mt-8">
            <div className="flex items-center gap-2 text-white/50 text-sm">
              <ShieldCheck className="w-4 h-4" weight="fill" />
              <span>SOC 2</span>
            </div>
            <div className="flex items-center gap-2 text-white/50 text-sm">
              <Lock className="w-4 h-4" weight="fill" />
              <span>256-bit SSL</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
