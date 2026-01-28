/*
 * KAHADE HOME PAGE - Modern Landing Page
 * 
 * Design inspired by Baselayer (header/hero) and ClickUp (CTA/footer)
 * Brand color: #000000
 * 
 * Sections:
 * 1. Hero - Clean headline, CTAs, hero illustration
 * 2. Trust Signals - Stats and logos
 * 3. Risk Section - Buyer/Seller risks
 * 4. Features - Feature grid
 * 5. How It Works - Step timeline
 * 6. Pricing - Pricing cards
 * 7. Testimonials - Customer reviews
 * 8. Final CTA - Strong call-to-action
 */

import { useState, useRef, useEffect } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, Lock, Lightning, Users, ArrowRight, CheckCircle,
  Wallet, FileText, Clock, Star, CaretRight, Globe, Eye, 
  IdentificationBadge, Headset, CreditCard, Warning, UserCircle,
  Package, HandCoins, Scales, ChartLineUp, Fingerprint, Bell,
  CaretLeft, Quotes, Play, Check
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08
    }
  }
};

// Features data
const features = [
  {
    icon: ShieldCheck,
    title: 'Secure Escrow',
    description: 'Funds are held safely until both parties confirm satisfaction with the transaction.',
  },
  {
    icon: CreditCard,
    title: 'Multi Payment',
    description: 'Support for bank transfer, e-wallet, QRIS, and virtual account payments.',
  },
  {
    icon: Lock,
    title: 'Bank-Level Security',
    description: '256-bit encryption, 2FA, and enterprise-grade security infrastructure.',
  },
  {
    icon: Lightning,
    title: 'Fast Processing',
    description: 'Transactions processed in minutes with real-time status updates.',
  },
  {
    icon: Eye,
    title: 'Full Transparency',
    description: 'Track every transaction step with complete visibility and audit trail.',
  },
  {
    icon: IdentificationBadge,
    title: 'KYC Verification',
    description: 'Identity verification system for enhanced security and trust.',
  },
  {
    icon: Scales,
    title: 'Dispute Resolution',
    description: 'Professional mediation service for fair dispute handling.',
  },
  {
    icon: Bell,
    title: 'Real-time Alerts',
    description: 'Instant notifications for all transaction activities and updates.',
  },
  {
    icon: Fingerprint,
    title: 'Biometric Auth',
    description: 'Advanced biometric authentication for mobile app users.',
  },
];

// Steps data
const steps = [
  {
    step: '01',
    title: 'Create Transaction',
    description: 'Buyer or seller initiates a new transaction with complete details and terms.',
    icon: FileText,
  },
  {
    step: '02',
    title: 'Deposit Funds',
    description: 'Buyer deposits funds into Kahade\'s secure escrow account.',
    icon: Wallet,
  },
  {
    step: '03',
    title: 'Deliver Goods',
    description: 'Seller delivers the goods or services and uploads proof of delivery.',
    icon: Package,
  },
  {
    step: '04',
    title: 'Confirm Receipt',
    description: 'Buyer confirms receipt and satisfaction with the delivery.',
    icon: CheckCircle,
  },
  {
    step: '05',
    title: 'Release Funds',
    description: 'Funds are automatically released to the seller upon confirmation.',
    icon: HandCoins,
  },
];

