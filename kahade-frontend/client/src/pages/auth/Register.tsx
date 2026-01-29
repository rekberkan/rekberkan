/*
 * REKBERKAN REGISTER PAGE - Enhanced Professional Version
 * Brand color: #000000
 * Features: Multi-step registration, password strength, social signup, referral code
 */

import { useState, useEffect } from 'react';
import { Link, useLocation, useSearch } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Envelope, Lock, Eye, EyeSlash, ArrowRight, Spinner, User, Phone, 
  CheckCircle, WarningCircle, GoogleLogo, AppleLogo, GithubLogo, ArrowLeft,
  Gift, Lightning, Users, Wallet, Check, X, Info, Confetti
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

// Password strength checker
const checkPasswordStrength = (password: string): { score: number; feedback: string[]; passed: string[] } => {
  const feedback: string[] = [];
  const passed: string[] = [];
  let score = 0;

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
    description: 'Complete transactions in minutes, not days'
  },
  {
    icon: Users,
    title: 'Trusted Community',
    description: 'Join 50,000+ verified users'
  },
  {
    icon: Wallet,
    title: 'Low Fees',
    description: 'Starting from just 2.5% per transaction'
  }
];

const stats = [
  { value: 'Rp 10B+', label: 'Secured' },
  { value: '50K+', label: 'Users' },
  { value: '99.9%', label: 'Success' }
];

