/*
 * REKBERKAN NAVBAR - EXCLUSIVE EDITION
 * 
 * Design Philosophy:
 * - Clean, minimal, and premium
 * - Smooth transitions and micro-interactions
 * - Powerful mega menu with structured content
 * - Responsive with elegant mobile drawer
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  List, X, CaretDown, CaretRight, 
  Rocket, ShieldCheck, Users, CreditCard, ChartLine, Headset,
  BookOpen, FileText, Question, Newspaper, Buildings, Briefcase,
  ArrowRight, ArrowUpRight
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { APP_URLS, canAccessAdmin, navigateToApp, navigateToAdmin } from '@/config/app.config';

// Mega Menu Data
const megaMenuData = {
  product: {
    label: 'Product',
    sections: [
      {
        title: 'Platform',
        links: [
          { href: '/#features', label: 'Features', icon: Rocket, description: 'Explore all platform features' },
          { href: '/#security', label: 'Security', icon: ShieldCheck, description: 'Enterprise-grade protection' },
          { href: '/#pricing', label: 'Pricing', icon: CreditCard, description: 'Transparent pricing plans' },
        ]
      },
      {
        title: 'Solutions',
        links: [
          { href: '/solutions/marketplace', label: 'Marketplace', icon: Users, description: 'For online marketplaces' },
          { href: '/solutions/freelance', label: 'Freelancers', icon: Briefcase, description: 'Secure freelance payments' },
          { href: '/solutions/enterprise', label: 'Enterprise', icon: Buildings, description: 'Custom enterprise solutions' },
        ]
      }
    ],
    featured: {
      title: 'New Release',
      description: 'Introducing Rekberkan Mobile App - Secure transactions on the go',
      href: '/mobile-app',
      badge: 'New'
    }
  },
  resources: {
    label: 'Resources',
    sections: [
      {
        title: 'Learn',
        links: [
          { href: '/blog', label: 'Blog', icon: Newspaper, description: 'Latest news and updates' },
          { href: '/how-it-works', label: 'How It Works', icon: BookOpen, description: 'Step-by-step guide' },
          { href: '/faq', label: 'FAQ', icon: Question, description: 'Common questions answered' },
        ]
      },
      {
        title: 'Documentation',
        links: [
          { href: '/docs/api', label: 'API Docs', icon: FileText, description: 'Developer documentation' },
          { href: '/docs/integration', label: 'Integration Guide', icon: ChartLine, description: 'Integration tutorials' },
          { href: '/support', label: 'Help Center', icon: Headset, description: '24/7 support resources' },
        ]
      }
    ]
  },
  company: {
    label: 'Company',
    links: [
      { href: '/about', label: 'About Us' },
      { href: '/careers', label: 'Careers' },
      { href: '/contact', label: 'Contact' },
      { href: '/press', label: 'Press' },
    ]
  }
};

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [expandedMobileMenu, setExpandedMobileMenu] = useState<string | null>(null);
  const [location] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const navRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveMenu(null);
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const handleDashboardClick = () => {
    if (canAccessAdmin(user)) {
      navigateToAdmin();
    } else {
      navigateToApp();
    }
  };

  const handleMenuEnter = useCallback((menuKey: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setActiveMenu(menuKey);
  }, []);

  const handleMenuLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setActiveMenu(null);
    }, 150);
  }, []);

  const toggleMobileSubmenu = (menuKey: string) => {
    setExpandedMobileMenu(expandedMobileMenu === menuKey ? null : menuKey);
  };

  return (
    <>
      <nav
        ref={navRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'py-3 bg-white/90 backdrop-blur-xl border-b border-[#E8E8E8]'
            : 'py-5 bg-transparent'
        }`}
      >
        <div className="container flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0 relative z-10">
            <img 
              src="/images/logo.svg" 
              alt="Rekberkan" 
              className="h-8 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {/* Product - Mega Menu */}
            <div 
              className="relative"
              onMouseEnter={() => handleMenuEnter('product')}
              onMouseLeave={handleMenuLeave}
            >
              <button
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activeMenu === 'product' 
                    ? 'text-[#0A0A0A] bg-[#F5F5F5]' 
                    : 'text-[#737373] hover:text-[#0A0A0A] hover:bg-[#F5F5F5]'
                }`}
                aria-expanded={activeMenu === 'product'}
                aria-haspopup="true"
              >
                Product
                <CaretDown className={`w-4 h-4 transition-transform duration-200 ${activeMenu === 'product' ? 'rotate-180' : ''}`} weight="bold" />
              </button>
              
              <AnimatePresence>
                {activeMenu === 'product' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    className="absolute top-full left-0 mt-2 w-[600px] bg-white rounded-2xl border border-[#E8E8E8] shadow-2xl shadow-black/5 p-6"
                    onMouseEnter={() => handleMenuEnter('product')}
                    onMouseLeave={handleMenuLeave}
                  >
                    <div className="grid grid-cols-2 gap-8">
                      {megaMenuData.product.sections.map((section) => (
                        <div key={section.title}>
                          <h4 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-widest mb-4">
                            {section.title}
                          </h4>
                          <div className="space-y-1">
                            {section.links.map((link) => (
                              <Link
                                key={link.href}
                                href={link.href}
                                className="flex items-start gap-4 p-3 rounded-xl hover:bg-[#F5F5F5] transition-all duration-200 group"
                                onClick={() => setActiveMenu(null)}
                              >
                                <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] flex items-center justify-center shrink-0 group-hover:bg-[#0A0A0A] group-hover:text-white transition-all duration-200">
                                  <link.icon className="w-5 h-5" weight="bold" />
                                </div>
                                <div>
                                  <div className="font-semibold text-[#0A0A0A] text-sm group-hover:text-[#0A0A0A]">
                                    {link.label}
                                  </div>
                                  <div className="text-xs text-[#737373] mt-0.5">
                                    {link.description}
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Featured Section */}
                    <div className="mt-6 pt-6 border-t border-[#E8E8E8]">
                      <Link
                        href={megaMenuData.product.featured.href}
                        className="flex items-center justify-between p-4 rounded-xl bg-[#0A0A0A] text-white hover:bg-[#1a1a1a] transition-all duration-200 group"
                        onClick={() => setActiveMenu(null)}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{megaMenuData.product.featured.title}</span>
                            <span className="px-2 py-0.5 text-xs font-bold bg-white text-[#0A0A0A] rounded-full">
                              {megaMenuData.product.featured.badge}
                            </span>
                          </div>
                          <p className="text-xs text-white/70 mt-1">
                            {megaMenuData.product.featured.description}
                          </p>
                        </div>
                        <ArrowUpRight className="w-5 h-5 text-white/70 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" weight="bold" />
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Resources - Mega Menu */}
            <div 
              className="relative"
              onMouseEnter={() => handleMenuEnter('resources')}
              onMouseLeave={handleMenuLeave}
            >
              <button
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activeMenu === 'resources' 
                    ? 'text-[#0A0A0A] bg-[#F5F5F5]' 
                    : 'text-[#737373] hover:text-[#0A0A0A] hover:bg-[#F5F5F5]'
                }`}
                aria-expanded={activeMenu === 'resources'}
                aria-haspopup="true"
              >
                Resources
                <CaretDown className={`w-4 h-4 transition-transform duration-200 ${activeMenu === 'resources' ? 'rotate-180' : ''}`} weight="bold" />
              </button>
              
              <AnimatePresence>
                {activeMenu === 'resources' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    className="absolute top-full left-0 mt-2 w-[500px] bg-white rounded-2xl border border-[#E8E8E8] shadow-2xl shadow-black/5 p-6"
                    onMouseEnter={() => handleMenuEnter('resources')}
                    onMouseLeave={handleMenuLeave}
                  >
                    <div className="grid grid-cols-2 gap-8">
                      {megaMenuData.resources.sections.map((section) => (
                        <div key={section.title}>
                          <h4 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-widest mb-4">
                            {section.title}
                          </h4>
                          <div className="space-y-1">
                            {section.links.map((link) => (
                              <Link
                                key={link.href}
                                href={link.href}
                                className="flex items-start gap-4 p-3 rounded-xl hover:bg-[#F5F5F5] transition-all duration-200 group"
                                onClick={() => setActiveMenu(null)}
                              >
                                <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] flex items-center justify-center shrink-0 group-hover:bg-[#0A0A0A] group-hover:text-white transition-all duration-200">
                                  <link.icon className="w-5 h-5" weight="bold" />
                                </div>
                                <div>
                                  <div className="font-semibold text-[#0A0A0A] text-sm">
                                    {link.label}
                                  </div>
                                  <div className="text-xs text-[#737373] mt-0.5">
                                    {link.description}
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Company - Simple Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => handleMenuEnter('company')}
              onMouseLeave={handleMenuLeave}
            >
              <button
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activeMenu === 'company' 
                    ? 'text-[#0A0A0A] bg-[#F5F5F5]' 
                    : 'text-[#737373] hover:text-[#0A0A0A] hover:bg-[#F5F5F5]'
                }`}
                aria-expanded={activeMenu === 'company'}
                aria-haspopup="true"
              >
                Company
                <CaretDown className={`w-4 h-4 transition-transform duration-200 ${activeMenu === 'company' ? 'rotate-180' : ''}`} weight="bold" />
              </button>
              
              <AnimatePresence>
                {activeMenu === 'company' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl border border-[#E8E8E8] shadow-2xl shadow-black/5 p-2"
                    onMouseEnter={() => handleMenuEnter('company')}
                    onMouseLeave={handleMenuLeave}
                  >
                    {megaMenuData.company.links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="block px-4 py-2.5 text-sm font-medium text-[#737373] hover:text-[#0A0A0A] hover:bg-[#F5F5F5] rounded-lg transition-all duration-200"
                        onClick={() => setActiveMenu(null)}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated ? (
              <Button 
                onClick={handleDashboardClick}
                className="btn-primary"
              >
                Dashboard
                <ArrowRight className="ml-2 w-4 h-4" weight="bold" />
              </Button>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-[#737373] hover:text-[#0A0A0A] hover:bg-[#F5F5F5] font-medium">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="btn-primary">
                    Get Started
                    <ArrowRight className="ml-2 w-4 h-4" weight="bold" />
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 hover:bg-[#F5F5F5] rounded-xl transition-colors relative z-10"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-[#0A0A0A]" weight="bold" />
            ) : (
              <List className="w-6 h-6 text-[#0A0A0A]" weight="bold" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white z-50 lg:hidden overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-[#E8E8E8] px-6 py-4 flex items-center justify-between">
                <img src="/images/logo.svg" alt="Rekberkan" className="h-7 w-auto" />
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 hover:bg-[#F5F5F5] rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-[#0A0A0A]" weight="bold" />
                </button>
              </div>
              
              {/* Navigation */}
              <div className="p-6 space-y-2">
                {/* Product */}
                <div>
                  <button
                    onClick={() => toggleMobileSubmenu('product')}
                    className="w-full flex items-center justify-between px-4 py-3 text-left font-semibold text-[#0A0A0A] hover:bg-[#F5F5F5] rounded-xl transition-colors"
                  >
                    Product
                    <CaretDown className={`w-5 h-5 transition-transform ${expandedMobileMenu === 'product' ? 'rotate-180' : ''}`} weight="bold" />
                  </button>
                  <AnimatePresence>
                    {expandedMobileMenu === 'product' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-4 py-2 space-y-1">
                          {megaMenuData.product.sections.flatMap(s => s.links).map((link) => (
                            <Link
                              key={link.href}
                              href={link.href}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-[#737373] hover:text-[#0A0A0A] hover:bg-[#F5F5F5] rounded-lg transition-colors"
                            >
                              <link.icon className="w-5 h-5" weight="bold" />
                              {link.label}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Resources */}
                <div>
                  <button
                    onClick={() => toggleMobileSubmenu('resources')}
                    className="w-full flex items-center justify-between px-4 py-3 text-left font-semibold text-[#0A0A0A] hover:bg-[#F5F5F5] rounded-xl transition-colors"
                  >
                    Resources
                    <CaretDown className={`w-5 h-5 transition-transform ${expandedMobileMenu === 'resources' ? 'rotate-180' : ''}`} weight="bold" />
                  </button>
                  <AnimatePresence>
                    {expandedMobileMenu === 'resources' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-4 py-2 space-y-1">
                          {megaMenuData.resources.sections.flatMap(s => s.links).map((link) => (
                            <Link
                              key={link.href}
                              href={link.href}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-[#737373] hover:text-[#0A0A0A] hover:bg-[#F5F5F5] rounded-lg transition-colors"
                            >
                              <link.icon className="w-5 h-5" weight="bold" />
                              {link.label}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Company */}
                <div>
                  <button
                    onClick={() => toggleMobileSubmenu('company')}
                    className="w-full flex items-center justify-between px-4 py-3 text-left font-semibold text-[#0A0A0A] hover:bg-[#F5F5F5] rounded-xl transition-colors"
                  >
                    Company
                    <CaretDown className={`w-5 h-5 transition-transform ${expandedMobileMenu === 'company' ? 'rotate-180' : ''}`} weight="bold" />
                  </button>
                  <AnimatePresence>
                    {expandedMobileMenu === 'company' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-4 py-2 space-y-1">
                          {megaMenuData.company.links.map((link) => (
                            <Link
                              key={link.href}
                              href={link.href}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="block px-4 py-2.5 text-[#737373] hover:text-[#0A0A0A] hover:bg-[#F5F5F5] rounded-lg transition-colors"
                            >
                              {link.label}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              {/* CTA Section */}
              <div className="p-6 border-t border-[#E8E8E8] space-y-3">
                {isAuthenticated ? (
                  <Button 
                    onClick={() => {
                      handleDashboardClick();
                      setIsMobileMenuOpen(false);
                    }}
                    className="btn-primary w-full"
                  >
                    Dashboard
                    <ArrowRight className="ml-2 w-4 h-4" weight="bold" />
                  </Button>
                ) : (
                  <>
                    <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button className="btn-primary w-full">
                        Get Started
                        <ArrowRight className="ml-2 w-4 h-4" weight="bold" />
                      </Button>
                    </Link>
                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full border-[#E8E8E8] hover:border-[#0A0A0A]">
                        Sign In
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