// Pricing data
const pricingPlans = [
  {
    name: 'Starter',
    description: 'Perfect for individuals and small transactions',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      'Up to 5 transactions/month',
      'Basic escrow protection',
      'Email support',
      'Standard processing',
      'Basic analytics',
    ],
    cta: 'Get Started Free',
    popular: false,
  },
  {
    name: 'Professional',
    description: 'Ideal for freelancers and growing businesses',
    monthlyPrice: 299000,
    yearlyPrice: 2990000,
    features: [
      'Unlimited transactions',
      'Advanced escrow protection',
      'Priority support 24/7',
      'Fast processing',
      'Advanced analytics',
      'API access',
      'Custom branding',
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    description: 'For large organizations with custom needs',
    monthlyPrice: 999000,
    yearlyPrice: 9990000,
    features: [
      'Everything in Professional',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee',
      'White-label solution',
      'Advanced security',
      'Compliance support',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

// Testimonials data
const testimonials = [
  {
    name: 'Sarah Wijaya',
    role: 'Freelance Designer',
    company: 'Independent',
    content: 'Kahade has transformed how I handle client payments. No more chasing invoices or worrying about non-payment. The escrow system gives both me and my clients peace of mind.',
    rating: 5,
    avatar: 'SW'
  },
  {
    name: 'Michael Chen',
    role: 'E-commerce Owner',
    company: 'TechGadgets Store',
    content: 'As an online seller, trust is everything. Kahade helps me build that trust with new customers. The transaction process is smooth and the support team is incredibly responsive.',
    rating: 5,
    avatar: 'MC'
  },
  {
    name: 'Emily Rodriguez',
    role: 'Digital Marketer',
    company: 'Growth Agency',
    content: 'We use Kahade for all our client projects now. The transparency and security features are exactly what we needed. Highly recommend for any service-based business.',
    rating: 5,
    avatar: 'ER'
  },
];

// Trust signals
const trustSignals = [
  { value: 'Rp 50M+', label: 'Total Transactions' },
  { value: '10,000+', label: 'Active Users' },
  { value: '99.9%', label: 'Success Rate' },
  { value: '24/7', label: 'Support Available' },
];

export default function Home() {
  const [isYearly, setIsYearly] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number) => {
    if (price === 0) return 'Free';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* ========== HERO SECTION ========== */}
      <section className="relative pt-28 pb-20 overflow-hidden">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div 
              initial="initial"
              animate="animate"
              variants={staggerContainer}
              className="text-center lg:text-left"
            >
              {/* Announcement Badge */}
              <motion.div variants={fadeInUp}>
                <Link href="/mobile-app" className="badge-announcement inline-flex mb-6">
                  <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
                  <span>Introducing Kahade Mobile App</span>
                  <ArrowRight className="w-4 h-4" weight="bold" />
                </Link>
              </motion.div>
              
              {/* Headline */}
              <motion.h1 
                variants={fadeInUp}
                className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] mb-6 text-black"
              >
                Secure transactions with{' '}
                <span className="relative">
                  trusted escrow
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                    <path d="M2 10C50 4 150 2 298 10" stroke="#000" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                </span>{' '}
                protection
              </motion.h1>
              
              {/* Subheadline */}
              <motion.p 
                variants={fadeInUp}
                className="text-lg text-[#6B7280] mb-8 max-w-xl mx-auto lg:mx-0"
              >
                Protect every transaction with our secure and reliable escrow system. 
                Full protection for both buyers and sellers in every deal.
              </motion.p>
              
              {/* CTAs */}
              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/register">
                  <Button className="btn-primary text-base px-8 py-4 h-auto group">
                    Get Started Free
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" weight="bold" />
                  </Button>
                </Link>
                <Link href="/how-it-works">
                  <Button className="btn-secondary text-base px-8 py-4 h-auto">
                    <Play className="mr-2 w-5 h-5" weight="fill" />
                    See How It Works
                  </Button>
                </Link>
              </motion.div>
              
              {/* Trust Text */}
              <motion.p variants={fadeInUp} className="mt-6 text-sm text-[#9CA3AF]">
                Free forever. No credit card required.
              </motion.p>
            </motion.div>
            
            {/* Right - Hero Illustration */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="hidden lg:block relative"
            >
              <div className="relative">
                <img 
                  src="/images/redesign/hero-illustration.png" 
                  alt="Secure Escrow Illustration" 
                  className="w-full max-w-lg mx-auto"
                />
                
                {/* Floating Card - Top Right */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="absolute -top-4 -right-4 floating-card"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" weight="fill" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-black">Transaction Complete</div>
                      <div className="text-xs text-[#6B7280]">Funds released securely</div>
                    </div>
                  </div>
                </motion.div>
                
                {/* Floating Card - Bottom Left */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="absolute -bottom-4 -left-4 floating-card"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#F5F5F5] flex items-center justify-center">
                      <Lock className="w-5 h-5 text-black" weight="fill" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-black">256-bit Encryption</div>
                      <div className="text-xs text-[#6B7280]">Bank-level security</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* ========== TRUST SIGNALS ========== */}
      <section className="py-12 border-y border-[#E5E5E5] bg-[#FAFAFA]">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {trustSignals.map((signal, index) => (
              <motion.div 
                key={signal.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-black">{signal.value}</div>
                <div className="text-sm text-[#6B7280] mt-1">{signal.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* ========== RISK SECTION ========== */}
      <section className="py-24">
        <div className="container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">
              Risk exists on both sides
            </h2>
            <p className="text-[#6B7280] max-w-2xl mx-auto">
              Without proper protection, both buyers and sellers face significant risks in online transactions.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Buyer Risks */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-red-50 rounded-2xl p-8 border border-red-100"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <UserCircle className="w-6 h-6 text-red-600" weight="duotone" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-red-900">Buyer Risks</h3>
                  <p className="text-sm text-red-600">Without escrow protection</p>
                </div>
              </div>
              <ul className="space-y-4">
                {[
                  'Paying upfront without guarantee of delivery',
                  'Receiving counterfeit or damaged goods',
                  'Seller disappears after payment',
                  'No recourse for disputes',
                  'Difficulty getting refunds'
                ].map((risk, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Warning className="w-5 h-5 text-red-500 shrink-0 mt-0.5" weight="fill" />
                    <span className="text-red-800 text-sm">{risk}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
            
            {/* Seller Risks */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-orange-50 rounded-2xl p-8 border border-orange-100"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Package className="w-6 h-6 text-orange-600" weight="duotone" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-orange-900">Seller Risks</h3>
                  <p className="text-sm text-orange-600">Without escrow protection</p>
                </div>
              </div>
              <ul className="space-y-4">
                {[
                  'Delivering goods without payment confirmation',
                  'Fraudulent chargebacks after delivery',
                  'Buyer claims non-receipt falsely',
                  'Payment reversals and disputes',
                  'Lost time and resources on bad deals'
                ].map((risk, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Warning className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" weight="fill" />
                    <span className="text-orange-800 text-sm">{risk}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
          
          {/* Solution Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 bg-black rounded-2xl p-8 text-white text-center"
          >
            <ShieldCheck className="w-12 h-12 mx-auto mb-4" weight="duotone" />
            <h3 className="text-2xl font-bold mb-2">Kahade eliminates these risks</h3>
            <p className="text-white/70 max-w-2xl mx-auto">
              Our escrow system holds funds securely until both parties are satisfied, 
              ensuring fair and protected transactions for everyone.
            </p>
          </motion.div>
        </div>
      </section>
      
      {/* ========== FEATURES SECTION ========== */}
      <section id="features" className="py-24 bg-[#FAFAFA]">
        <div className="container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">
              Why choose Kahade?
            </h2>
            <p className="text-[#6B7280] max-w-2xl mx-auto">
              The most comprehensive escrow platform with cutting-edge security features.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="feature-card group"
              >
                <div className="w-12 h-12 rounded-xl bg-[#F5F5F5] flex items-center justify-center mb-4 group-hover:bg-black group-hover:text-white transition-colors">
                  <feature.icon className="w-6 h-6" weight="duotone" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-black">{feature.title}</h3>
                <p className="text-sm text-[#6B7280]">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* ========== HOW IT WORKS ========== */}
      <section className="py-24">
        <div className="container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">
              How Kahade works
            </h2>
            <p className="text-[#6B7280] max-w-2xl mx-auto">
              Simple 5-step process for secure and trusted transactions.
            </p>
          </motion.div>
          
          <div className="relative">
            {/* Timeline line - desktop */}
            <div className="hidden lg:block absolute top-20 left-0 right-0 h-0.5 bg-[#E5E5E5]" />
            
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
              {steps.map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative text-center"
                >
                  {/* Step number */}
                  <div className="w-10 h-10 rounded-full bg-black text-white font-bold text-sm flex items-center justify-center mx-auto mb-4 relative z-10">
                    {step.step}
                  </div>
                  
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-2xl bg-[#F5F5F5] flex items-center justify-center mx-auto mb-4">
                    <step.icon className="w-7 h-7 text-black" weight="duotone" />
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-2 text-black">{step.title}</h3>
                  <p className="text-sm text-[#6B7280]">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* ========== PRICING SECTION ========== */}
      <section id="pricing" className="py-24 bg-[#FAFAFA]">
        <div className="container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">
              Transparent pricing
            </h2>
            <p className="text-[#6B7280] max-w-2xl mx-auto mb-8">
              Choose the plan that fits your needs. No hidden fees, no surprises.
            </p>
            
            {/* Toggle */}
            <div className="inline-flex items-center gap-4 p-1 bg-white rounded-xl border border-[#E5E5E5]">
              <button
                onClick={() => setIsYearly(false)}
                className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  !isYearly ? 'bg-black text-white' : 'text-[#6B7280] hover:text-black'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isYearly ? 'bg-black text-white' : 'text-[#6B7280] hover:text-black'
                }`}
              >
                Yearly <span className="text-green-600 ml-1">Save 20%</span>
              </button>
            </div>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative rounded-2xl p-8 ${
                  plan.popular 
                    ? 'bg-black text-white border-2 border-black scale-105' 
                    : 'bg-white border border-[#E5E5E5]'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-white text-black text-xs font-semibold rounded-full border border-black">
                    Most Popular
                  </div>
                )}
                
                <h3 className={`text-xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-black'}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mb-6 ${plan.popular ? 'text-white/70' : 'text-[#6B7280]'}`}>
                  {plan.description}
                </p>
                
                <div className="mb-6">
                  <span className={`text-4xl font-bold ${plan.popular ? 'text-white' : 'text-black'}`}>
                    {formatPrice(isYearly ? plan.yearlyPrice : plan.monthlyPrice)}
                  </span>
                  {plan.monthlyPrice > 0 && (
                    <span className={`text-sm ${plan.popular ? 'text-white/70' : 'text-[#6B7280]'}`}>
                      /{isYearly ? 'year' : 'month'}
                    </span>
                  )}
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className={`w-5 h-5 shrink-0 ${plan.popular ? 'text-white' : 'text-black'}`} weight="bold" />
                      <span className={`text-sm ${plan.popular ? 'text-white/90' : 'text-[#6B7280]'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                
                <Link href="/register">
                  <Button 
                    className={`w-full py-3 rounded-lg font-semibold transition-all ${
                      plan.popular 
                        ? 'bg-white text-black hover:bg-[#F5F5F5]' 
                        : 'bg-black text-white hover:bg-[#1a1a1a]'
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* ========== TESTIMONIALS ========== */}
      <section className="py-24">
        <div className="container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">
              Loved by thousands
            </h2>
            <p className="text-[#6B7280] max-w-2xl mx-auto">
              See what our customers have to say about their experience with Kahade.
            </p>
          </motion.div>
          
          <div className="max-w-4xl mx-auto">
            <motion.div
              key={currentTestimonial}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-[#FAFAFA] rounded-2xl p-8 md:p-12 text-center"
            >
              <Quotes className="w-12 h-12 mx-auto mb-6 text-[#E5E5E5]" weight="fill" />
              <p className="text-lg md:text-xl text-black mb-8 leading-relaxed">
                "{testimonials[currentTestimonial].content}"
              </p>
              <div className="flex items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-semibold">
                  {testimonials[currentTestimonial].avatar}
                </div>
                <div className="text-left">
                  <div className="font-semibold text-black">{testimonials[currentTestimonial].name}</div>
                  <div className="text-sm text-[#6B7280]">
                    {testimonials[currentTestimonial].role} at {testimonials[currentTestimonial].company}
                  </div>
                </div>
              </div>
              
              {/* Dots */}
              <div className="flex items-center justify-center gap-2 mt-8">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentTestimonial ? 'bg-black w-6' : 'bg-[#E5E5E5]'
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* ========== FINAL CTA ========== */}
      <section className="py-24 bg-black">
        <div className="container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
              Start securing your transactions today
            </h2>
            <p className="text-white/70 max-w-2xl mx-auto mb-8 text-lg">
              Join thousands of users who trust Kahade for their online transactions.
              Get started for free, no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button className="bg-white text-black hover:bg-[#F5F5F5] px-8 py-4 h-auto text-base font-semibold rounded-lg group">
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" weight="bold" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button className="border-2 border-white/30 text-white hover:bg-white/10 px-8 py-4 h-auto text-base font-semibold rounded-lg bg-transparent">
                  Contact Sales
                </Button>
              </Link>
            </div>
            
            {/* Trust badges */}
            <div className="flex items-center justify-center gap-8 mt-12 text-white/50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" weight="fill" />
                <span className="text-sm">SOC 2 Certified</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5" weight="fill" />
                <span className="text-sm">256-bit Encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5" weight="fill" />
                <span className="text-sm">GDPR Compliant</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
