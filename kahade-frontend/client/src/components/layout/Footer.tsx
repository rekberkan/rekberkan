/*
 * KAHADE FOOTER - Exact Structure Required
 * 
 * Structure:
 * - Logo at top
 * - Slogan/description under logo
 * - 4 link groups (Product, Support, Company, Legal) with 4 links each
 * - Desktop: 2x2 grid layout (Product/Support left, Company/Legal right)
 * - Social media icons (Phosphor only)
 * - Copyright line
 */

import { Link } from 'wouter';
import { 
  TwitterLogo, 
  InstagramLogo, 
  LinkedinLogo, 
  GithubLogo,
  YoutubeLogo,
  DiscordLogo
} from '@phosphor-icons/react';

const footerLinks = {
  product: {
    title: 'Product',
    links: [
      { label: 'Web App', href: '/app' },
      { label: 'Mobile App', href: '/mobile-app' },
      { label: 'Pricing', href: '/#pricing' },
      { label: 'Blog', href: '/blog' },
    ]
  },
  support: {
    title: 'Support',
    links: [
      { label: 'Help Center', href: '/help' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Feedback', href: '/feedback' },
      { label: 'Contact Us', href: '/contact' },
    ]
  },
  company: {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Whitepaper', href: '/whitepaper' },
      { label: 'Press / News', href: '/press' },
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

export default function Footer() {
  return (
    <footer className="bg-white border-t border-border">
      <div className="container py-16">
        {/* Top Section: Logo + Description + Links */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Logo & Description */}
          <div className="lg:col-span-4">
            <Link href="/" className="inline-block mb-4">
              <img 
                src="/images/logo.svg" 
                alt="Kahade" 
                className="h-10 w-auto"
              />
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
              Kahade is the trusted P2P escrow platform for secure online transactions. 
              We protect both buyers and sellers with our transparent and reliable escrow service.
            </p>
          </div>
          
          {/* Link Groups - 2x2 Grid on Desktop */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {/* Left Column: Product (top) + Support (bottom) */}
              <div className="space-y-8 md:contents">
                {/* Product */}
                <div>
                  <h4 className="font-semibold text-foreground mb-4">
                    {footerLinks.product.title}
                  </h4>
                  <ul className="space-y-3">
                    {footerLinks.product.links.map((link) => (
                      <li key={link.href}>
                        <Link 
                          href={link.href}
                          className="text-sm text-muted-foreground hover:text-accent transition-colors"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Support */}
                <div>
                  <h4 className="font-semibold text-foreground mb-4">
                    {footerLinks.support.title}
                  </h4>
                  <ul className="space-y-3">
                    {footerLinks.support.links.map((link) => (
                      <li key={link.href}>
                        <Link 
                          href={link.href}
                          className="text-sm text-muted-foreground hover:text-accent transition-colors"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {/* Right Column: Company (top) + Legal (bottom) */}
              <div className="space-y-8 md:contents">
                {/* Company */}
                <div>
                  <h4 className="font-semibold text-foreground mb-4">
                    {footerLinks.company.title}
                  </h4>
                  <ul className="space-y-3">
                    {footerLinks.company.links.map((link) => (
                      <li key={link.href}>
                        <Link 
                          href={link.href}
                          className="text-sm text-muted-foreground hover:text-accent transition-colors"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Legal */}
                <div>
                  <h4 className="font-semibold text-foreground mb-4">
                    {footerLinks.legal.title}
                  </h4>
                  <ul className="space-y-3">
                    {footerLinks.legal.links.map((link) => (
                      <li key={link.href}>
                        <Link 
                          href={link.href}
                          className="text-sm text-muted-foreground hover:text-accent transition-colors"
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
        
        {/* Social Media Icons */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Social Links */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-secondary hover:bg-accent/10 flex items-center justify-center text-muted-foreground hover:text-accent transition-all"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" weight="regular" />
                </a>
              ))}
            </div>
            
            {/* Copyright */}
            <p className="text-sm text-muted-foreground">
              © Kahade 2026 All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
