/*
 * REKBERKAN RESET PASSWORD PAGE - Professional Version
 * Brand color: #000000
 * Features: Token validation, password strength, success confirmation
 */

import { useState, useEffect } from 'react';
import { Link, useLocation, useSearch } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, Eye, EyeSlash, ArrowRight, Spinner, ShieldCheck, 
  CheckCircle, Warning, X, Check, Key, ArrowLeft
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';

// Password strength checker
const checkPasswordStrength = (password: string): { score: number; feedback: string[]; passed: string[] } => {
  const feedback: string[] = [];
  const passed: string[] = [];
  let score = 0;

  if (password.length >= 8) { score += 1; passed.push('8+ characters'); } else { feedback.push('8+ characters'); }
  if (/[A-Z]/.test(password)) { score += 1; passed.push('Uppercase'); } else { feedback.push('Uppercase'); }
  if (/[a-z]/.test(password)) { score += 1; passed.push('Lowercase'); } else { feedback.push('Lowercase'); }
  if (/[0-9]/.test(password)) { score += 1; passed.push('Number'); } else { feedback.push('Number'); }
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) { score += 1; passed.push('Special char'); } else { feedback.push('Special char'); }

  return { score, feedback, passed };
};

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const [token, setToken] = useState('');
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  const passwordStrength = checkPasswordStrength(formData.password);

  useEffect(() => {
    const params = new URLSearchParams(search);
    const tokenParam = params.get('token');
    
    if (tokenParam) {
      setToken(tokenParam);
      validateToken(tokenParam);
    } else {
      setIsValidating(false);
      setIsTokenValid(false);
    }
  }, [search]);

  const validateToken = async (tokenValue: string) => {
    try {
      await authApi.validateResetToken(tokenValue);
      setIsTokenValid(true);
    } catch (error) {
      setIsTokenValid(false);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const newErrors: { password?: string; confirmPassword?: string } = {};
    
    if (passwordStrength.score < 5) {
      newErrors.password = 'Password does not meet requirements';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.resetPassword({
        token,
        password: formData.password
      });
      setIsSuccess(true);
      toast.success('Password reset successful!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength.score <= 2) return 'bg-red-500';
    if (passwordStrength.score <= 3) return 'bg-amber-500';
    if (passwordStrength.score <= 4) return 'bg-blue-500';
    return 'bg-emerald-500';
  };

  // Loading state
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Spinner className="w-10 h-10 animate-spin text-black mx-auto mb-4" weight="bold" />
          <p className="text-[#6B7280]">Validating reset link...</p>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!isTokenValid && !isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <Warning className="w-10 h-10 text-red-600" weight="duotone" />
          </div>
          <h1 className="text-3xl font-bold text-black mb-4">Invalid or Expired Link</h1>
          <p className="text-[#6B7280] mb-8">
            This password reset link is invalid or has expired. Please request a new password reset link.
          </p>
          <div className="space-y-3">
            <Link href="/forgot-password">
              <Button className="w-full h-12 bg-black text-white hover:bg-black/90">
                Request New Link
                <ArrowRight className="ml-2 w-5 h-5" weight="bold" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="w-full h-12 border-[#E5E5E5]">
                <ArrowLeft className="mr-2 w-5 h-5" weight="bold" />
                Back to Login
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" weight="duotone" />
          </div>
          <h1 className="text-3xl font-bold text-black mb-4">Password Reset Complete</h1>
          <p className="text-[#6B7280] mb-8">
            Your password has been successfully reset. You can now sign in with your new password.
          </p>
          <Link href="/login">
            <Button className="w-full h-12 bg-black text-white hover:bg-black/90">
              Sign In
              <ArrowRight className="ml-2 w-5 h-5" weight="bold" />
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12 xl:px-20">
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2 mb-8 group">
            <img src="/images/logo.svg" alt="Rekberkan" className="h-8 w-auto" />
          </Link>

          <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center mb-6">
            <Key className="w-8 h-8 text-white" weight="duotone" />
          </div>
          
          <h1 className="text-3xl font-bold mb-2 text-black">Create new password</h1>
          <p className="text-[#6B7280] mb-8">
            Your new password must be different from previously used passwords
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-black font-medium">New Password</Label>
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
                  placeholder="Enter new password"
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

            {/* Password strength indicator */}
            {formData.password && (
              <div className="space-y-3">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        level <= passwordStrength.score ? getPasswordStrengthColor() : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {['8+ characters', 'Uppercase', 'Lowercase', 'Number', 'Special char'].map((req) => {
                    const isPassed = passwordStrength.passed.includes(req);
                    return (
                      <span key={req} className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${isPassed ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                        {isPassed ? <Check className="w-3 h-3" weight="bold" /> : <X className="w-3 h-3" weight="bold" />}
                        {req}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-black font-medium">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" weight="regular" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData({ ...formData, confirmPassword: e.target.value });
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                  }}
                  placeholder="Confirm new password"
                  className={`pl-10 bg-white border-[#E5E5E5] focus:border-black focus:ring-black h-12 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                />
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" weight="bold" />
                )}
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <Warning className="w-4 h-4" weight="fill" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 bg-black text-white hover:bg-black/90 font-medium"
              disabled={isSubmitting || passwordStrength.score < 5 || formData.password !== formData.confirmPassword}
            >
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2 w-5 h-5 animate-spin" weight="bold" />
                  Resetting password...
                </>
              ) : (
                <>
                  Reset Password
                  <ArrowRight className="ml-2 w-5 h-5" weight="bold" />
                </>
              )}
            </Button>
          </form>
          
          <p className="mt-8 text-center text-sm text-[#6B7280]">
            Remember your password?{' '}
            <Link href="/login" className="text-black hover:underline font-semibold">
              Sign in
            </Link>
          </p>

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
            <ShieldCheck className="w-16 h-16 text-white" weight="duotone" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-white">
            Secure Password Reset
          </h2>
          <p className="text-white/70 mb-8">
            Your security is our priority. Create a strong password to protect your account.
          </p>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-left">
            <h3 className="text-white font-medium mb-4">Password Tips:</h3>
            <ul className="space-y-3 text-white/70 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" weight="fill" />
                Use a unique password for each account
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" weight="fill" />
                Mix uppercase, lowercase, numbers, and symbols
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" weight="fill" />
                Avoid personal information like birthdays
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" weight="fill" />
                Consider using a password manager
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
