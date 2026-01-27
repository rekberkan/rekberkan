/*
 * KAHADE LOGIN PAGE
 * Design: Glassmorphic centered form with brand elements
 * Multi-subdomain: Redirects to appropriate subdomain after login
 * Icons: Phosphor Icons only
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

export default function Login() {
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      // Login will handle redirect automatically via AuthContext
      await login(formData.email, formData.password);
      toast.success('Login successful!');
      // Note: Redirect is handled in AuthContext.login()
    } catch (error: any) {
      const message = error.message || 'Invalid email or password.';
      toast.error('Login failed', { description: message });
    }
  };

  return (
    <div className="min-h-screen flex bg-[#FAFBFC]">
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
          
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-muted-foreground mb-8">
            Sign in to your account to continue
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-sm text-accent hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" weight="regular" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="pl-10 pr-10 bg-white border-border"
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
            
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={formData.remember}
                onCheckedChange={(checked) => setFormData({ ...formData, remember: checked as boolean })}
              />
              <Label htmlFor="remember" className="text-sm cursor-pointer">
                Remember me
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
                  Sign In
                  <ArrowRight className="ml-2 w-4 h-4" weight="bold" />
                </>
              )}
            </Button>
          </form>
          
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/register" className="text-accent hover:underline font-medium">
              Sign up now
            </Link>
          </p>
        </motion.div>
      </div>
      
      {/* Right Side - Visual */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-8 bg-white relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative z-10 text-center"
        >
          <div className="w-64 h-64 mx-auto mb-8 rounded-full bg-gradient-to-br from-accent/10 to-accent/5 flex items-center justify-center">
            <ShieldCheck className="w-32 h-32 text-accent" weight="duotone" />
          </div>
          <h2 className="text-2xl font-bold mb-4">
            Secure Transactions with Kahade
          </h2>
          <p className="text-muted-foreground max-w-sm mx-auto">
            The trusted escrow platform for secure online transactions.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
