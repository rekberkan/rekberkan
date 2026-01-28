/*
 * KAHADE MOBILE APP PAGE - Modern Design
 * Brand color: #000000
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
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="container relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F5F5F5] text-black text-sm font-medium mb-6">
                <DeviceMobile className="w-4 h-4" weight="fill" />
                Coming Soon
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-black">
                Kahade in Your Pocket
              </h1>
              <p className="text-xl text-[#6B7280] mb-8 max-w-lg">
                Experience the full power of Kahade escrow on your mobile device. 
                Secure transactions, instant notifications, and complete control wherever you go.
              </p>
              
              {/* App Store Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button className="bg-black hover:bg-[#1a1a1a] text-white px-6 py-4 h-auto rounded-xl gap-3">
                  <AppleLogo className="w-6 h-6" weight="fill" />
                  <div className="text-left">
                    <div className="text-xs opacity-80">Download on the</div>
                    <div className="font-semibold">App Store</div>
                  </div>
                </Button>
                <Button className="border-2 border-[#E5E5E5] bg-white text-black hover:bg-[#F5F5F5] px-6 py-4 h-auto rounded-xl gap-3">
                  <GooglePlayLogo className="w-6 h-6" weight="fill" />
                  <div className="text-left">
                    <div className="text-xs opacity-80">Get it on</div>
                    <div className="font-semibold">Google Play</div>
                  </div>
                </Button>
              </div>
              
              {/* QR Code */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-[#F5F5F5] max-w-sm">
                <div className="w-16 h-16 rounded-lg bg-white flex items-center justify-center border border-[#E5E5E5]">
                  <QrCode className="w-12 h-12 text-black" weight="regular" />
                </div>
                <div>
                  <div className="font-medium text-black">Scan to Download</div>
                  <div className="text-sm text-[#6B7280]">Point your camera at the QR code</div>
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
              <div className="relative mx-auto w-72 h-[580px] bg-black rounded-[3rem] p-3 shadow-2xl">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl" />
                <div className="w-full h-full bg-[#F5F5F5] rounded-[2.5rem] flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-2xl bg-black flex items-center justify-center mx-auto mb-4">
                      <DeviceMobile className="w-10 h-10 text-white" weight="fill" />
                    </div>
                    <div className="font-semibold text-lg text-black">Kahade Mobile</div>
                    <div className="text-sm text-[#6B7280]">Coming Soon</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 bg-[#FAFAFA]">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">
              Powerful Features on the Go
            </h2>
            <p className="text-xl text-[#6B7280] max-w-2xl mx-auto">
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
                className="feature-card text-center group"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#F5F5F5] flex items-center justify-center mx-auto mb-4 group-hover:bg-black group-hover:text-white transition-colors">
                  <feature.icon className="w-7 h-7" weight="fill" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-black">{feature.title}</h3>
                <p className="text-sm text-[#6B7280]">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Screenshots Section */}
      <section className="py-20 bg-white">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">
              Beautiful & Intuitive Design
            </h2>
            <p className="text-xl text-[#6B7280] max-w-2xl mx-auto">
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
                <div className="w-48 h-96 mx-auto bg-[#F5F5F5] rounded-3xl mb-4 flex items-center justify-center border border-[#E5E5E5]">
                  <span className="text-[#9CA3AF]">Preview</span>
                </div>
                <h3 className="font-semibold mb-1 text-black">{screen.title}</h3>
                <p className="text-sm text-[#6B7280]">{screen.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-black">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Get Notified When We Launch
            </h2>
            <p className="text-xl text-white/70 mb-8">
              Be the first to know when Kahade Mobile is available for download.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button className="bg-white text-black hover:bg-[#F5F5F5] px-8 py-3 h-auto font-semibold rounded-lg gap-2">
                  Create Account
                  <ArrowRight className="w-5 h-5" weight="bold" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button className="border-2 border-white/30 text-white hover:bg-white/10 px-8 py-3 h-auto font-semibold rounded-lg bg-transparent">
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
