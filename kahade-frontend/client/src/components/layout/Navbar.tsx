/*
 * KAHADE NAVBAR - Modern Navigation inspired by Baselayer
 * 
 * Features:
 * - Clean white background with subtle border on scroll
 * - Logo on left
 * - Navigation with dropdowns in center
 * - CTA buttons on right (Sign In + Get Started)
 * - Mobile responsive with hamburger menu
 * - Brand color: #000000
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  List, X, CaretDown, CaretRight, 
  Rocket, ShieldCheck, Users, CreditCard, ChartLine, Headset,
  BookOpen, FileText, Question, Newspaper, Buildings, Briefcase,
  ArrowRight
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
      description: 'Introducing Kahade Mobile App - Secure transactions on the go',
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
    <nav
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled
          ? 'py-3 bg-white border-b border-[#E5E5E5]'
          : 'py-4 bg-white'
      }`}
    >
      <div className="container flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0">
          <img 
            src="/images/logo.svg" 
            alt="Kahade" 
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
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeMenu === 'product' ? 'text-black bg-[#F5F5F5]' : 'text-[#6B7280] hover:text-black hover:bg-[#F5F5F5]'
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
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-2 w-[560px] bg-white rounded-xl border border-[#E5E5E5] shadow-lg p-5"
                  onMouseEnter={() => handleMenuEnter('product')}
                  onMouseLeave={handleMenuLeave}
                >
                  <div className="grid grid-cols-2 gap-6">
                    {megaMenuData.product.sections.map((section) => (
                      <div key={section.title}>
                        <h4 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">
                          {section.title}
                        </h4>
                        <div className="space-y-1">
                          {section.links.map((link) => (
                            <Link
                              key={link.href}
                              href={link.href}
                              className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#F5F5F5] transition-colors group"
                              onClick={() => setActiveMenu(null)}
                            >
                              <div className="w-9 h-9 rounded-lg bg-[#F5F5F5] flex items-center justify-center shrink-0 group-hover:bg-black group-hover:text-white transition-colors">
                                <link.icon className="w-4 h-4" weight="bold" />
                              </div>
                              <div>
                                <div className="font-medium text-black text-sm">
                                  {link.label}
                                </div>
                                <div className="text-xs text-[#6B7280] mt-0.5">
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
                  <div className="mt-5 pt-5 border-t border-[#E5E5E5]">
                    <Link
                      href={megaMenuData.product.featured.href}
                      className="flex items-center justify-between p-4 rounded-lg bg-[#F5F5F5] hover:bg-[#EBEBEB] transition-colors group"
                      onClick={() => setActiveMenu(null)}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-black text-sm">{megaMenuData.product.featured.title}</span>
                          <span className="px-2 py-0.5 text-xs font-medium bg-black text-white rounded-full">
                            {megaMenuData.product.featured.badge}
                          </span>
                        </div>
                        <p className="text-xs text-[#6B7280] mt-1">
                          {megaMenuData.product.featured.description}
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-[#6B7280] group-hover:text-black group-hover:translate-x-1 transition-all" weight="bold" />
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
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeMenu === 'resources' ? 'text-black bg-[#F5F5F5]' : 'text-[#6B7280] hover:text-black hover:bg-[#F5F5F5]'
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
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-2 w-[560px] bg-white rounded-xl border border-[#E5E5E5] shadow-lg p-5"
                  onMouseEnter={() => handleMenuEnter('resources')}
                  onMouseLeave={handleMenuLeave}
                >
                  <div className="grid grid-cols-2 gap-6">
                    {megaMenuData.resources.sections.map((section) => (
                      <div key={section.title}>
                        <h4 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">
                          {section.title}
                        </h4>
                        <div className="space-y-1">
                          {section.links.map((link) => (
                            <Link
                              key={link.href}
                              href={link.href}
                              className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#F5F5F5] transition-colors group"
                              onClick={() => setActiveMenu(null)}
                            >
                              <div className="w-9 h-9 rounded-lg bg-[#F5F5F5] flex items-center justify-center shrink-0 group-hover:bg-black group-hover:text-white transition-colors">
                                <link.icon className="w-4 h-4" weight="bold" />
                              </div>
                              <div>
                                <div className="font-medium text-black text-sm">
                                  {link.label}
                                </div>
                                <div className="text-xs text-[#6B7280] mt-0.5">
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
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeMenu === 'company' ? 'text-black bg-[#F5F5F5]' : 'text-[#6B7280] hover:text-black hover:bg-[#F5F5F5]'
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
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl border border-[#E5E5E5] shadow-lg py-2"
                  onMouseEnter={() => handleMenuEnter('company')}
                  onMouseLeave={handleMenuLeave}
                >
                  {megaMenuData.company.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block px-4 py-2.5 text-sm text-[#6B7280] hover:text-black hover:bg-[#F5F5F5] transition-colors"
                      onClick={() => setActiveMenu(null)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Pricing - Direct Link */}
          <Link
            href="/#pricing"
            className="px-4 py-2 text-sm font-medium text-[#6B7280] hover:text-black hover:bg-[#F5F5F5] rounded-lg transition-colors"
          >
            Pricing
          </Link>
        </div>

        {/* Right Side - Auth Buttons */}
        <div className="hidden lg:flex items-center gap-3">
          {isAuthenticated ? (
            <Button
              onClick={handleDashboardClick}
              className="bg-black hover:bg-[#1a1a1a] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
            >
              Dashboard
            </Button>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="text-sm font-medium text-[#6B7280] hover:text-black hover:bg-[#F5F5F5] px-4 py-2">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-black hover:bg-[#1a1a1a] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden p-2 rounded-lg hover:bg-[#F5F5F5] transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6 text-black" weight="bold" />
          ) : (
            <List className="w-6 h-6 text-black" weight="bold" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden bg-white border-t border-[#E5E5E5] overflow-hidden"
          >
            <div className="container py-4 space-y-2">
              {/* Product */}
              <div>
                <button
                  onClick={() => toggleMobileSubmenu('product')}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-black hover:bg-[#F5F5F5] rounded-lg transition-colors"
                >
                  Product
                  <CaretDown className={`w-4 h-4 transition-transform ${expandedMobileMenu === 'product' ? 'rotate-180' : ''}`} weight="bold" />
                </button>
                <AnimatePresence>
                  {expandedMobileMenu === 'product' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pl-4 space-y-1 overflow-hidden"
                    >
                      {megaMenuData.product.sections.flatMap(section => 
                        section.links.map(link => (
                          <Link
                            key={link.href}
                            href={link.href}
                            className="block px-4 py-2.5 text-sm text-[#6B7280] hover:text-black hover:bg-[#F5F5F5] rounded-lg transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            {link.label}
                          </Link>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Resources */}
              <div>
                <button
                  onClick={() => toggleMobileSubmenu('resources')}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-black hover:bg-[#F5F5F5] rounded-lg transition-colors"
                >
                  Resources
                  <CaretDown className={`w-4 h-4 transition-transform ${expandedMobileMenu === 'resources' ? 'rotate-180' : ''}`} weight="bold" />
                </button>
                <AnimatePresence>
                  {expandedMobileMenu === 'resources' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pl-4 space-y-1 overflow-hidden"
                    >
                      {megaMenuData.resources.sections.flatMap(section => 
                        section.links.map(link => (
                          <Link
                            key={link.href}
                            href={link.href}
                            className="block px-4 py-2.5 text-sm text-[#6B7280] hover:text-black hover:bg-[#F5F5F5] rounded-lg transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            {link.label}
                          </Link>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Company */}
              <div>
                <button
                  onClick={() => toggleMobileSubmenu('company')}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-black hover:bg-[#F5F5F5] rounded-lg transition-colors"
                >
                  Company
                  <CaretDown className={`w-4 h-4 transition-transform ${expandedMobileMenu === 'company' ? 'rotate-180' : ''}`} weight="bold" />
                </button>
                <AnimatePresence>
                  {expandedMobileMenu === 'company' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pl-4 space-y-1 overflow-hidden"
                    >
                      {megaMenuData.company.links.map(link => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="block px-4 py-2.5 text-sm text-[#6B7280] hover:text-black hover:bg-[#F5F5F5] rounded-lg transition-colors"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Pricing */}
              <Link
                href="/#pricing"
                className="block px-4 py-3 text-sm font-medium text-black hover:bg-[#F5F5F5] rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pricing
              </Link>

              {/* Auth Buttons */}
              <div className="pt-4 border-t border-[#E5E5E5] space-y-2">
                {isAuthenticated ? (
                  <Button
                    onClick={() => {
                      handleDashboardClick();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full bg-black hover:bg-[#1a1a1a] text-white py-3 rounded-lg text-sm font-semibold"
                  >
                    Dashboard
                  </Button>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full border-[#E5E5E5] text-black hover:bg-[#F5F5F5] py-3 rounded-lg text-sm font-semibold">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button className="w-full bg-black hover:bg-[#1a1a1a] text-white py-3 rounded-lg text-sm font-semibold">
                        Get Started
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
