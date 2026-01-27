/*
 * KAHADE REGISTER PAGE
 * Design: Glassmorphic centered form with brand elements
 * Icons: Phosphor Icons only
 */

import { useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { ShieldCheck, Envelope, Lock, Eye, EyeSlash, ArrowRight, Spinner, User, Phone, CheckCircle } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (!formData.agreeTerms) {
      toast.error('You must agree to the terms and conditions');
      return;
    }
    
    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      toast.success('Registration successful!', {
        description: 'Please check your email for verification.'
      });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Please try again.';
      toast.error('Registration failed', { description: message });
    }
  };

  const benefits = [
    'Secure transactions with escrow system',
    'Protection for buyers and sellers',
    '24/7 customer support',
    'Competitive fees starting at 2.5%'
  ];

  return (
    <div className="min-h-screen flex bg-[#FAFBFC]">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-8 bg-white relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative z-10 max-w-md"
        >
          <div className="w-64 h-64 mx-auto mb-8 rounded-full bg-gradient-to-br from-accent/10 to-accent/5 flex items-center justify-center">
            <ShieldCheck className="w-32 h-32 text-accent" weight="duotone" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-center">
            Join Kahade Today
          </h2>
          <p className="text-muted-foreground text-center mb-8">
            Enjoy various benefits as a Kahade member.
          </p>
          
          <ul className="space-y-3">
            {benefits.map((benefit, index) => (
              <motion.li
                key={benefit}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center gap-3"
              >
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" weight="fill" />
                <span className="text-foreground">{benefit}</span>
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
            <img src="/images/logo.svg" alt="Kahade" className="h-8 w-auto" />
          </Link>
          
          <h1 className="text-3xl font-bold mb-2">Create Account</h1>
          <p className="text-muted-foreground mb-8">
            Sign up free and start transacting securely
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" weight="regular" />
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="johndoe"
                  required
                  className="pl-10 bg-white border-border"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <div className="relative">
                <Envelope className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" weight="regular" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                  required
                  className="pl-10 bg-white border-border"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" weight="regular" />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  className="pl-10 bg-white border-border"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" weight="regular" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="pl-10 bg-white border-border"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    required
                    className="bg-white border-border"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeSlash className="w-5 h-5" weight="regular" /> : <Eye className="w-5 h-5" weight="regular" />}
                  </button>
                </div>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground">Password must be at least 8 characters</p>
            
            <div className="flex items-start gap-2">
              <Checkbox
                id="agreeTerms"
                checked={formData.agreeTerms}
                onCheckedChange={(checked) => setFormData({ ...formData, agreeTerms: checked as boolean })}
                className="mt-1"
              />
              <Label htmlFor="agreeTerms" className="text-sm cursor-pointer leading-relaxed">
                I agree to the{' '}
                <Link href="/terms" className="text-accent hover:underline">
                  Terms & Conditions
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-accent hover:underline">
                  Privacy Policy
                </Link>
              </Label>
            </div>
            
            <Button 
              type="submit" 
              className="btn-accent w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner className="mr-2 w-4 h-4 animate-spin" weight="bold" />
                  Processing...
                </>
              ) : (
                <>
                  Sign Up Now
                  <ArrowRight className="ml-2 w-4 h-4" weight="bold" />
                </>
              )}
            </Button>
          </form>
          
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-accent hover:underline font-medium">
              Sign in here
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
