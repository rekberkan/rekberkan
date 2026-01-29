/*
 * REKBERKAN LOGIN PAGE - EXCLUSIVE EDITION
 * 
 * Design Philosophy:
 * - Split-screen premium layout
 * - Clean, focused form design
 * - Strong visual hierarchy
 * - Trust-building elements
 */

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Envelope, Lock, Eye, EyeSlash, ArrowRight, Spinner,
  GoogleLogo, AppleLogo, GithubLogo, Warning, CheckCircle,
  DeviceMobile, Key, ArrowLeft, Lightning, Users, Wallet
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

// Error code to user-friendly message mapping
const getErrorMessage = (error: any): { title: string; description: string; action?: string } => {
  const code = error.response?.data?.code || error.code;
  const message = error.response?.data?.message || error.message;
  const status = error.response?.status;

  switch (code) {
    case 'ACCOUNT_LOCKED':
      const remainingMinutes = error.response?.data?.remainingMinutes;
      return {
        title: 'Account Locked',
        description: remainingMinutes 
          ? `Too many failed login attempts. Please try again in ${remainingMinutes} minutes.`
          : 'Your account has been temporarily locked due to too many failed login attempts.',
        action: 'wait'
      };
    
    case 'ACCOUNT_SUSPENDED':
      const suspendReason = error.response?.data?.suspendReason;
      return {
        title: 'Account Suspended',
        description: suspendReason 
          ? `Your account has been suspended: ${suspendReason}. Please contact support.`
          : 'Your account has been suspended. Please contact support for assistance.',
        action: 'contact'
      };
    
    case 'MFA_TOKEN_REQUIRED':
      return {
        title: 'Verification Required',
        description: 'Please enter your two-factor authentication code to continue.'
      };
    
    case 'MFA_INVALID':
      return {
        title: 'Invalid Code',
        description: 'The authentication code you entered is incorrect. Please try again.'
      };
    
    case 'EMAIL_NOT_VERIFIED':
      return {
        title: 'Email Not Verified',
        description: 'Please verify your email address before logging in. Check your inbox for the verification link.',
        action: 'resend'
      };
    
    default:
      break;
  }

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
        description: 'You have made too many login attempts. Please wait a few minutes before trying again.',
        action: 'wait'
      };
    
    case 500:
    case 502:
    case 503:
      return {
        title: 'Server Error',
        description: 'We are experiencing technical difficulties. Please try again later.'
      };
    
    default:
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

const stats = [
  { value: 'Rp 50M+', label: 'Total Secured' },
  { value: '10K+', label: 'Active Users' },
  { value: '99.9%', label: 'Success Rate' }
];

const features = [
  { icon: ShieldCheck, text: 'Bank-level security' },
  { icon: Lightning, text: 'Instant transactions' },
  { icon: Users, text: 'Trusted by thousands' },
];

