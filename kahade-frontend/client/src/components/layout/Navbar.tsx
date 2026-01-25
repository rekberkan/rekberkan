/*
 * KAHADE NAVBAR - Glassmorphic Navigation
 * 
 * Design: Glass effect with blur, sticky positioning
 * Colors: Transparent with white/10 border, cyan accent on hover
 * Multi-subdomain: Links to appropriate subdomains
 */

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '@/components/ThemeToggle';
import { APP_URLS, canAccessAdmin, navigateToApp, navigateToAdmin } from '@/config/app.config';

const navLinks = [
  { href: '/', label: 'Beranda' },
  { href: '/how-it-works', label: 'Cara Kerja' },
  { href: '/about', label: 'Tentang' },
  { href: '/contact', label: 'Kontak' },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDashboardClick = () => {
    if (canAccessAdmin(user)) {
      navigateToAdmin();
    } else {
      navigateToApp();
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'py-3 bg-background/80 backdrop-blur-xl border-b border-white/10'
          : 'py-5 bg-transparent'
      }`}
    >
      <div className="container flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative">
            <Shield className="w-8 h-8 text-accent transition-all duration-300 group-hover:text-cyan-glow" />
            <div className="absolute inset-0 blur-lg bg-accent/30 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="text-xl font-display font-bold text-foreground">
            Kahade
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative text-sm font-medium transition-colors duration-200 ${
                location === link.href
                  ? 'text-accent'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {link.label}
              {location === link.href && (
                <motion.div
                  layoutId="navbar-indicator"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent rounded-full"
                />
              )}
            </Link>
          ))}
        </div>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          {isAuthenticated ? (
            <Button className="btn-primary" onClick={handleDashboardClick}>
              Dashboard
            </Button>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="text-foreground hover:text-accent hover:bg-muted/50">
                  Masuk
                </Button>
              </Link>
              <Link href="/register">
                <Button className="btn-accent">
                  Daftar Gratis
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden bg-background/95 backdrop-blur-xl border-b border-border"
          >
            <div className="container py-4 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block py-2 text-base font-medium ${
                    location === link.href
                      ? 'text-accent'
                      : 'text-muted-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-border space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-muted-foreground">Theme</span>
                  <ThemeToggle />
                </div>
                {isAuthenticated ? (
                  <Button className="w-full btn-primary" onClick={handleDashboardClick}>
                    Dashboard
                  </Button>
                ) : (
                  <>
                    <Link href="/login" className="block">
                      <Button variant="outline" className="w-full">
                        Masuk
                      </Button>
                    </Link>
                    <Link href="/register" className="block">
                      <Button className="w-full btn-accent">
                        Daftar Gratis
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
