/*
 * KAHADE FOOTER - Modern Footer inspired by ClickUp
 * 
 * Features:
 * - Dark background (#000000)
 * - Logo and description on left
 * - Multi-column link layout
 * - Social media icons
 * - Compliance badges
 * - Copyright line
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
  Lock,
  Globe
} from '@phosphor-icons/react';

const footerLinks = {
  product: {
    title: 'Product',
    links: [
      { label: 'Features', href: '/#features' },
      { label: 'Pricing', href: '/#pricing' },
      { label: 'Mobile App', href: '/mobile-app' },
      { label: 'API', href: '/docs/api' },
    ]
  },
  resources: {
    title: 'Resources',
    links: [
      { label: 'Blog', href: '/blog' },
      { label: 'How It Works', href: '/how-it-works' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Help Center', href: '/help' },
    ]
  },
  company: {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact' },
      { label: 'Press', href: '/press' },
    ]
  },
  legal: {
    title: 'Legal',
    links: [
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Cookie Policy', href: '/cookies' },
      { label: 'Licenses', href: '/licenses' },
    ]
  }
};

const socialLinks = [
  { icon: TwitterLogo, href: 'https://twitter.com/kahade', label: 'Twitter' },
  { icon: InstagramLogo, href: 'https://instagram.com/kahade', label: 'Instagram' },
  { icon: LinkedinLogo, href: 'https://linkedin.com/company/kahade', label: 'LinkedIn' },
  { icon: GithubLogo, href: 'https://github.com/kahade', label: 'GitHub' },
  { icon: YoutubeLogo, href: 'https://youtube.com/@kahade', label: 'YouTube' },
  { icon: DiscordLogo, href: 'https://discord.gg/kahade', label: 'Discord' },
];

const complianceBadges = [
  { label: 'SOC 2', sublabel: 'CERTIFIED' },
  { label: 'ISO 27001', sublabel: 'CERTIFIED' },
  { label: 'GDPR', sublabel: 'COMPLIANT' },
  { label: 'PCI DSS', sublabel: 'COMPLIANT' },
];

export default function Footer() {
  return (
    <footer className="bg-black text-white">
      {/* Main Footer Content */}
      <div className="container py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Logo & Description */}
          <div className="lg:col-span-4">
            <Link href="/" className="inline-block mb-5">
              <img 
                src="/images/logo-white.svg" 
                alt="Kahade" 
                className="h-8 w-auto"
                onError={(e) => {
                  // Fallback to regular logo with filter
                  const target = e.target as HTMLImageElement;
                  target.src = '/images/logo.svg';
                  target.style.filter = 'brightness(0) invert(1)';
                }}
              />
            </Link>
            <p className="text-[#9CA3AF] text-sm leading-relaxed max-w-sm mb-6">
              Kahade is Indonesia's trusted P2P escrow platform for secure online transactions. 
              We protect both buyers and sellers with our transparent and reliable escrow service.
            </p>
            
            {/* Social Links */}
            <div className="flex items-center gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-[#1a1a1a] hover:bg-[#333333] flex items-center justify-center text-[#9CA3AF] hover:text-white transition-all"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" weight="regular" />
                </a>
              ))}
            </div>
          </div>
          
          {/* Link Columns */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {/* Product */}
              <div>
                <h4 className="font-semibold text-white text-sm mb-4">
                  {footerLinks.product.title}
                </h4>
                <ul className="space-y-3">
                  {footerLinks.product.links.map((link) => (
                    <li key={link.href}>
                      <Link 
                        href={link.href}
                        className="text-sm text-[#9CA3AF] hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Resources */}
              <div>
                <h4 className="font-semibold text-white text-sm mb-4">
                  {footerLinks.resources.title}
                </h4>
                <ul className="space-y-3">
                  {footerLinks.resources.links.map((link) => (
                    <li key={link.href}>
                      <Link 
                        href={link.href}
                        className="text-sm text-[#9CA3AF] hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Company */}
              <div>
                <h4 className="font-semibold text-white text-sm mb-4">
                  {footerLinks.company.title}
                </h4>
                <ul className="space-y-3">
                  {footerLinks.company.links.map((link) => (
                    <li key={link.href}>
                      <Link 
                        href={link.href}
                        className="text-sm text-[#9CA3AF] hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Legal */}
              <div>
                <h4 className="font-semibold text-white text-sm mb-4">
                  {footerLinks.legal.title}
                </h4>
                <ul className="space-y-3">
                  {footerLinks.legal.links.map((link) => (
                    <li key={link.href}>
                      <Link 
                        href={link.href}
                        className="text-sm text-[#9CA3AF] hover:text-white transition-colors"
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
      
      {/* Bottom Bar */}
      <div className="border-t border-[#1a1a1a]">
        <div className="container py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Copyright */}
            <p className="text-sm text-[#6B7280]">
              © {new Date().getFullYear()} Kahade. All rights reserved.
            </p>
            
            {/* Compliance Badges */}
            <div className="flex items-center gap-6">
              {complianceBadges.map((badge) => (
                <div key={badge.label} className="flex items-center gap-2 text-[#6B7280]">
                  <ShieldCheck className="w-4 h-4" weight="fill" />
                  <div className="text-xs">
                    <span className="font-medium text-[#9CA3AF]">{badge.label}</span>
                    <span className="ml-1 text-[#6B7280]">{badge.sublabel}</span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Bottom Links */}
            <div className="flex items-center gap-4 text-sm text-[#6B7280]">
              <Link href="/security" className="hover:text-white transition-colors">
                Security
              </Link>
              <span>•</span>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <span>•</span>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
