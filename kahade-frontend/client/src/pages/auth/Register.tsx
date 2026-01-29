/*
 * KAHADE REGISTER PAGE - Modern Design
 * Brand color: #000000
 */

import { useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { ShieldCheck, Envelope, Lock, Eye, EyeSlash, ArrowRight, Spinner, User, Phone, CheckCircle, WarningCircle } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

// Password strength checker
const checkPasswordStrength = (password: string): { score: number; feedback: string[] } => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('At least 8 characters');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('At least one uppercase letter');
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('At least one lowercase letter');
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('At least one number');
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push('At least one special character (!@#$%^&*...)');
  }

  return { score, feedback };
};

// Error code to user-friendly message mapping
const getErrorMessage = (error: any): { title: string; description: string } => {
  const code = error.response?.data?.code;
  const message = error.response?.data?.message;
  const errors = error.response?.data?.errors;
  const status = error.response?.status;

  // Handle validation errors from backend
  if (errors && Array.isArray(errors)) {
    return {
      title: 'Validation Error',
      description: errors.join('. ')
    };
  }

  // Handle specific error codes
  switch (code) {
    case 'WEAK_PASSWORD':
      const passwordErrors = error.response?.data?.errors;
      return {
        title: 'Password Too Weak',
        description: passwordErrors?.join('. ') || 'Please choose a stronger password that meets all requirements.'
      };
    
    case 'EMAIL_EXISTS':
    case 'DUPLICATE_EMAIL':
      return {
        title: 'Email Already Registered',
        description: 'This email address is already associated with an account. Please use a different email or try logging in.'
      };
    
    case 'USERNAME_EXISTS':
    case 'DUPLICATE_USERNAME':
      return {
        title: 'Username Taken',
        description: 'This username is already in use. Please choose a different username.'
      };
    
    case 'INVALID_PHONE':
      return {
        title: 'Invalid Phone Number',
        description: 'Please enter a valid phone number in international format (e.g., +628123456789).'
      };
    
    case 'INVALID_REFERRAL':
      return {
        title: 'Invalid Referral Code',
        description: 'The referral code you entered is invalid or has expired.'
      };
    
    default:
      break;
  }

  // Handle HTTP status codes
  switch (status) {
    case 400:
      // Check for common validation messages
      if (message?.toLowerCase().includes('email')) {
        if (message.toLowerCase().includes('exist') || message.toLowerCase().includes('already')) {
          return {
            title: 'Email Already Registered',
            description: 'This email address is already associated with an account. Please use a different email or try logging in.'
          };
        }
        return {
          title: 'Invalid Email',
          description: 'Please enter a valid email address.'
        };
      }
      if (message?.toLowerCase().includes('username')) {
        return {
          title: 'Invalid Username',
          description: message || 'Username must be 3-30 characters, start with a letter, and contain only letters, numbers, and underscores.'
        };
      }
      if (message?.toLowerCase().includes('password')) {
        return {
          title: 'Invalid Password',
          description: message || 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.'
        };
      }
      return {
        title: 'Invalid Input',
        description: message || 'Please check your information and try again.'
      };
    
    case 409:
      return {
        title: 'Account Already Exists',
        description: message || 'An account with this email or username already exists.'
      };
    
    case 429:
      return {
        title: 'Too Many Requests',
        description: 'You have made too many registration attempts. Please wait a few minutes before trying again.'
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
        title: 'Registration Failed',
        description: message || 'An unexpected error occurred. Please try again.'
      };
  }
};