export default function Register() {
  const { register, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const [showPassword, setShowPassword] = useState(false);
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

  const getPasswordStrengthColor = () => {
    if (passwordStrength.score <= 2) return 'bg-red-500';
    if (passwordStrength.score <= 3) return 'bg-amber-500';
    if (passwordStrength.score <= 4) return 'bg-blue-500';
    return 'bg-emerald-500';
  };

  const getPasswordStrengthLabel = () => {
    if (passwordStrength.score <= 2) return 'Weak';
    if (passwordStrength.score <= 3) return 'Fair';
    if (passwordStrength.score <= 4) return 'Good';
    return 'Strong';
  };

  // Registration complete screen
  if (registrationComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <Confetti className="w-10 h-10 text-emerald-600" weight="duotone" />
          </div>
          <h1 className="text-3xl font-bold text-black mb-4">Welcome to Rekberkan!</h1>
          <p className="text-[#6B7280] mb-8">
            Your account has been created successfully. Please check your email to verify your account before logging in.
          </p>
          <div className="bg-[#F5F5F5] rounded-xl p-4 mb-8">
            <div className="flex items-center gap-3">
              <Envelope className="w-6 h-6 text-[#6B7280]" weight="duotone" />
              <div className="text-left">
                <div className="font-medium text-black">Verification email sent to</div>
                <div className="text-[#6B7280]">{formData.email}</div>
              </div>
            </div>
          </div>
          <Link href="/login">
            <Button className="w-full h-12 bg-black text-white hover:bg-black/90">
              Continue to Login
              <ArrowRight className="ml-2 w-5 h-5" weight="bold" />
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Visual */}
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

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/10"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Why join Rekberkan?</h2>
            
            <div className="space-y-5">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <benefit.icon className="w-5 h-5 text-white" weight="duotone" />
                  </div>
                  <div>
                    <div className="font-medium text-white">{benefit.title}</div>
                    <div className="text-sm text-white/60">{benefit.description}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Trust badges */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
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
      
      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12 xl:px-20">
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2 mb-8 group">
            <img src="/images/logo.svg" alt="Rekberkan" className="h-8 w-auto" />
          </Link>
          
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#6B7280]">Step {step} of 3</span>
              <span className="text-sm font-medium text-black">{Math.round((step / 3) * 100)}%</span>
            </div>
            <Progress value={(step / 3) * 100} className="h-2" />
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h1 className="text-3xl font-bold mb-2 text-black">Create your account</h1>
                <p className="text-[#6B7280] mb-8">
                  Start with your basic information
                </p>

                {/* Social Signup */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <Button 
                    type="button"
                    variant="outline" 
                    className="h-12 border-[#E5E5E5] hover:bg-[#F5F5F5]"
                    onClick={() => handleSocialSignup('Google')}
                  >
                    <GoogleLogo className="w-5 h-5" weight="bold" />
                  </Button>
                  <Button 
                    type="button"
                    variant="outline" 
                    className="h-12 border-[#E5E5E5] hover:bg-[#F5F5F5]"
                    onClick={() => handleSocialSignup('Apple')}
                  >
                    <AppleLogo className="w-5 h-5" weight="fill" />
                  </Button>
                  <Button 
                    type="button"
                    variant="outline" 
                    className="h-12 border-[#E5E5E5] hover:bg-[#F5F5F5]"
                    onClick={() => handleSocialSignup('GitHub')}
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

                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-black font-medium">Username</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" weight="regular" />
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => handleChange('username', e.target.value)}
                        onBlur={() => handleBlur('username')}
                        placeholder="johndoe"
                        className={`pl-10 bg-white border-[#E5E5E5] focus:border-black focus:ring-black h-12 ${errors.username && touched.username ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.username && touched.username ? (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <X className="w-4 h-4" weight="bold" />
                        {errors.username}
                      </p>
                    ) : (
                      <p className="text-xs text-[#9CA3AF]">3-30 characters, letters, numbers, underscores</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-black font-medium">Email address</Label>
                    <div className="relative">
                      <Envelope className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" weight="regular" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        onBlur={() => handleBlur('email')}
                        placeholder="you@example.com"
                        className={`pl-10 bg-white border-[#E5E5E5] focus:border-black focus:ring-black h-12 ${errors.email && touched.email ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.email && touched.email && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <X className="w-4 h-4" weight="bold" />
                        {errors.email}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-black font-medium">
                      Phone number <span className="text-[#9CA3AF] font-normal">(optional)</span>
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" weight="regular" />
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        onBlur={() => handleBlur('phone')}
                        placeholder="+62 812 3456 7890"
                        className={`pl-10 bg-white border-[#E5E5E5] focus:border-black focus:ring-black h-12 ${errors.phone && touched.phone ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.phone && touched.phone && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <X className="w-4 h-4" weight="bold" />
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  <Button 
                    type="button"
                    onClick={handleNextStep}
                    className="w-full h-12 bg-black text-white hover:bg-black/90 font-medium"
                  >
                    Continue
                    <ArrowRight className="ml-2 w-5 h-5" weight="bold" />
                  </Button>
                </div>
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
                  className="flex items-center gap-2 text-[#6B7280] hover:text-black mb-6 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" weight="bold" />
                  Back
                </button>

                <h1 className="text-3xl font-bold mb-2 text-black">Create a password</h1>
                <p className="text-[#6B7280] mb-8">
                  Choose a strong password to protect your account
                </p>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-black font-medium">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" weight="regular" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleChange('password', e.target.value)}
                        onBlur={() => handleBlur('password')}
                        placeholder="••••••••"
                        className={`pl-10 pr-10 bg-white border-[#E5E5E5] focus:border-black focus:ring-black h-12 ${errors.password && touched.password ? 'border-red-500' : ''}`}
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

                  {/* Password strength indicator */}
                  {formData.password && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1 flex-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={`h-1.5 flex-1 rounded-full transition-colors ${
                                level <= passwordStrength.score ? getPasswordStrengthColor() : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className={`ml-3 text-sm font-medium ${
                          passwordStrength.score <= 2 ? 'text-red-500' :
                          passwordStrength.score <= 3 ? 'text-amber-500' :
                          passwordStrength.score <= 4 ? 'text-blue-500' : 'text-emerald-500'
                        }`}>
                          {getPasswordStrengthLabel()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {['At least 8 characters', 'Uppercase letter', 'Lowercase letter', 'Number', 'Special character'].map((req) => {
                          const isPassed = passwordStrength.passed.includes(req);
                          return (
                            <div key={req} className={`flex items-center gap-2 text-xs ${isPassed ? 'text-emerald-600' : 'text-[#9CA3AF]'}`}>
                              {isPassed ? <Check className="w-3 h-3" weight="bold" /> : <X className="w-3 h-3" weight="bold" />}
                              {req}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-black font-medium">Confirm password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" weight="regular" />
                      <Input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => handleChange('confirmPassword', e.target.value)}
                        onBlur={() => handleBlur('confirmPassword')}
                        placeholder="••••••••"
                        className={`pl-10 bg-white border-[#E5E5E5] focus:border-black focus:ring-black h-12 ${errors.confirmPassword && touched.confirmPassword ? 'border-red-500' : ''}`}
                      />
                      {formData.confirmPassword && formData.password === formData.confirmPassword && (
                        <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" weight="bold" />
                      )}
                    </div>
                    {errors.confirmPassword && touched.confirmPassword && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <X className="w-4 h-4" weight="bold" />
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>

                  <Button 
                    type="button"
                    onClick={handleNextStep}
                    className="w-full h-12 bg-black text-white hover:bg-black/90 font-medium"
                    disabled={passwordStrength.score < 5 || formData.password !== formData.confirmPassword}
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
                  className="flex items-center gap-2 text-[#6B7280] hover:text-black mb-6 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" weight="bold" />
                  Back
                </button>

                <h1 className="text-3xl font-bold mb-2 text-black">Almost there!</h1>
                <p className="text-[#6B7280] mb-8">
                  Review your information and complete registration
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Summary */}
                  <div className="bg-[#F5F5F5] rounded-xl p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Username</span>
                      <span className="font-medium text-black">{formData.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Email</span>
                      <span className="font-medium text-black">{formData.email}</span>
                    </div>
                    {formData.phone && (
                      <div className="flex justify-between">
                        <span className="text-[#6B7280]">Phone</span>
                        <span className="font-medium text-black">{formData.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Referral Code */}
                  <div className="space-y-2">
                    <Label htmlFor="referralCode" className="text-black font-medium">
                      Referral code <span className="text-[#9CA3AF] font-normal">(optional)</span>
                    </Label>
                    <div className="relative">
                      <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" weight="regular" />
                      <Input
                        id="referralCode"
                        value={formData.referralCode}
                        onChange={(e) => handleChange('referralCode', e.target.value.toUpperCase())}
                        placeholder="Enter referral code"
                        className="pl-10 bg-white border-[#E5E5E5] focus:border-black focus:ring-black h-12 uppercase"
                      />
                    </div>
                    {formData.referralCode && (
                      <p className="text-sm text-emerald-600 flex items-center gap-1">
                        <Gift className="w-4 h-4" weight="fill" />
                        You'll receive a bonus after your first transaction!
                      </p>
                    )}
                  </div>
                  
                  {/* Terms */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="agreeTerms"
                        checked={formData.agreeTerms}
                        onCheckedChange={(checked) => handleChange('agreeTerms', checked as boolean)}
                        className="mt-1 border-[#E5E5E5] data-[state=checked]:bg-black data-[state=checked]:border-black"
                      />
                      <Label htmlFor="agreeTerms" className="text-sm cursor-pointer leading-relaxed text-[#6B7280]">
                        I agree to the{' '}
                        <Link href="/terms" className="text-black hover:underline font-medium">
                          Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link href="/privacy" className="text-black hover:underline font-medium">
                          Privacy Policy
                        </Link>
                      </Label>
                    </div>

                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="agreeMarketing"
                        checked={formData.agreeMarketing}
                        onCheckedChange={(checked) => handleChange('agreeMarketing', checked as boolean)}
                        className="mt-1 border-[#E5E5E5] data-[state=checked]:bg-black data-[state=checked]:border-black"
                      />
                      <Label htmlFor="agreeMarketing" className="text-sm cursor-pointer leading-relaxed text-[#6B7280]">
                        Send me updates about new features and promotions
                      </Label>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-black text-white hover:bg-black/90 font-medium"
                    disabled={isLoading || !formData.agreeTerms}
                  >
                    {isLoading ? (
                      <>
                        <Spinner className="mr-2 w-5 h-5 animate-spin" weight="bold" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create account
                        <ArrowRight className="ml-2 w-5 h-5" weight="bold" />
                      </>
                    )}
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
          
          <p className="mt-8 text-center text-sm text-[#6B7280]">
            Already have an account?{' '}
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
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4" weight="fill" />
                <span>Secure</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
