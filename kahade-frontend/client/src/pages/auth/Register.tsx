/*
 * REKBERKAN REGISTER PAGE - EXCLUSIVE EDITION
 * 
 * Design Philosophy:
 * - Split-screen premium layout
 * - Multi-step registration flow
 * - Clean, focused form design
 * - Trust-building elements
 */

import { useState, useEffect } from 'react';
import { Link, useLocation, useSearch } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Envelope, Lock, Eye, EyeSlash, ArrowRight, Spinner, User, Phone, 
  CheckCircle, WarningCircle, GoogleLogo, AppleLogo, GithubLogo, ArrowLeft,
  Gift, Lightning, Users, Wallet, Check, X, Confetti
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Password strength checker
 * 
 * SECURITY FIX [M-03]: Synchronized with backend validation requirements
 * Backend requires: 8+ characters, uppercase, lowercase, number, special character
 * See: kahade-backend/src/core/auth/auth.service.ts - validatePasswordStrength()
 */
const checkPasswordStrength = (password: string): { score: number; feedback: string[]; passed: string[] } => {
  const feedback: string[] = [];
  const passed: string[] = [];
  let score = 0;

  // SECURITY FIX [M-03]: Minimum 8 characters (synced with backend)
  if (password.length >= 8) {
    score += 1;
    passed.push('At least 8 characters');
  } else {
    feedback.push('At least 8 characters');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
    passed.push('Uppercase letter');
  } else {
    feedback.push('Uppercase letter');
  }

  if (/[a-z]/.test(password)) {
    score += 1;
    passed.push('Lowercase letter');
  } else {
    feedback.push('Lowercase letter');
  }

  if (/[0-9]/.test(password)) {
    score += 1;
    passed.push('Number');
  } else {
    feedback.push('Number');
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
    passed.push('Special character');
  } else {
    feedback.push('Special character');
  }

  return { score, feedback, passed };
};

// Error code to user-friendly message mapping
const getErrorMessage = (error: any): { title: string; description: string } => {
  const code = error.response?.data?.code;
  const message = error.response?.data?.message;
  const errors = error.response?.data?.errors;
  const status = error.response?.status;

  if (errors && Array.isArray(errors)) {
    return {
      title: 'Validation Error',
      description: errors.join('. ')
    };
  }

  switch (code) {
    case 'WEAK_PASSWORD':
      return {
        title: 'Password Too Weak',
        description: error.response?.data?.errors?.join('. ') || 'Please choose a stronger password.'
      };
    
    case 'EMAIL_EXISTS':
    case 'DUPLICATE_EMAIL':
      return {
        title: 'Email Already Registered',
        description: 'This email is already associated with an account. Try logging in instead.'
      };
    
    case 'USERNAME_EXISTS':
    case 'DUPLICATE_USERNAME':
      return {
        title: 'Username Taken',
        description: 'This username is already in use. Please choose a different one.'
      };
    
    case 'INVALID_PHONE':
      return {
        title: 'Invalid Phone Number',
        description: 'Please enter a valid phone number (e.g., +628123456789).'
      };
    
    case 'INVALID_REFERRAL':
      return {
        title: 'Invalid Referral Code',
        description: 'The referral code you entered is invalid or has expired.'
      };
    
    default:
      break;
  }

  switch (status) {
    case 400:
      if (message?.toLowerCase().includes('email')) {
        return {
          title: 'Email Already Registered',
          description: 'This email is already associated with an account.'
        };
      }
      if (message?.toLowerCase().includes('username')) {
        return {
          title: 'Invalid Username',
          description: message || 'Username must be 3-30 characters with letters, numbers, and underscores.'
        };
      }
      return {
        title: 'Invalid Input',
        description: message || 'Please check your information and try again.'
      };
    
    case 409:
      return {
        title: 'Account Already Exists',
        description: 'An account with this email or username already exists.'
      };
    
    case 429:
      return {
        title: 'Too Many Requests',
        description: 'Please wait a few minutes before trying again.'
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
          description: 'Unable to connect to the server. Please check your internet connection.'
        };
      }
      
      return {
        title: 'Registration Failed',
        description: message || 'An unexpected error occurred. Please try again.'
      };
  }
};

