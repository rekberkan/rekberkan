/*
 * REKBERKAN LOGIN PAGE - Enhanced Professional Version
 * Brand color: #000000
 * Features: Modern auth flow, MFA support, social login UI, security badges
 */

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Envelope, Lock, Eye, EyeSlash, ArrowRight, Spinner,
  GoogleLogo, AppleLogo, GithubLogo, Warning, CheckCircle,
  DeviceMobile, Key, ArrowLeft, Info, Lightning, Users, Wallet
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

const testimonials = [
  {
    quote: "Rekberkan made my first online transaction completely stress-free. The escrow system is brilliant!",
    author: "Sarah M.",
    role: "Verified Buyer"
  },
  {
    quote: "As a seller, I finally feel protected. No more chargebacks or scams. Highly recommended!",
    author: "Ahmad K.",
    role: "Power Seller"
  },
  {
    quote: "The fastest dispute resolution I've ever experienced. Customer support is exceptional.",
    author: "Dewi R.",
    role: "Business Owner"
  }
];

const stats = [
  { value: '50K+', label: 'Active Users' },
  { value: 'Rp 10B+', label: 'Secured' },
  { value: '99.9%', label: 'Success Rate' }
];

export default function Login() {
  const { login, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showMfaInput, setShowMfaInput] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    mfaCode: '',
    remember: false
  });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    // SECURITY FIX [M005]: Aligned with backend validation (8 characters minimum)
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
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12 xl:px-20">
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2 mb-8 group">
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
                <h1 className="text-3xl font-bold mb-2 text-black">Welcome back</h1>
                <p className="text-[#6B7280] mb-8">
                  Sign in to your account to continue managing your transactions
                </p>
                
                {/* Social Login Buttons */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <Button 
                    type="button"
                    variant="outline" 
                    className="h-12 border-[#E5E5E5] hover:bg-[#F5F5F5]"
                    onClick={() => handleSocialLogin('Google')}
                  >
                    <GoogleLogo className="w-5 h-5" weight="bold" />
                  </Button>
                  <Button 
                    type="button"
                    variant="outline" 
                    className="h-12 border-[#E5E5E5] hover:bg-[#F5F5F5]"
                    onClick={() => handleSocialLogin('Apple')}
                  >
                    <AppleLogo className="w-5 h-5" weight="fill" />
                  </Button>
                  <Button 
                    type="button"
                    variant="outline" 
                    className="h-12 border-[#E5E5E5] hover:bg-[#F5F5F5]"
                    onClick={() => handleSocialLogin('GitHub')}
                  >
                    <GithubLogo className="w-5 h-5" weight="fill" />
                  </Button>
                </div>

                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#E5E5E5]" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-[#6B7280]">or continue with email</span>
                  </div>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-black font-medium">Email address</Label>
                    <div className="relative">
                      <Envelope className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" weight="regular" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          if (errors.email) setErrors({ ...errors, email: undefined });
                        }}
                        placeholder="you@example.com"
                        className={`pl-10 bg-white border-[#E5E5E5] focus:border-black focus:ring-black h-12 ${errors.email ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <Warning className="w-4 h-4" weight="fill" />
                        {errors.email}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-black font-medium">Password</Label>
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
                        onChange={(e) => {
                          setFormData({ ...formData, password: e.target.value });
                          if (errors.password) setErrors({ ...errors, password: undefined });
                        }}
                        placeholder="••••••••"
                        className={`pl-10 pr-10 bg-white border-[#E5E5E5] focus:border-black focus:ring-black h-12 ${errors.password ? 'border-red-500' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-black transition-colors"
                      >
                        {showPassword ? <EyeSlash className="w-5 h-5" weight="regular" /> : <Eye className="w-5 h-5" weight="regular" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <Warning className="w-4 h-4" weight="fill" />
                        {errors.password}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember"
                      checked={formData.remember}
                      onCheckedChange={(checked) => setFormData({ ...formData, remember: checked as boolean })}
                      className="border-[#E5E5E5] data-[state=checked]:bg-black data-[state=checked]:border-black"
                    />
                    <Label htmlFor="remember" className="text-sm cursor-pointer text-[#6B7280]">
                      Keep me signed in for 30 days
                    </Label>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-black text-white hover:bg-black/90 font-medium"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Spinner className="mr-2 w-5 h-5 animate-spin" weight="bold" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign in
                        <ArrowRight className="ml-2 w-5 h-5" weight="bold" />
                      </>
                    )}
                  </Button>

                  {loginAttempts >= 3 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-lg bg-amber-50 border border-amber-200"
                    >
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" weight="fill" />
                        <div>
                          <p className="text-sm text-amber-800 font-medium">Having trouble signing in?</p>
                          <p className="text-sm text-amber-700 mt-1">
                            <Link href="/forgot-password" className="underline">Reset your password</Link> or{' '}
                            <Link href="/contact" className="underline">contact support</Link> for help.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </form>
                
                <p className="mt-8 text-center text-sm text-[#6B7280]">
                  Don't have an account?{' '}
                  <Link href="/register" className="text-black hover:underline font-semibold">
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
                  className="flex items-center gap-2 text-[#6B7280] hover:text-black mb-6 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" weight="bold" />
                  Back to login
                </button>

                <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center mb-6">
                  <Key className="w-8 h-8 text-white" weight="duotone" />
                </div>

                <h1 className="text-3xl font-bold mb-2 text-black">Two-factor authentication</h1>
                <p className="text-[#6B7280] mb-8">
                  Enter the 6-digit code from your authenticator app to verify your identity
                </p>

                <form onSubmit={handleMfaSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="mfaCode" className="text-black font-medium">Authentication code</Label>
                    <Input
                      id="mfaCode"
                      type="text"
                      inputMode="numeric"
                      value={formData.mfaCode}
                      onChange={(e) => setFormData({ ...formData, mfaCode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                      placeholder="000000"
                      maxLength={6}
                      className="bg-white border-[#E5E5E5] focus:border-black focus:ring-black h-14 text-center text-2xl tracking-[0.5em] font-mono"
                      autoFocus
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-black text-white hover:bg-black/90 font-medium"
                    disabled={isLoading || formData.mfaCode.length !== 6}
                  >
                    {isLoading ? (
                      <>
                        <Spinner className="mr-2 w-5 h-5 animate-spin" weight="bold" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify and sign in
                        <ArrowRight className="ml-2 w-5 h-5" weight="bold" />
                      </>
                    )}
                  </Button>

                  <div className="p-4 rounded-lg bg-[#F5F5F5]">
                    <div className="flex items-start gap-3">
                      <DeviceMobile className="w-5 h-5 text-[#6B7280] shrink-0 mt-0.5" weight="duotone" />
                      <div>
                        <p className="text-sm text-[#6B7280]">
                          Open your authenticator app (Google Authenticator, Authy, etc.) and enter the code displayed for Rekberkan.
                        </p>
                      </div>
                    </div>
                  </div>
                </form>

                <p className="mt-6 text-center text-sm text-[#6B7280]">
                  Lost access to your authenticator?{' '}
                  <Link href="/contact" className="text-black hover:underline font-semibold">
                    Contact support
                  </Link>
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Security Notice */}
          <div className="mt-8 pt-8 border-t border-[#E5E5E5]">
            <div className="flex items-center justify-center gap-6 text-xs text-[#9CA3AF]">
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" weight="fill" />
                <span>256-bit SSL</span>
              </div>
              <div className="flex items-center gap-1">
                <Lock className="w-4 h-4" weight="fill" />
                <span>Encrypted</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4" weight="fill" />
                <span>Secure</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Side - Visual */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12 bg-black relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        <div className="relative z-10 w-full max-w-lg">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mb-12">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-white/60">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Main Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/10"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-white" weight="duotone" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Trusted Escrow Platform</h2>
                <p className="text-white/60">Secure your online transactions</p>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-emerald-400" weight="fill" />
                </div>
                <span className="text-white/80">Funds held securely until delivery confirmed</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Lightning className="w-4 h-4 text-blue-400" weight="fill" />
                </div>
                <span className="text-white/80">Instant notifications & real-time tracking</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Users className="w-4 h-4 text-purple-400" weight="fill" />
                </div>
                <span className="text-white/80">24/7 dispute resolution support</span>
              </div>
            </div>

            {/* Testimonial */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="border-t border-white/10 pt-6"
              >
                <p className="text-white/80 italic mb-4">"{testimonials[currentTestimonial].quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                    {testimonials[currentTestimonial].author.charAt(0)}
                  </div>
                  <div>
                    <div className="text-white font-medium">{testimonials[currentTestimonial].author}</div>
                    <div className="text-white/50 text-sm">{testimonials[currentTestimonial].role}</div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Testimonial indicators */}
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentTestimonial ? 'bg-white' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          </motion.div>

          {/* Trust badges */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-8 mt-8"
          >
            <div className="flex items-center gap-2 text-white/40 text-sm">
              <ShieldCheck className="w-5 h-5" weight="fill" />
              <span>SOC 2 Certified</span>
            </div>
            <div className="flex items-center gap-2 text-white/40 text-sm">
              <Lock className="w-5 h-5" weight="fill" />
              <span>Bank-Level Security</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
