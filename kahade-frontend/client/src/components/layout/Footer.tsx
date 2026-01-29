/*
 * REKBERKAN FOOTER - EXCLUSIVE EDITION
 * 
 * Design Philosophy:
 * - Premium dark aesthetic
 * - Structured information hierarchy
 * - Clear navigation and trust signals
 * - Professional compliance display
 */

import { Link } from 'wouter';
import { 
  TwitterLogo, 
  InstagramLogo, 
  LinkedinLogo, 
  GithubLogo,
  YoutubeLogo,
  DiscordLogo,
  ShieldCheck,
  ArrowUpRight,
  Envelope,
  MapPin,
  Phone
} from '@phosphor-icons/react';

const footerLinks = {
  product: {
    title: 'Product',
    links: [
      { label: 'Features', href: '/#features' },
      { label: 'Pricing', href: '/#pricing' },
      { label: 'Mobile App', href: '/mobile-app' },
      { label: 'API', href: '/docs/api' },
      { label: 'Integrations', href: '/docs/integration' },
    ]
  },
  resources: {
    title: 'Resources',
    links: [
      { label: 'Blog', href: '/blog' },
      { label: 'How It Works', href: '/how-it-works' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Help Center', href: '/help' },
      { label: 'Documentation', href: '/docs' },
    ]
  },
  company: {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact' },
      { label: 'Press', href: '/press' },
      { label: 'Partners', href: '/partners' },
    ]
  },
  legal: {
    title: 'Legal',
    links: [
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Cookie Policy', href: '/cookies' },
      { label: 'Licenses', href: '/licenses' },
      { label: 'Security', href: '/security' },
    ]
  }
};

const socialLinks = [
  { icon: TwitterLogo, href: 'https://twitter.com/rekberkan', label: 'Twitter' },
  { icon: InstagramLogo, href: 'https://instagram.com/rekberkan', label: 'Instagram' },
  { icon: LinkedinLogo, href: 'https://linkedin.com/company/rekberkan', label: 'LinkedIn' },
  { icon: GithubLogo, href: 'https://github.com/rekberkan', label: 'GitHub' },
  { icon: YoutubeLogo, href: 'https://youtube.com/@rekberkan', label: 'YouTube' },
  { icon: DiscordLogo, href: 'https://discord.gg/rekberkan', label: 'Discord' },
];

const complianceBadges = [
  { label: 'SOC 2', sublabel: 'Type II' },
  { label: 'ISO 27001', sublabel: 'Certified' },
  { label: 'GDPR', sublabel: 'Compliant' },
  { label: 'PCI DSS', sublabel: 'Level 1' },
];

export default function Footer() {
  return (
    <footer className="bg-[#0A0A0A] text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid opacity-5" />
      
      {/* Newsletter Section */}
      <div className="relative border-b border-white/10">
        <div className="container py-16">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h3 className="text-2xl md:text-3xl font-bold mb-2">Stay updated</h3>
              <p className="text-white/60">Get the latest news and updates from Rekberkan.</p>
            </div>
            <div className="flex w-full md:w-auto gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 md:w-72 px-5 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-white/30 transition-colors"
              />
              <button className="px-6 py-3.5 bg-white text-[#0A0A0A] font-semibold rounded-xl hover:bg-white/90 transition-colors shrink-0">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Footer Content */}
      <div className="relative container py-16 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
          {/* Logo & Description */}
          <div className="lg:col-span-4">
            <Link href="/" className="inline-block mb-6">
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
            <p className="text-white/60 leading-relaxed mb-8 max-w-sm">
              Indonesia's most trusted P2P escrow platform for secure online transactions. 
              Protecting both buyers and sellers since 2024.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3 mb-8">
              <a href="mailto:hello@rekberkan.com" className="flex items-center gap-3 text-white/60 hover:text-white transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                  <Envelope className="w-5 h-5" weight="bold" />
                </div>
                <span>hello@rekberkan.com</span>
              </a>
              <div className="flex items-center gap-3 text-white/60">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <MapPin className="w-5 h-5" weight="bold" />
                </div>
                <span>Jakarta, Indonesia</span>
              </div>
            </div>
            
            {/* Social Links */}
            <div className="flex items-center gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" weight="regular" />
                </a>
              ))}
            </div>
          </div>
          
          {/* Link Columns */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {/* Product */}
              <div>
                <h4 className="font-bold text-white text-sm mb-5 uppercase tracking-wider">
                  {footerLinks.product.title}
                </h4>
                <ul className="space-y-3">
                  {footerLinks.product.links.map((link) => (
                    <li key={link.href}>
                      <Link 
                        href={link.href}
                        className="text-sm text-white/60 hover:text-white transition-colors inline-flex items-center gap-1 group"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Resources */}
              <div>
                <h4 className="font-bold text-white text-sm mb-5 uppercase tracking-wider">
                  {footerLinks.resources.title}
                </h4>
                <ul className="space-y-3">
                  {footerLinks.resources.links.map((link) => (
                    <li key={link.href}>
                      <Link 
                        href={link.href}
                        className="text-sm text-white/60 hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Company */}
              <div>
                <h4 className="font-bold text-white text-sm mb-5 uppercase tracking-wider">
                  {footerLinks.company.title}
                </h4>
                <ul className="space-y-3">
                  {footerLinks.company.links.map((link) => (
                    <li key={link.href}>
                      <Link 
                        href={link.href}
                        className="text-sm text-white/60 hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Legal */}
              <div>
                <h4 className="font-bold text-white text-sm mb-5 uppercase tracking-wider">
                  {footerLinks.legal.title}
                </h4>
                <ul className="space-y-3">
                  {footerLinks.legal.links.map((link) => (
                    <li key={link.href}>
                      <Link 
                        href={link.href}
                        className="text-sm text-white/60 hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Compliance & Copyright */}
      <div className="relative border-t border-white/10">
        <div className="container py-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Compliance Badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6">
              {complianceBadges.map((badge) => (
                <div key={badge.label} className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-white/60" weight="fill" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white/80">{badge.label}</div>
                    <div className="text-xs text-white/40">{badge.sublabel}</div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Copyright */}
            <div className="text-center lg:text-right">
              <p className="text-sm text-white/40">
                © {new Date().getFullYear()} Rekberkan. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
