/*
 * KAHADE LOGIN PAGE
 * Design: Glassmorphic centered form with brand elements
 */

import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export default function Login() {
  const [, setLocation] = useLocation();
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
      toast.error('Mohon isi semua field');
      return;
    }

    try {
      const user = await login(formData.email, formData.password);
      toast.success('Login berhasil!');
      
      // Redirect based on user role
      if (user?.role === 'ADMIN') {
        setLocation('/admin');
      } else {
        setLocation('/app');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Email atau password salah.';
      toast.error('Login gagal', { description: message });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-8">
            <Shield className="w-8 h-8 text-accent" />
            <span className="text-xl font-display font-bold">Kahade</span>
          </Link>
          
          <h1 className="text-3xl font-display font-bold mb-2">Selamat Datang</h1>
          <p className="text-muted-foreground mb-8">
            Masuk ke akun Anda untuk melanjutkan
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                  required
                  className="pl-10 bg-white/5 border-white/10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-sm text-accent hover:underline">
                  Lupa password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="pl-10 pr-10 bg-white/5 border-white/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
                Ingat saya
              </Label>
            </div>
            
            <Button 
              type="submit" 
              className="btn-accent w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  Masuk
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </Button>
          </form>
          
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Belum punya akun?{' '}
            <Link href="/register" className="text-accent hover:underline font-medium">
              Daftar sekarang
            </Link>
          </p>
        </motion.div>
      </div>
      
      {/* Right Side - Visual */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-8 bg-white/[0.02] relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative z-10 text-center"
        >
          <div className="w-64 h-64 mx-auto mb-8 rounded-full bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
            <Shield className="w-32 h-32 text-accent" />
          </div>
          <h2 className="text-2xl font-display font-bold mb-4">
            Transaksi Aman dengan Kahade
          </h2>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Platform rekber/escrow terpercaya untuk keamanan transaksi online Anda.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
