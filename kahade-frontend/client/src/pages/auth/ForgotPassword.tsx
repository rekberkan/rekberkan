/*
 * KAHADE FORGOT PASSWORD PAGE - Modern Design
 * Brand color: #000000
 */

import { useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Envelope, ArrowLeft, Spinner, CheckCircle } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);
    
    try {
      await authApi.forgotPassword(email);
      setIsSubmitted(true);
      toast.success('Email sent!', {
        description: 'Please check your inbox for the reset link.'
      });
    } catch (error: any) {
      // Always show success message to prevent email enumeration attacks
      // But log the actual error for debugging
      console.error('Forgot password error:', error);
      
      // Check if it's a rate limit error
      if (error.response?.status === 429) {
        toast.error('Too many requests', {
          description: 'Please wait a few minutes before trying again.'
        });
      } else {
        // For security, always show success even if email doesn't exist
        setIsSubmitted(true);
        toast.success('Email sent!', {
          description: 'If an account exists with this email, you will receive a reset link.'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    
    try {
      await authApi.forgotPassword(email);
      toast.success('Email resent!', {
        description: 'Please check your inbox for the reset link.'
      });
    } catch (error: any) {
      if (error.response?.status === 429) {
        toast.error('Too many requests', {
          description: 'Please wait a few minutes before trying again.'
        });
      } else {
        toast.success('Email resent!', {
          description: 'If an account exists with this email, you will receive a reset link.'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-white">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, black 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mb-8 justify-center">
          <img src="/images/logo.svg" alt="Kahade" className="h-8 w-auto" />
        </Link>
        
        <div className="bg-white rounded-2xl border border-[#E5E5E5] p-8 shadow-sm">
          {!isSubmitted ? (
            <>
              <h1 className="text-2xl font-bold mb-2 text-center text-black">
                Forgot Password?
              </h1>
              <p className="text-[#6B7280] mb-8 text-center text-sm">
                Enter your email and we'll send you a link to reset your password.
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-black">Email</Label>
                  <div className="relative">
                    <Envelope className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" weight="regular" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      required
                      className="pl-10 bg-white border-[#E5E5E5] focus:border-black focus:ring-black h-12"
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="btn-primary w-full h-12"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Spinner className="mr-2 w-4 h-4 animate-spin" weight="bold" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" weight="fill" />
              </div>
              <h2 className="text-xl font-bold mb-2 text-black">Email Sent!</h2>
              <p className="text-[#6B7280] text-sm mb-6">
                We have sent a password reset link to <strong className="text-black">{email}</strong>. 
                Please check your inbox.
              </p>
              <Button 
                className="btn-secondary w-full"
                onClick={handleResend}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Spinner className="mr-2 w-4 h-4 animate-spin" weight="bold" />
                    Sending...
                  </>
                ) : (
                  'Resend Email'
                )}
              </Button>
            </div>
          )}
          
          <div className="mt-6 text-center">
            <Link href="/login" className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-black transition-colors">
              <ArrowLeft className="w-4 h-4" weight="bold" />
              Back to Login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
