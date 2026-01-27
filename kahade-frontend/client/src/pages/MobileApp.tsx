/*
 * KAHADE MOBILE APP PAGE
 * Icons: Phosphor Icons only
 */

import { motion } from 'framer-motion';
import { Link } from 'wouter';
import {
  DeviceMobile, AppleLogo, GooglePlayLogo, QrCode,
  ShieldCheck, Lightning, Bell, Fingerprint, ArrowRight
} from '@phosphor-icons/react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: ShieldCheck,
    title: 'Secure Transactions',
    description: 'Bank-level encryption and biometric authentication keep your funds safe.'
  },
  {
    icon: Lightning,
    title: 'Instant Notifications',
    description: 'Real-time push notifications for every transaction update.'
  },
  {
    icon: Bell,
    title: 'Smart Alerts',
    description: 'Customizable alerts for payment deadlines and important milestones.'
  },
  {
    icon: Fingerprint,
    title: 'Biometric Login',
    description: 'Quick and secure access with Face ID or fingerprint authentication.'
  }
];

const screenshots = [
  { title: 'Dashboard', description: 'Track all your transactions at a glance' },
  { title: 'Transaction Details', description: 'Full visibility into every escrow' },
  { title: 'Wallet', description: 'Manage your balance with ease' },
  { title: 'Notifications', description: 'Stay updated on every step' }
];

export default function MobileApp() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5" />
        <div className="container relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
                <DeviceMobile className="w-4 h-4" weight="fill" />
                Coming Soon
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Kahade in Your{' '}
                <span className="gradient-text">Pocket</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-lg">
                Experience the full power of Kahade escrow on your mobile device. 
                Secure transactions, instant notifications, and complete control wherever you go.
              </p>
              
              {/* App Store Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button size="lg" className="btn-accent gap-3">
                  <AppleLogo className="w-6 h-6" weight="fill" />
                  <div className="text-left">
                    <div className="text-xs opacity-80">Download on the</div>
                    <div className="font-semibold">App Store</div>
                  </div>
                </Button>
                <Button size="lg" variant="outline" className="gap-3">
                  <GooglePlayLogo className="w-6 h-6" weight="fill" />
                  <div className="text-left">
                    <div className="text-xs opacity-80">Get it on</div>
                    <div className="font-semibold">Google Play</div>
                  </div>
                </Button>
              </div>
              
              {/* QR Code */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 max-w-sm">
                <div className="w-16 h-16 rounded-lg bg-white flex items-center justify-center">
                  <QrCode className="w-12 h-12 text-foreground" weight="regular" />
                </div>
                <div>
                  <div className="font-medium">Scan to Download</div>
                  <div className="text-sm text-muted-foreground">Point your camera at the QR code</div>
                </div>
              </div>
            </motion.div>
            
            {/* Phone Mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative mx-auto w-72 h-[580px] bg-gradient-to-br from-gray-900 to-gray-800 rounded-[3rem] p-3 shadow-2xl">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl" />
                <div className="w-full h-full bg-gradient-to-br from-accent/20 to-primary/20 rounded-[2.5rem] flex items-center justify-center">
                  <div className="text-center">
                    <DeviceMobile className="w-16 h-16 mx-auto mb-4 text-accent" weight="fill" />
                    <div className="font-semibold text-lg">Kahade Mobile</div>
                    <div className="text-sm text-muted-foreground">Coming Soon</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Powerful Features on the Go
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage your escrow transactions from your mobile device.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-6 text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-7 h-7 text-accent" weight="fill" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Screenshots Section */}
      <section className="py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Beautiful & Intuitive Design
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A seamless experience designed for simplicity and efficiency.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {screenshots.map((screen, index) => (
              <motion.div
                key={screen.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-48 h-96 mx-auto bg-gradient-to-br from-secondary to-secondary/50 rounded-3xl mb-4 flex items-center justify-center">
                  <span className="text-muted-foreground">Preview</span>
                </div>
                <h3 className="font-semibold mb-1">{screen.title}</h3>
                <p className="text-sm text-muted-foreground">{screen.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-accent/10 to-primary/10">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Get Notified When We Launch
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Be the first to know when Kahade Mobile is available for download.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="btn-accent gap-2">
                  Create Account
                  <ArrowRight className="w-5 h-5" weight="bold" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline">
                  Contact Us
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
