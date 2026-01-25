/*
 * KAHADE FOOTER - Glassmorphic Footer
 * 
 * Design: Multi-column layout with glass effect
 * Contains: Links, social, newsletter, legal
 */

import { Link } from 'wouter';
import { Shield, Mail, Phone, MapPin, Github, Twitter, Linkedin, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const footerLinks = {
  product: [
    { label: 'Cara Kerja', href: '/how-it-works' },
    { label: 'Fitur', href: '/#features' },
    { label: 'Harga', href: '/#pricing' },
    { label: 'FAQ', href: '/#faq' },
  ],
  company: [
    { label: 'Tentang Kami', href: '/about' },
    { label: 'Karir', href: '/careers' },
    { label: 'Blog', href: '/blog' },
    { label: 'Kontak', href: '/contact' },
  ],
  legal: [
    { label: 'Syarat & Ketentuan', href: '/terms' },
    { label: 'Kebijakan Privasi', href: '/privacy' },
    { label: 'Keamanan', href: '/security' },
  ],
};

const socialLinks = [
  { icon: Twitter, href: 'https://twitter.com/kahade', label: 'Twitter' },
  { icon: Instagram, href: 'https://instagram.com/kahade', label: 'Instagram' },
  { icon: Linkedin, href: 'https://linkedin.com/company/kahade', label: 'LinkedIn' },
  { icon: Github, href: 'https://github.com/rekberkan/kahade', label: 'GitHub' },
];

export default function Footer() {
  return (
    <footer className="relative mt-20 border-t border-white/10">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/50 pointer-events-none" />
      
      <div className="container relative py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Shield className="w-8 h-8 text-accent" />
              <span className="text-xl font-display font-bold">Kahade</span>
            </Link>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm">
              Platform rekber/escrow P2P terpercaya untuk transaksi online yang aman dan transparan.
            </p>
            
            {/* Newsletter */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Berlangganan Newsletter</p>
              <div className="flex gap-2">
                <Input 
                  type="email" 
                  placeholder="email@example.com"
                  className="bg-white/5 border-white/10 focus:border-accent"
                />
                <Button className="btn-accent shrink-0">
                  Langganan
                </Button>
              </div>
            </div>
          </div>
          
          {/* Product Links */}
          <div>
            <h4 className="font-display font-semibold mb-4">Produk</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
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
          
          {/* Company Links */}
          <div>
            <h4 className="font-display font-semibold mb-4">Perusahaan</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
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
          
          {/* Contact Info */}
          <div>
            <h4 className="font-display font-semibold mb-4">Kontak</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 text-accent" />
                support@kahade.com
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4 text-accent" />
                +62 21 1234 5678
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                Jakarta, Indonesia
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            {footerLinks.legal.map((link) => (
              <Link 
                key={link.href}
                href={link.href}
                className="text-xs text-muted-foreground hover:text-accent transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
          
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Kahade. All rights reserved.
          </p>
          
          {/* Social Links */}
          <div className="flex items-center gap-3">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-accent transition-all"
                aria-label={social.label}
              >
                <social.icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