export default function Register() {
  const { register, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });

  const passwordStrength = checkPasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.username || !formData.email || !formData.password) {
      toast.error('Missing Information', {
        description: 'Please fill in all required fields (username, email, and password).'
      });
      return;
    }

    // Validate username format
    if (formData.username.length < 3) {
      toast.error('Username Too Short', {
        description: 'Username must be at least 3 characters long.'
      });
      return;
    }

    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(formData.username)) {
      toast.error('Invalid Username', {
        description: 'Username must start with a letter and contain only letters, numbers, and underscores.'
      });
      return;
    }

    // Validate password strength
    if (passwordStrength.score < 5) {
      toast.error('Password Too Weak', {
        description: `Password requirements not met: ${passwordStrength.feedback.join(', ')}`
      });
      return;
    }
    
    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords Don\'t Match', {
        description: 'Please make sure both passwords are identical.'
      });
      return;
    }
    
    // Validate terms agreement
    if (!formData.agreeTerms) {
      toast.error('Terms Required', {
        description: 'You must agree to the Terms & Conditions and Privacy Policy to create an account.'
      });
      return;
    }

    // Validate phone format if provided
    if (formData.phone && !/^\+?[0-9]{10,20}$/.test(formData.phone.replace(/\s/g, ''))) {
      toast.error('Invalid Phone Number', {
        description: 'Please enter a valid phone number (10-20 digits, optionally starting with +).'
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
      toast.success('Registration Successful!', {
        description: 'Welcome to Rekberkan! Please check your email to verify your account.'
      });
    } catch (error: any) {
      const { title, description } = getErrorMessage(error);
      toast.error(title, { description });
    }
  };

  const benefits = [
    'Secure transactions with escrow system',
    'Protection for buyers and sellers',
    '24/7 customer support',
    'Competitive fees starting at 2.5%'
  ];

  const getPasswordStrengthColor = () => {
    if (passwordStrength.score <= 2) return 'bg-red-500';
    if (passwordStrength.score <= 3) return 'bg-yellow-500';
    if (passwordStrength.score <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Visual */}
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
          className="relative z-10 max-w-md"
        >
          <div className="w-48 h-48 mx-auto mb-8 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
            <ShieldCheck className="w-24 h-24 text-white" weight="duotone" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-center text-white">
            Join Rekberkan Today
          </h2>
          <p className="text-white/70 text-center mb-8">
            Enjoy various benefits as a Rekberkan member.
          </p>
          
          <ul className="space-y-4">
            {benefits.map((benefit, index) => (
              <motion.li
                key={benefit}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" weight="fill" />
                </div>
                <span className="text-white/90">{benefit}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>
      
      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-8">
            <img src="/images/logo.svg" alt="Rekberkan" className="h-8 w-auto" />
          </Link>
          
          <h1 className="text-3xl font-bold mb-2 text-black">Create Account</h1>
          <p className="text-[#6B7280] mb-8">
            Sign up free and start transacting securely
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-black">Username *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" weight="regular" />
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="johndoe"
                  required
                  minLength={3}
                  maxLength={30}
                  className="pl-10 bg-white border-[#E5E5E5] focus:border-black focus:ring-black h-12"
                />
              </div>
              <p className="text-xs text-[#9CA3AF]">3-30 characters, letters, numbers, and underscores only</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-black">Email *</Label>
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
              <Label htmlFor="phone" className="text-black">Phone Number (Optional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" weight="regular" />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+62 812 3456 7890"
                  className="pl-10 bg-white border-[#E5E5E5] focus:border-black focus:ring-black h-12"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-black">Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" weight="regular" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="pl-10 bg-white border-[#E5E5E5] focus:border-black focus:ring-black h-12"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-black">Confirm *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    required
                    className="bg-white border-[#E5E5E5] focus:border-black focus:ring-black h-12"
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
            </div>

            {/* Password strength indicator */}
            {formData.password && (
              <div className="space-y-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        level <= passwordStrength.score ? getPasswordStrengthColor() : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                {passwordStrength.feedback.length > 0 && (
                  <div className="flex items-start gap-2 text-xs text-[#9CA3AF]">
                    <WarningCircle className="w-4 h-4 flex-shrink-0 mt-0.5" weight="fill" />
                    <span>Missing: {passwordStrength.feedback.join(', ')}</span>
                  </div>
                )}
                {passwordStrength.score === 5 && (
                  <div className="flex items-center gap-2 text-xs text-green-600">
                    <CheckCircle className="w-4 h-4" weight="fill" />
                    <span>Strong password!</span>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex items-start gap-2">
              <Checkbox
                id="agreeTerms"
                checked={formData.agreeTerms}
                onCheckedChange={(checked) => setFormData({ ...formData, agreeTerms: checked as boolean })}
                className="mt-1 border-[#E5E5E5] data-[state=checked]:bg-black data-[state=checked]:border-black"
              />
              <Label htmlFor="agreeTerms" className="text-sm cursor-pointer leading-relaxed text-[#6B7280]">
                I agree to the{' '}
                <Link href="/terms" className="text-black hover:underline font-medium">
                  Terms & Conditions
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-black hover:underline font-medium">
                  Privacy Policy
                </Link>
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
                  Creating Account...
                </>
              ) : (
                <>
                  Sign Up Now
                  <ArrowRight className="ml-2 w-4 h-4" weight="bold" />
                </>
              )}
            </Button>
          </form>
          
          <p className="mt-6 text-center text-sm text-[#6B7280]">
            Already have an account?{' '}
            <Link href="/login" className="text-black hover:underline font-semibold">
              Sign in here
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
