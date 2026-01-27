/*
 * KAHADE NAVBAR - Complex Navigation with Mega Menu
 * 
 * Features:
 * - Logo SVG only (no brand text)
 * - Complex mega menu navigation
 * - Get Started button visible on all screens
 * - Phosphor Icons only
 * - Keyboard accessible
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  List, X, CaretDown, CaretRight, 
  Rocket, ShieldCheck, Users, CreditCard, ChartLine, Headset,
  BookOpen, FileText, Question, Newspaper, Buildings, Briefcase,
  Scroll, Scales, Cookie, Certificate
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
  solutions: {
    label: 'Solutions',
    links: [
      { href: '/solutions/marketplace', label: 'Marketplace Escrow' },
      { href: '/solutions/freelance', label: 'Freelance Protection' },
      { href: '/solutions/enterprise', label: 'Enterprise Solutions' },
      { href: '/solutions/api', label: 'API Integration' },
    ]
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
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menu on Escape key
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'py-3 bg-white/95 backdrop-blur-md border-b border-border shadow-sm'
          : 'py-4 bg-white'
      }`}
    >
      <div className="container flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0">
          <img 
            src="/images/logo.svg" 
            alt="Kahade" 
            className="h-10 w-auto"
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
              className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeMenu === 'product' ? 'text-accent bg-accent/5' : 'text-foreground hover:text-accent hover:bg-accent/5'
              }`}
              aria-expanded={activeMenu === 'product'}
              aria-haspopup="true"
            >
              Product
              <CaretDown className={`w-4 h-4 transition-transform ${activeMenu === 'product' ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {activeMenu === 'product' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 mt-2 w-[600px] bg-white rounded-2xl border border-border shadow-xl p-6"
                  onMouseEnter={() => handleMenuEnter('product')}
                  onMouseLeave={handleMenuLeave}
                >
                  <div className="grid grid-cols-2 gap-6">
                    {megaMenuData.product.sections.map((section) => (
                      <div key={section.title}>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                          {section.title}
                        </h4>
                        <div className="space-y-1">
                          {section.links.map((link) => (
                            <Link
                              key={link.href}
                              href={link.href}
                              className="flex items-start gap-3 p-3 rounded-xl hover:bg-secondary transition-colors group"
                              onClick={() => setActiveMenu(null)}
                            >
                              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
                                <link.icon className="w-5 h-5 text-accent" weight="duotone" />
                              </div>
                              <div>
                                <div className="font-medium text-foreground group-hover:text-accent transition-colors">
                                  {link.label}
                                </div>
                                <div className="text-sm text-muted-foreground">
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
                  <div className="mt-6 pt-6 border-t border-border">
                    <Link
                      href={megaMenuData.product.featured.href}
                      className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-accent/5 to-accent/10 hover:from-accent/10 hover:to-accent/20 transition-colors group"
                      onClick={() => setActiveMenu(null)}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{megaMenuData.product.featured.title}</span>
                          <span className="px-2 py-0.5 text-xs font-medium bg-accent text-white rounded-full">
                            {megaMenuData.product.featured.badge}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {megaMenuData.product.featured.description}
                        </p>
                      </div>
                      <CaretRight className="w-5 h-5 text-accent group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Solutions - Simple Dropdown */}
          <div 
            className="relative"
            onMouseEnter={() => handleMenuEnter('solutions')}
            onMouseLeave={handleMenuLeave}
          >
            <button
              className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeMenu === 'solutions' ? 'text-accent bg-accent/5' : 'text-foreground hover:text-accent hover:bg-accent/5'
              }`}
              aria-expanded={activeMenu === 'solutions'}
              aria-haspopup="true"
            >
              Solutions
              <CaretDown className={`w-4 h-4 transition-transform ${activeMenu === 'solutions' ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {activeMenu === 'solutions' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl border border-border shadow-xl py-2"
                  onMouseEnter={() => handleMenuEnter('solutions')}
                  onMouseLeave={handleMenuLeave}
                >
                  {megaMenuData.solutions.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block px-4 py-2.5 text-sm text-foreground hover:text-accent hover:bg-secondary transition-colors"
                      onClick={() => setActiveMenu(null)}
                    >
                      {link.label}
                    </Link>
                  ))}
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
              className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeMenu === 'resources' ? 'text-accent bg-accent/5' : 'text-foreground hover:text-accent hover:bg-accent/5'
              }`}
              aria-expanded={activeMenu === 'resources'}
              aria-haspopup="true"
            >
              Resources
              <CaretDown className={`w-4 h-4 transition-transform ${activeMenu === 'resources' ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {activeMenu === 'resources' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 mt-2 w-[500px] bg-white rounded-2xl border border-border shadow-xl p-6"
                  onMouseEnter={() => handleMenuEnter('resources')}
                  onMouseLeave={handleMenuLeave}
                >
                  <div className="grid grid-cols-2 gap-6">
                    {megaMenuData.resources.sections.map((section) => (
                      <div key={section.title}>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                          {section.title}
                        </h4>
                        <div className="space-y-1">
                          {section.links.map((link) => (
                            <Link
                              key={link.href}
                              href={link.href}
                              className="flex items-start gap-3 p-3 rounded-xl hover:bg-secondary transition-colors group"
                              onClick={() => setActiveMenu(null)}
                            >
                              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
                                <link.icon className="w-5 h-5 text-accent" weight="duotone" />
                              </div>
                              <div>
                                <div className="font-medium text-foreground group-hover:text-accent transition-colors">
                                  {link.label}
                                </div>
                                <div className="text-sm text-muted-foreground">
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

          {/* Pricing - Direct Link */}
          <Link
            href="/#pricing"
            className="px-4 py-2 text-sm font-medium text-foreground hover:text-accent hover:bg-accent/5 rounded-lg transition-colors"
          >
            Pricing
          </Link>

          {/* Company - Simple Dropdown */}
          <div 
            className="relative"
            onMouseEnter={() => handleMenuEnter('company')}
            onMouseLeave={handleMenuLeave}
          >
            <button
              className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeMenu === 'company' ? 'text-accent bg-accent/5' : 'text-foreground hover:text-accent hover:bg-accent/5'
              }`}
              aria-expanded={activeMenu === 'company'}
              aria-haspopup="true"
            >
              Company
              <CaretDown className={`w-4 h-4 transition-transform ${activeMenu === 'company' ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {activeMenu === 'company' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl border border-border shadow-xl py-2"
                  onMouseEnter={() => handleMenuEnter('company')}
                  onMouseLeave={handleMenuLeave}
                >
                  {megaMenuData.company.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block px-4 py-2.5 text-sm text-foreground hover:text-accent hover:bg-secondary transition-colors"
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

        {/* Auth Buttons - Desktop */}
        <div className="hidden lg:flex items-center gap-3">
          {isAuthenticated ? (
            <Button className="btn-accent" onClick={handleDashboardClick}>
              Dashboard
            </Button>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="text-foreground hover:text-accent hover:bg-accent/5">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="btn-accent">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile: Get Started + Hamburger */}
        <div className="flex lg:hidden items-center gap-2">
          {!isAuthenticated && (
            <Link href="/register">
              <Button className="btn-accent text-sm px-4 py-2">
                Get Started
              </Button>
            </Link>
          )}
          <button
            className="p-2 text-foreground hover:bg-secondary rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" weight="bold" /> : <List className="w-6 h-6" weight="bold" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden overflow-hidden bg-white border-t border-border"
          >
            <div className="container py-4 space-y-2">
              {/* Product Accordion */}
              <div className="border-b border-border pb-2">
                <button
                  className="flex items-center justify-between w-full py-3 text-base font-medium text-foreground"
                  onClick={() => toggleMobileSubmenu('product')}
                  aria-expanded={expandedMobileMenu === 'product'}
                >
                  Product
                  <CaretDown className={`w-5 h-5 transition-transform ${expandedMobileMenu === 'product' ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {expandedMobileMenu === 'product' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pl-4 space-y-2 overflow-hidden"
                    >
                      {megaMenuData.product.sections.map((section) => (
                        <div key={section.title} className="py-2">
                          <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">{section.title}</div>
                          {section.links.map((link) => (
                            <Link
                              key={link.href}
                              href={link.href}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="flex items-center gap-3 py-2 text-sm text-muted-foreground hover:text-accent"
                            >
                              <link.icon className="w-4 h-4" weight="duotone" />
                              {link.label}
                            </Link>
                          ))}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Solutions Accordion */}
              <div className="border-b border-border pb-2">
                <button
                  className="flex items-center justify-between w-full py-3 text-base font-medium text-foreground"
                  onClick={() => toggleMobileSubmenu('solutions')}
                  aria-expanded={expandedMobileMenu === 'solutions'}
                >
                  Solutions
                  <CaretDown className={`w-5 h-5 transition-transform ${expandedMobileMenu === 'solutions' ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {expandedMobileMenu === 'solutions' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pl-4 space-y-1 overflow-hidden"
                    >
                      {megaMenuData.solutions.links.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block py-2 text-sm text-muted-foreground hover:text-accent"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Resources Accordion */}
              <div className="border-b border-border pb-2">
                <button
                  className="flex items-center justify-between w-full py-3 text-base font-medium text-foreground"
                  onClick={() => toggleMobileSubmenu('resources')}
                  aria-expanded={expandedMobileMenu === 'resources'}
                >
                  Resources
                  <CaretDown className={`w-5 h-5 transition-transform ${expandedMobileMenu === 'resources' ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {expandedMobileMenu === 'resources' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pl-4 space-y-2 overflow-hidden"
                    >
                      {megaMenuData.resources.sections.map((section) => (
                        <div key={section.title} className="py-2">
                          <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">{section.title}</div>
                          {section.links.map((link) => (
                            <Link
                              key={link.href}
                              href={link.href}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="flex items-center gap-3 py-2 text-sm text-muted-foreground hover:text-accent"
                            >
                              <link.icon className="w-4 h-4" weight="duotone" />
                              {link.label}
                            </Link>
                          ))}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Pricing Direct Link */}
              <Link
                href="/#pricing"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-3 text-base font-medium text-foreground border-b border-border"
              >
                Pricing
              </Link>

              {/* Company Accordion */}
              <div className="border-b border-border pb-2">
                <button
                  className="flex items-center justify-between w-full py-3 text-base font-medium text-foreground"
                  onClick={() => toggleMobileSubmenu('company')}
                  aria-expanded={expandedMobileMenu === 'company'}
                >
                  Company
                  <CaretDown className={`w-5 h-5 transition-transform ${expandedMobileMenu === 'company' ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {expandedMobileMenu === 'company' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pl-4 space-y-1 overflow-hidden"
                    >
                      {megaMenuData.company.links.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block py-2 text-sm text-muted-foreground hover:text-accent"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Auth Buttons */}
              <div className="pt-4 space-y-3">
                {isAuthenticated ? (
                  <Button className="w-full btn-accent" onClick={handleDashboardClick}>
                    Dashboard
                  </Button>
                ) : (
                  <Link href="/login" className="block">
                    <Button variant="outline" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