export default function Login() {
  const { login, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showMfaInput, setShowMfaInput] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    mfaCode: '',
    remember: false
  });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await login(formData.email, formData.password);
      toast.success('Welcome back!', {
        description: 'You have successfully logged in.'
      });
    } catch (error: any) {
      setLoginAttempts(prev => prev + 1);
      const { title, description, action } = getErrorMessage(error);
      
      if (error.response?.data?.code === 'MFA_TOKEN_REQUIRED') {
        setShowMfaInput(true);
        toast.info(title, { description });
      } else {
        toast.error(title, { description });
      }
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.mfaCode.length !== 6) {
      toast.error('Invalid Code', { description: 'Please enter a 6-digit code' });
      return;
    }

    try {
      await login(formData.email, formData.password);
      toast.success('Welcome back!', {
        description: 'You have successfully logged in.'
      });
    } catch (error: any) {
      const { title, description } = getErrorMessage(error);
      toast.error(title, { description });
    }
  };

  const handleSocialLogin = (provider: string) => {
    toast.info(`${provider} login coming soon`, {
      description: 'Social login will be available in a future update.'
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0A0A0A] text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2">
            <img 
              src="/images/logo-white.svg" 
              alt="Rekberkan" 
              className="h-8 w-auto"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/images/logo.svg';
                target.style.filter = 'brightness(0) invert(1)';
              }}
            />
          </Link>
          
          {/* Main Content */}
          <div className="max-w-md">
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-6">
              Secure every transaction with confidence
            </h1>
            <p className="text-white/60 text-lg leading-relaxed mb-10">
              Join thousands of users who trust Rekberkan for their online transactions. 
              Full protection for buyers and sellers.
            </p>
            
            {/* Features */}
            <div className="space-y-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.text}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                  className="flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <feature.icon className="w-5 h-5" weight="bold" />
                  </div>
                  <span className="text-white/80">{feature.text}</span>
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.5 }}
              >
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className="text-white/40 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12 xl:px-20 bg-white">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Logo */}
          <Link href="/" className="lg:hidden inline-flex items-center gap-2 mb-10">
            <img src="/images/logo.svg" alt="Rekberkan" className="h-8 w-auto" />
          </Link>
          
          <AnimatePresence mode="wait">
            {!showMfaInput ? (
              <motion.div
                key="login-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <h1 className="text-3xl xl:text-4xl font-bold mb-3 text-[#0A0A0A]">Welcome back</h1>
                <p className="text-[#737373] mb-10">
                  Sign in to your account to continue managing your transactions
                </p>
                
                {/* Social Login Buttons */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                  <button 
                    type="button"
                    className="h-12 border-2 border-[#E8E8E8] rounded-xl flex items-center justify-center hover:border-[#0A0A0A] hover:bg-[#F5F5F5] transition-all"
                    onClick={() => handleSocialLogin('Google')}
                  >
                    <GoogleLogo className="w-5 h-5" weight="bold" />
                  </button>
                  <button 
                    type="button"
                    className="h-12 border-2 border-[#E8E8E8] rounded-xl flex items-center justify-center hover:border-[#0A0A0A] hover:bg-[#F5F5F5] transition-all"
                    onClick={() => handleSocialLogin('Apple')}
                  >
                    <AppleLogo className="w-5 h-5" weight="fill" />
                  </button>
                  <button 
                    type="button"
                    className="h-12 border-2 border-[#E8E8E8] rounded-xl flex items-center justify-center hover:border-[#0A0A0A] hover:bg-[#F5F5F5] transition-all"
                    onClick={() => handleSocialLogin('GitHub')}
                  >
                    <GithubLogo className="w-5 h-5" weight="fill" />
                  </button>
                </div>

                <div className="relative mb-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#E8E8E8]" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-[#A3A3A3]">or continue with email</span>
                  </div>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[#0A0A0A] font-semibold">Email address</Label>
                    <div className="relative">
                      <Envelope className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A3A3A3]" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`pl-12 h-12 bg-[#F8F8F8] border-2 border-transparent rounded-xl focus:bg-white focus:border-[#0A0A0A] transition-all ${
                          errors.email ? 'border-red-500 bg-red-50' : ''
                        }`}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-red-500 flex items-center gap-1.5">
                        <Warning className="w-4 h-4" weight="fill" />
                        {errors.email}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-[#0A0A0A] font-semibold">Password</Label>
                      <Link href="/forgot-password" className="text-sm text-[#737373] hover:text-[#0A0A0A] transition-colors">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A3A3A3]" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className={`pl-12 pr-12 h-12 bg-[#F8F8F8] border-2 border-transparent rounded-xl focus:bg-white focus:border-[#0A0A0A] transition-all ${
                          errors.password ? 'border-red-500 bg-red-50' : ''
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A3A3A3] hover:text-[#0A0A0A] transition-colors"
                      >
                        {showPassword ? <EyeSlash className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-red-500 flex items-center gap-1.5">
                        <Warning className="w-4 h-4" weight="fill" />
                        {errors.password}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="remember"
                      checked={formData.remember}
                      onCheckedChange={(checked) => setFormData({ ...formData, remember: checked as boolean })}
                      className="border-2 border-[#E8E8E8] data-[state=checked]:bg-[#0A0A0A] data-[state=checked]:border-[#0A0A0A]"
                    />
                    <Label htmlFor="remember" className="text-sm text-[#737373] cursor-pointer">
                      Remember me for 30 days
                    </Label>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="btn-primary w-full h-12"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Spinner className="w-5 h-5 animate-spin mr-2" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="ml-2 w-5 h-5" weight="bold" />
                      </>
                    )}
                  </Button>
                </form>
                
                <p className="mt-8 text-center text-[#737373]">
                  Don't have an account?{' '}
                  <Link href="/register" className="font-semibold text-[#0A0A0A] hover:underline">
                    Create account
                  </Link>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="mfa-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <button
                  onClick={() => setShowMfaInput(false)}
                  className="flex items-center gap-2 text-[#737373] hover:text-[#0A0A0A] mb-8 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" weight="bold" />
                  Back to login
                </button>
                
                <div className="w-16 h-16 rounded-2xl bg-[#F5F5F5] flex items-center justify-center mb-6">
                  <DeviceMobile className="w-8 h-8 text-[#0A0A0A]" weight="duotone" />
                </div>
                
                <h1 className="text-3xl font-bold mb-3 text-[#0A0A0A]">Two-Factor Authentication</h1>
                <p className="text-[#737373] mb-8">
                  Enter the 6-digit code from your authenticator app to continue.
                </p>
                
                <form onSubmit={handleMfaSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="mfaCode" className="text-[#0A0A0A] font-semibold">Authentication Code</Label>
                    <div className="relative">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A3A3A3]" />
                      <Input
                        id="mfaCode"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        placeholder="000000"
                        value={formData.mfaCode}
                        onChange={(e) => setFormData({ ...formData, mfaCode: e.target.value.replace(/\D/g, '') })}
                        className="pl-12 h-12 bg-[#F8F8F8] border-2 border-transparent rounded-xl focus:bg-white focus:border-[#0A0A0A] text-center text-2xl tracking-[0.5em] font-mono transition-all"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="btn-primary w-full h-12"
                    disabled={isLoading || formData.mfaCode.length !== 6}
                  >
                    {isLoading ? (
                      <>
                        <Spinner className="w-5 h-5 animate-spin mr-2" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify
                        <ArrowRight className="ml-2 w-5 h-5" weight="bold" />
                      </>
                    )}
                  </Button>
                </form>
                
                <p className="mt-8 text-center text-[#737373]">
                  Lost access to your authenticator?{' '}
                  <Link href="/support" className="font-semibold text-[#0A0A0A] hover:underline">
                    Contact support
                  </Link>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
