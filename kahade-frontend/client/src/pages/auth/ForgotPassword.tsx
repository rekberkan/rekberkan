/*
 * REKBERKAN FORGOT PASSWORD PAGE - Enhanced Professional Version
 * Brand color: #000000
 * Features: Email validation, rate limiting, security tips
 */

import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Envelope, ArrowLeft, Spinner, CheckCircle, ShieldCheck, Lock,
  ArrowRight, Info, Clock, Warning
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const validateEmail = (email: string): boolean => {
    if (!email) {
      setEmailError('Email address is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      return;
    }

    setIsLoading(true);
    
    try {
      await authApi.forgotPassword(email);
      setIsSubmitted(true);
      setCountdown(60); // 60 second cooldown for resend
      toast.success('Reset link sent!', {
        description: 'Check your inbox for the password reset link.'
      });
    } catch (error: any) {
      console.error('Forgot password error:', error);
      
      if (error.response?.status === 429) {
        const retryAfter = error.response?.headers?.['retry-after'] || 60;
        setCountdown(parseInt(retryAfter));
        toast.error('Too many requests', {
          description: `Please wait ${retryAfter} seconds before trying again.`
        });
      } else {
        // For security, always show success even if email doesn't exist
        setIsSubmitted(true);
        setCountdown(60);
        toast.success('Reset link sent!', {
          description: 'If an account exists with this email, you will receive a reset link.'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    
    setIsLoading(true);
    
    try {
      await authApi.forgotPassword(email);
      setCountdown(60);
      toast.success('Email resent!', {
        description: 'Please check your inbox for the reset link.'
      });
    } catch (error: any) {
      if (error.response?.status === 429) {
        const retryAfter = error.response?.headers?.['retry-after'] || 60;
        setCountdown(parseInt(retryAfter));
        toast.error('Too many requests', {
          description: `Please wait ${retryAfter} seconds before trying again.`
        });
      } else {
        setCountdown(60);
        toast.success('Email resent!', {
          description: 'If an account exists with this email, you will receive a reset link.'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeEmail = () => {
    setIsSubmitted(false);
    setEmail('');
    setCountdown(0);
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
            {!isSubmitted ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="w-16 h-16 rounded-2xl bg-[#F5F5F5] flex items-center justify-center mb-6">
                  <Lock className="w-8 h-8 text-black" weight="duotone" />
                </div>
                
                <h1 className="text-3xl font-bold mb-2 text-black">Forgot your password?</h1>
                <p className="text-[#6B7280] mb-8">
                  No worries! Enter your email address and we'll send you a link to reset your password.
                </p>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-black font-medium">Email address</Label>
                    <div className="relative">
                      <Envelope className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" weight="regular" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (emailError) validateEmail(e.target.value);
                        }}
                        onBlur={() => validateEmail(email)}
                        placeholder="you@example.com"
                        className={`pl-10 bg-white border-[#E5E5E5] focus:border-black focus:ring-black h-12 ${emailError ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {emailError && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <Warning className="w-4 h-4" weight="fill" />
                        {emailError}
                      </p>
                    )}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-black text-white hover:bg-black/90 font-medium"
                    disabled={isLoading || countdown > 0}
                  >
                    {isLoading ? (
                      <>
                        <Spinner className="mr-2 w-5 h-5 animate-spin" weight="bold" />
                        Sending...
                      </>
                    ) : countdown > 0 ? (
                      <>
                        <Clock className="mr-2 w-5 h-5" weight="regular" />
                        Wait {countdown}s
                      </>
                    ) : (
                      <>
                        Send reset link
                        <ArrowRight className="ml-2 w-5 h-5" weight="bold" />
                      </>
                    )}
                  </Button>
                </form>

                {/* Security Tips */}
                <div className="mt-8 p-4 bg-[#FAFAFA] rounded-xl">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-[#6B7280] shrink-0 mt-0.5" weight="fill" />
                    <div className="text-sm text-[#6B7280]">
                      <p className="font-medium text-black mb-1">Security tip</p>
                      <p>Make sure you're on the official Rekberkan website before entering your email. We'll never ask for your password via email.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center"
              >
                <div className="w-20 h-20 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-emerald-600" weight="duotone" />
                </div>
                
                <h1 className="text-3xl font-bold mb-2 text-black">Check your email</h1>
                <p className="text-[#6B7280] mb-8">
                  We've sent a password reset link to
                </p>
                
                <div className="bg-[#F5F5F5] rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-center gap-3">
                    <Envelope className="w-5 h-5 text-[#6B7280]" weight="duotone" />
                    <span className="font-medium text-black">{email}</span>
                  </div>
                </div>

                <p className="text-sm text-[#6B7280] mb-6">
                  Didn't receive the email? Check your spam folder or try again.
                </p>

                <div className="space-y-3">
                  <Button 
                    onClick={handleResend}
                    variant="outline"
                    className="w-full h-12 border-[#E5E5E5]"
                    disabled={isLoading || countdown > 0}
                  >
                    {isLoading ? (
                      <>
                        <Spinner className="mr-2 w-5 h-5 animate-spin" weight="bold" />
                        Sending...
                      </>
                    ) : countdown > 0 ? (
                      <>
                        <Clock className="mr-2 w-5 h-5" weight="regular" />
                        Resend in {countdown}s
                      </>
                    ) : (
                      'Resend email'
                    )}
                  </Button>

                  <Button 
                    onClick={handleChangeEmail}
                    variant="ghost"
                    className="w-full h-12 text-[#6B7280] hover:text-black"
                  >
                    Try a different email
                  </Button>
                </div>

                {/* Email client shortcuts */}
                <div className="mt-8 pt-8 border-t border-[#E5E5E5]">
                  <p className="text-sm text-[#6B7280] mb-4">Open your email app</p>
                  <div className="flex justify-center gap-3">
                    <a 
                      href="https://mail.google.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-[#F5F5F5] rounded-lg text-sm font-medium text-black hover:bg-[#E5E5E5] transition-colors"
                    >
                      Gmail
                    </a>
                    <a 
                      href="https://outlook.live.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-[#F5F5F5] rounded-lg text-sm font-medium text-black hover:bg-[#E5E5E5] transition-colors"
                    >
                      Outlook
                    </a>
                    <a 
                      href="https://mail.yahoo.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-[#F5F5F5] rounded-lg text-sm font-medium text-black hover:bg-[#E5E5E5] transition-colors"
                    >
                      Yahoo
                    </a>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="mt-8 text-center">
            <Link href="/login" className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-black transition-colors">
              <ArrowLeft className="w-4 h-4" weight="bold" />
              Back to login
            </Link>
          </div>

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
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative z-10 text-center max-w-md"
        >
          <div className="w-32 h-32 mx-auto mb-8 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
            <Lock className="w-16 h-16 text-white" weight="duotone" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-white">
            Account Recovery
          </h2>
          <p className="text-white/70 mb-8">
            We take your security seriously. Password reset links expire after 1 hour for your protection.
          </p>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-left">
            <h3 className="text-white font-medium mb-4">What to expect:</h3>
            <ul className="space-y-3 text-white/70 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" weight="fill" />
                You'll receive an email within a few minutes
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" weight="fill" />
                Click the secure link to reset your password
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" weight="fill" />
                Create a new strong password
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" weight="fill" />
                Sign in with your new credentials
              </li>
            </ul>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-8 mt-8">
            <div className="flex items-center gap-2 text-white/40 text-sm">
              <ShieldCheck className="w-5 h-5" weight="fill" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-2 text-white/40 text-sm">
              <Clock className="w-5 h-5" weight="fill" />
              <span>1hr Expiry</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