const benefits = [
  {
    icon: ShieldCheck,
    title: 'Secure Escrow',
    description: 'Funds held safely until transaction complete'
  },
  {
    icon: Lightning,
    title: 'Fast Transactions',
    description: 'Complete transactions in minutes'
  },
  {
    icon: Users,
    title: 'Trusted Community',
    description: 'Join 10,000+ verified users'
  },
  {
    icon: Wallet,
    title: 'Low Fees',
    description: 'Starting from just 2.5%'
  }
];

const stats = [
  { value: 'Rp 50M+', label: 'Total Secured' },
  { value: '10K+', label: 'Active Users' },
  { value: '99.9%', label: 'Success Rate' }
];

export default function Register() {
  const { register, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
    agreeTerms: false,
    agreeMarketing: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Check for referral code in URL
  useEffect(() => {
    const params = new URLSearchParams(search);
    const ref = params.get('ref');
    if (ref) {
      setFormData(prev => ({ ...prev, referralCode: ref }));
    }
  }, [search]);

  const passwordStrength = checkPasswordStrength(formData.password);

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'username':
        if (!value) return 'Username is required';
        if (value.length < 3) return 'Username must be at least 3 characters';
        if (value.length > 30) return 'Username must be less than 30 characters';
        if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(value)) return 'Must start with letter, only letters, numbers, underscores';
        return '';
      case 'email':
        if (!value) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
        return '';
      case 'phone':
        if (value && !/^\+?[0-9]{10,20}$/.test(value.replace(/\s/g, ''))) return 'Please enter a valid phone number';
        return '';
      case 'password':
        if (!value) return 'Password is required';
        if (passwordStrength.score < 5) return 'Password does not meet requirements';
        return '';
      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== formData.password) return 'Passwords do not match';
        return '';
      default:
        return '';
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field as keyof typeof formData] as string);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const error = validateField(field, value as string);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const validateStep = (stepNum: number): boolean => {
    if (stepNum === 1) {
      const usernameError = validateField('username', formData.username);
      const emailError = validateField('email', formData.email);
      const phoneError = validateField('phone', formData.phone);
      
      setErrors({ username: usernameError, email: emailError, phone: phoneError });
      setTouched({ username: true, email: true, phone: true });
      
      return !usernameError && !emailError && !phoneError;
    }
    
    if (stepNum === 2) {
      const passwordError = validateField('password', formData.password);
      const confirmError = validateField('confirmPassword', formData.confirmPassword);
      
      setErrors(prev => ({ ...prev, password: passwordError, confirmPassword: confirmError }));
      setTouched(prev => ({ ...prev, password: true, confirmPassword: true }));
      
      return !passwordError && !confirmError;
    }
    
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.agreeTerms) {
      toast.error('Terms Required', {
        description: 'You must agree to the Terms & Conditions to create an account.'
      });
      return;
    }
    
    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined
      });
      setRegistrationComplete(true);
    } catch (error: any) {
      const { title, description } = getErrorMessage(error);
      toast.error(title, { description });
    }
  };

  const handleSocialSignup = (provider: string) => {
    toast.info(`${provider} signup coming soon`, {
      description: 'Social signup will be available in a future update.'
    });
  };

  const getStrengthColor = () => {
    if (passwordStrength.score <= 2) return 'bg-red-500';
    if (passwordStrength.score <= 3) return 'bg-orange-500';
    if (passwordStrength.score <= 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthLabel = () => {
    if (passwordStrength.score <= 2) return 'Weak';
    if (passwordStrength.score <= 3) return 'Fair';
    if (passwordStrength.score <= 4) return 'Good';
    return 'Strong';
  };

  // Registration Complete Screen
  if (registrationComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-24 h-24 rounded-3xl bg-green-100 flex items-center justify-center mx-auto mb-8"
          >
            <CheckCircle className="w-12 h-12 text-green-600" weight="fill" />
          </motion.div>
          
          <h1 className="text-3xl font-bold mb-4 text-[#0A0A0A]">Welcome to Rekberkan!</h1>
          <p className="text-[#737373] mb-8">
            Your account has been created successfully. Please check your email to verify your account.
          </p>
          
          <div className="space-y-3">
            <Link href="/login">
              <Button className="btn-primary w-full">
                Continue to Login
                <ArrowRight className="ml-2 w-5 h-5" weight="bold" />
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" className="w-full text-[#737373]">
                Back to Home
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

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
              Start securing your transactions today
            </h1>
            <p className="text-white/60 text-lg leading-relaxed mb-10">
              Create your free account and join thousands of users who trust Rekberkan.
            </p>
            
            {/* Benefits */}
            <div className="grid grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                  className="p-4 rounded-xl bg-white/5 border border-white/10"
                >
                  <benefit.icon className="w-6 h-6 mb-2" weight="bold" />
                  <div className="font-semibold text-sm">{benefit.title}</div>
                  <div className="text-xs text-white/50">{benefit.description}</div>
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
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12 xl:px-20 bg-white overflow-y-auto">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Logo */}
          <Link href="/" className="lg:hidden inline-flex items-center gap-2 mb-8">
            <img src="/images/logo.svg" alt="Rekberkan" className="h-8 w-auto" />
          </Link>
          
          {/* Progress Steps */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step >= s 
                    ? 'bg-[#0A0A0A] text-white' 
                    : 'bg-[#F5F5F5] text-[#A3A3A3]'
                }`}>
                  {step > s ? <Check className="w-4 h-4" weight="bold" /> : s}
                </div>
                {s < 3 && (
                  <div className={`flex-1 h-1 rounded-full transition-all ${
                    step > s ? 'bg-[#0A0A0A]' : 'bg-[#E8E8E8]'
                  }`} />
                )}
              </div>
            ))}
          </div>
          
          <AnimatePresence mode="wait">
            {/* Step 1: Account Info */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h1 className="text-3xl xl:text-4xl font-bold mb-3 text-[#0A0A0A]">Create your account</h1>
                <p className="text-[#737373] mb-8">
                  Enter your details to get started with Rekberkan
                </p>
                
                {/* Social Signup */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                  <button 
                    type="button"
                    className="h-12 border-2 border-[#E8E8E8] rounded-xl flex items-center justify-center hover:border-[#0A0A0A] hover:bg-[#F5F5F5] transition-all"
                    onClick={() => handleSocialSignup('Google')}
                  >
                    <GoogleLogo className="w-5 h-5" weight="bold" />
                  </button>
                  <button 
                    type="button"
                    className="h-12 border-2 border-[#E8E8E8] rounded-xl flex items-center justify-center hover:border-[#0A0A0A] hover:bg-[#F5F5F5] transition-all"
                    onClick={() => handleSocialSignup('Apple')}
                  >
                    <AppleLogo className="w-5 h-5" weight="fill" />
                  </button>
                  <button 
                    type="button"
                    className="h-12 border-2 border-[#E8E8E8] rounded-xl flex items-center justify-center hover:border-[#0A0A0A] hover:bg-[#F5F5F5] transition-all"
                    onClick={() => handleSocialSignup('GitHub')}
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
                
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-[#0A0A0A] font-semibold">Username</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A3A3A3]" />
                      <Input
                        id="username"
                        type="text"
                        placeholder="johndoe"
                        value={formData.username}
                        onChange={(e) => handleChange('username', e.target.value)}
                        onBlur={() => handleBlur('username')}
                        className={`pl-12 h-12 bg-[#F8F8F8] border-2 border-transparent rounded-xl focus:bg-white focus:border-[#0A0A0A] transition-all ${
                          errors.username && touched.username ? 'border-red-500 bg-red-50' : ''
                        }`}
                      />
                    </div>
                    {errors.username && touched.username && (
                      <p className="text-sm text-red-500 flex items-center gap-1.5">
                        <WarningCircle className="w-4 h-4" weight="fill" />
                        {errors.username}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[#0A0A0A] font-semibold">Email address</Label>
                    <div className="relative">
                      <Envelope className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A3A3A3]" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        onBlur={() => handleBlur('email')}
                        className={`pl-12 h-12 bg-[#F8F8F8] border-2 border-transparent rounded-xl focus:bg-white focus:border-[#0A0A0A] transition-all ${
                          errors.email && touched.email ? 'border-red-500 bg-red-50' : ''
                        }`}
                      />
                    </div>
                    {errors.email && touched.email && (
                      <p className="text-sm text-red-500 flex items-center gap-1.5">
                        <WarningCircle className="w-4 h-4" weight="fill" />
                        {errors.email}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-[#0A0A0A] font-semibold">
                      Phone number <span className="text-[#A3A3A3] font-normal">(optional)</span>
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A3A3A3]" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+628123456789"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        onBlur={() => handleBlur('phone')}
                        className={`pl-12 h-12 bg-[#F8F8F8] border-2 border-transparent rounded-xl focus:bg-white focus:border-[#0A0A0A] transition-all ${
                          errors.phone && touched.phone ? 'border-red-500 bg-red-50' : ''
                        }`}
                      />
                    </div>
                    {errors.phone && touched.phone && (
                      <p className="text-sm text-red-500 flex items-center gap-1.5">
                        <WarningCircle className="w-4 h-4" weight="fill" />
                        {errors.phone}
                      </p>
                    )}
                  </div>
                  
                  <Button 
                    type="button"
                    onClick={handleNextStep}
                    className="btn-primary w-full h-12"
                  >
                    Continue
                    <ArrowRight className="ml-2 w-5 h-5" weight="bold" />
                  </Button>
                </div>
                
                <p className="mt-8 text-center text-[#737373]">
                  Already have an account?{' '}
                  <Link href="/login" className="font-semibold text-[#0A0A0A] hover:underline">
                    Sign in
                  </Link>
                </p>
              </motion.div>
            )}
            
            {/* Step 2: Password */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-[#737373] hover:text-[#0A0A0A] mb-6 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" weight="bold" />
                  Back
                </button>
                
                <h1 className="text-3xl xl:text-4xl font-bold mb-3 text-[#0A0A0A]">Create password</h1>
                <p className="text-[#737373] mb-8">
                  Choose a strong password to secure your account
                </p>
                
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-[#0A0A0A] font-semibold">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A3A3A3]" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a strong password"
                        value={formData.password}
                        onChange={(e) => handleChange('password', e.target.value)}
                        onBlur={() => handleBlur('password')}
                        className={`pl-12 pr-12 h-12 bg-[#F8F8F8] border-2 border-transparent rounded-xl focus:bg-white focus:border-[#0A0A0A] transition-all ${
                          errors.password && touched.password ? 'border-red-500 bg-red-50' : ''
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
                    
                    {/* Password Strength */}
                    {formData.password && (
                      <div className="space-y-3 mt-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-[#E8E8E8] rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all ${getStrengthColor()}`}
                              style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                            />
                          </div>
                          <span className={`text-sm font-medium ${
                            passwordStrength.score <= 2 ? 'text-red-500' :
                            passwordStrength.score <= 3 ? 'text-orange-500' :
                            passwordStrength.score <= 4 ? 'text-yellow-600' : 'text-green-500'
                          }`}>
                            {getStrengthLabel()}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {[...passwordStrength.passed, ...passwordStrength.feedback].map((item, i) => (
                            <div 
                              key={item}
                              className={`flex items-center gap-2 text-xs ${
                                passwordStrength.passed.includes(item) ? 'text-green-600' : 'text-[#A3A3A3]'
                              }`}
                            >
                              {passwordStrength.passed.includes(item) ? (
                                <Check className="w-3.5 h-3.5" weight="bold" />
                              ) : (
                                <X className="w-3.5 h-3.5" />
                              )}
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-[#0A0A0A] font-semibold">Confirm password</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A3A3A3]" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleChange('confirmPassword', e.target.value)}
                        onBlur={() => handleBlur('confirmPassword')}
                        className={`pl-12 pr-12 h-12 bg-[#F8F8F8] border-2 border-transparent rounded-xl focus:bg-white focus:border-[#0A0A0A] transition-all ${
                          errors.confirmPassword && touched.confirmPassword ? 'border-red-500 bg-red-50' : ''
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A3A3A3] hover:text-[#0A0A0A] transition-colors"
                      >
                        {showConfirmPassword ? <EyeSlash className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && touched.confirmPassword && (
                      <p className="text-sm text-red-500 flex items-center gap-1.5">
                        <WarningCircle className="w-4 h-4" weight="fill" />
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                  
                  <Button 
                    type="button"
                    onClick={handleNextStep}
                    className="btn-primary w-full h-12"
                  >
                    Continue
                    <ArrowRight className="ml-2 w-5 h-5" weight="bold" />
                  </Button>
                </div>
              </motion.div>
            )}
            
            {/* Step 3: Final */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 text-[#737373] hover:text-[#0A0A0A] mb-6 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" weight="bold" />
                  Back
                </button>
                
                <h1 className="text-3xl xl:text-4xl font-bold mb-3 text-[#0A0A0A]">Almost there!</h1>
                <p className="text-[#737373] mb-8">
                  Review your information and agree to our terms
                </p>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Summary */}
                  <div className="p-5 rounded-xl bg-[#F8F8F8] space-y-3">
                    <div className="flex justify-between">
                      <span className="text-[#737373]">Username</span>
                      <span className="font-medium text-[#0A0A0A]">{formData.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#737373]">Email</span>
                      <span className="font-medium text-[#0A0A0A]">{formData.email}</span>
                    </div>
                    {formData.phone && (
                      <div className="flex justify-between">
                        <span className="text-[#737373]">Phone</span>
                        <span className="font-medium text-[#0A0A0A]">{formData.phone}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Referral Code */}
                  <div className="space-y-2">
                    <Label htmlFor="referralCode" className="text-[#0A0A0A] font-semibold">
                      Referral code <span className="text-[#A3A3A3] font-normal">(optional)</span>
                    </Label>
                    <div className="relative">
                      <Gift className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A3A3A3]" />
                      <Input
                        id="referralCode"
                        type="text"
                        placeholder="Enter referral code"
                        value={formData.referralCode}
                        onChange={(e) => handleChange('referralCode', e.target.value.toUpperCase())}
                        className="pl-12 h-12 bg-[#F8F8F8] border-2 border-transparent rounded-xl focus:bg-white focus:border-[#0A0A0A] transition-all uppercase"
                      />
                    </div>
                  </div>
                  
                  {/* Terms */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="agreeTerms"
                        checked={formData.agreeTerms}
                        onCheckedChange={(checked) => handleChange('agreeTerms', checked as boolean)}
                        className="mt-0.5 border-2 border-[#E8E8E8] data-[state=checked]:bg-[#0A0A0A] data-[state=checked]:border-[#0A0A0A]"
                      />
                      <Label htmlFor="agreeTerms" className="text-sm text-[#737373] cursor-pointer leading-relaxed">
                        I agree to the{' '}
                        <Link href="/terms" className="text-[#0A0A0A] hover:underline">Terms of Service</Link>
                        {' '}and{' '}
                        <Link href="/privacy" className="text-[#0A0A0A] hover:underline">Privacy Policy</Link>
                      </Label>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="agreeMarketing"
                        checked={formData.agreeMarketing}
                        onCheckedChange={(checked) => handleChange('agreeMarketing', checked as boolean)}
                        className="mt-0.5 border-2 border-[#E8E8E8] data-[state=checked]:bg-[#0A0A0A] data-[state=checked]:border-[#0A0A0A]"
                      />
                      <Label htmlFor="agreeMarketing" className="text-sm text-[#737373] cursor-pointer leading-relaxed">
                        I want to receive product updates and marketing communications
                      </Label>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit"
                    className="btn-primary w-full h-12"
                    disabled={isLoading || !formData.agreeTerms}
                  >
                    {isLoading ? (
                      <>
                        <Spinner className="w-5 h-5 animate-spin mr-2" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="ml-2 w-5 h-5" weight="bold" />
                      </>
                    )}
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
