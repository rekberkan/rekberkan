/*
 * REKBERKAN HOME PAGE - EXCLUSIVE EDITION
 * 
 * Design Philosophy:
 * - Powerful, bold, and exclusive aesthetic
 * - Strong visual hierarchy with intentional spacing
 * - High-impact hero section
 * - Structured content flow
 * - Professional and trustworthy
 */

import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  ShieldCheck, Lock, Lightning, ArrowRight, CheckCircle,
  Wallet, FileText, Clock, Star, Globe, Eye, 
  IdentificationBadge, CreditCard, Warning, UserCircle,
  Package, HandCoins, Scales, ChartLineUp, Fingerprint, Bell,
  CaretLeft, CaretRight, Play, Check, ArrowUpRight
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
};

// Features data
const features = [
  {
    icon: ShieldCheck,
    title: 'Secure Escrow',
    description: 'Funds held safely until both parties confirm satisfaction with the transaction.',
  },
  {
    icon: CreditCard,
    title: 'Multi Payment',
    description: 'Bank transfer, e-wallet, QRIS, and virtual account payments supported.',
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
    description: 'Initiate a new transaction with complete details and terms.',
  },
  {
    step: '02',
    title: 'Deposit Funds',
    description: 'Buyer deposits funds into secure escrow account.',
  },
  {
    step: '03',
    title: 'Deliver Goods',
    description: 'Seller delivers and uploads proof of delivery.',
  },
  {
    step: '04',
    title: 'Confirm Receipt',
    description: 'Buyer confirms receipt and satisfaction.',
  },
  {
    step: '05',
    title: 'Release Funds',
    description: 'Funds automatically released to seller.',
  },
];

// Pricing data
const pricingPlans = [
  {
    name: 'Starter',
    description: 'For individuals and small transactions',
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
    description: 'For freelancers and growing businesses',
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
    description: 'For large organizations',
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
    content: 'Rekberkan has transformed how I handle client payments. No more chasing invoices or worrying about non-payment.',
    rating: 5,
    avatar: 'SW'
  },
  {
    name: 'Michael Chen',
    role: 'E-commerce Owner',
    content: 'As an online seller, trust is everything. Rekberkan helps me build that trust with new customers.',
    rating: 5,
    avatar: 'MC'
  },
  {
    name: 'Emily Rodriguez',
    role: 'Digital Marketer',
    content: 'We use Rekberkan for all our client projects now. The transparency and security features are exactly what we needed.',
    rating: 5,
    avatar: 'ER'
  },
];

// Trust signals
const trustSignals = [
  { value: 'Rp 50M+', label: 'Total Secured' },
  { value: '10,000+', label: 'Active Users' },
  { value: '99.9%', label: 'Success Rate' },
  { value: '24/7', label: 'Support' },
];

export default function Home() {
  const [isYearly, setIsYearly] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);

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
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-gradient-radial from-gray-100 to-transparent rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-radial from-gray-100 to-transparent rounded-full blur-3xl opacity-40" />
        
        <div className="container relative z-10">
          <motion.div 
            style={{ opacity: heroOpacity, scale: heroScale }}
            className="max-w-5xl mx-auto text-center"
          >
            <motion.div
              initial="initial"
              animate="animate"
              variants={staggerContainer}
            >
              {/* Badge */}
              <motion.div variants={fadeInUp} className="mb-8">
                <Link href="/mobile-app" className="badge-exclusive inline-flex group">
                  <span className="w-2 h-2 rounded-full bg-[#0A0A0A] animate-pulse" />
                  <span>Introducing Rekberkan Mobile App</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" weight="bold" />
                </Link>
              </motion.div>
              
              {/* Headline */}
              <motion.h1 
                variants={fadeInUp}
                className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[0.95] mb-8 tracking-tight"
              >
                <span className="block">Secure every</span>
                <span className="block mt-2">
                  transaction with
                </span>
                <span className="block mt-2 relative inline-block">
                  <span className="relative z-10">trusted escrow</span>
                  <motion.span 
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.8, duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                    className="absolute bottom-2 left-0 right-0 h-4 bg-[#0A0A0A]/10 -z-0 origin-left"
                  />
                </span>
              </motion.h1>
              
              {/* Subheadline */}
              <motion.p 
                variants={fadeInUp}
                className="text-xl md:text-2xl text-[#737373] mb-12 max-w-2xl mx-auto leading-relaxed"
              >
                The most trusted escrow platform in Indonesia. 
                Full protection for buyers and sellers in every deal.
              </motion.p>
              
              {/* CTAs */}
              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <Button className="btn-primary btn-lg group">
                    Get Started Free
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" weight="bold" />
                  </Button>
                </Link>
                <Link href="/how-it-works">
                  <Button className="btn-secondary btn-lg">
                    <Play className="mr-2 w-5 h-5" weight="fill" />
                    See How It Works
                  </Button>
                </Link>
              </motion.div>
              
              {/* Trust Text */}
              <motion.p variants={fadeInUp} className="mt-8 text-sm text-[#A3A3A3]">
                Free forever. No credit card required.
              </motion.p>
            </motion.div>
          </motion.div>
          
          {/* Scroll Indicator */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2"
          >
            <motion.div 
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-6 h-10 border-2 border-[#E8E8E8] rounded-full flex justify-center pt-2"
            >
              <motion.div className="w-1.5 h-1.5 bg-[#0A0A0A] rounded-full" />
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      {/* ========== TRUST SIGNALS ========== */}
      <section className="py-20 border-y border-[#E8E8E8] bg-[#FAFAFA]">
        <div className="container">
          <div className="stats-grid">
            {trustSignals.map((signal, index) => (
              <motion.div 
                key={signal.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="stat-item"
              >
                <div className="stat-value">{signal.value}</div>
                <div className="stat-label">{signal.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* ========== PROBLEM SECTION ========== */}
      <section className="section-padding">
        <div className="container">
          <div className="section-header">
            <motion.span 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="section-label"
            >
              The Problem
            </motion.span>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="section-title"
            >
              Risk exists on both sides
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="section-description"
            >
              Without proper protection, both buyers and sellers face significant risks in online transactions.
            </motion.p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Buyer Risks */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative p-8 md:p-10 rounded-2xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-white"
            >
              <div className="absolute top-0 left-8 -translate-y-1/2">
                <span className="px-4 py-2 bg-red-100 text-red-700 text-sm font-bold rounded-full">
                  BUYER RISKS
                </span>
              </div>
              <div className="flex items-center gap-4 mb-8 mt-4">
                <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
                  <UserCircle className="w-8 h-8 text-red-600" weight="duotone" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-red-900">Without Protection</h3>
                  <p className="text-sm text-red-600">High risk of losing money</p>
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
                  <li key={index} className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Warning className="w-3.5 h-3.5 text-red-600" weight="fill" />
                    </div>
                    <span className="text-red-800">{risk}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
            
            {/* Seller Risks */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative p-8 md:p-10 rounded-2xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white"
            >
              <div className="absolute top-0 left-8 -translate-y-1/2">
                <span className="px-4 py-2 bg-orange-100 text-orange-700 text-sm font-bold rounded-full">
                  SELLER RISKS
                </span>
              </div>
              <div className="flex items-center gap-4 mb-8 mt-4">
                <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center">
                  <Package className="w-8 h-8 text-orange-600" weight="duotone" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-orange-900">Without Protection</h3>
                  <p className="text-sm text-orange-600">High risk of fraud</p>
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
                  <li key={index} className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Warning className="w-3.5 h-3.5 text-orange-600" weight="fill" />
                    </div>
                    <span className="text-orange-800">{risk}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
          
          {/* Solution Banner */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 max-w-4xl mx-auto"
          >
            <div className="card-dark p-10 md:p-14 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-grid opacity-10" />
              <div className="relative z-10">
                <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck className="w-10 h-10 text-white" weight="duotone" />
                </div>
                <h3 className="text-3xl md:text-4xl font-bold mb-4">Rekberkan eliminates these risks</h3>
                <p className="text-white/70 text-lg max-w-2xl mx-auto mb-8">
                  Our escrow system holds funds securely until both parties are satisfied, 
                  ensuring fair and protected transactions for everyone.
                </p>
                <Link href="/register">
                  <Button className="bg-white text-[#0A0A0A] hover:bg-gray-100 btn-lg">
                    Start Secure Transaction
                    <ArrowRight className="ml-2 w-5 h-5" weight="bold" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* ========== FEATURES SECTION ========== */}
      <section id="features" className="section-padding bg-[#FAFAFA]">
        <div className="container">
          <div className="section-header">
            <motion.span 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="section-label"
            >
              Features
            </motion.span>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="section-title"
            >
              Why choose Rekberkan?
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="section-description"
            >
              The most comprehensive escrow platform with cutting-edge security features.
            </motion.p>
          </div>
          
          <div className="feature-grid">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="feature-card group"
              >
                <div className="feature-icon">
                  <feature.icon className="w-7 h-7" weight="duotone" />
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* ========== HOW IT WORKS ========== */}
      <section className="section-padding">
        <div className="container">
          <div className="section-header">
            <motion.span 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="section-label"
            >
              Process
            </motion.span>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="section-title"
            >
              How Rekberkan works
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="section-description"
            >
              Simple 5-step process for secure and trusted transactions.
            </motion.p>
          </div>
          
          <div className="timeline">
            {steps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="timeline-item"
              >
                <div className="timeline-number">{step.step}</div>
                <h3 className="timeline-title">{step.title}</h3>
                <p className="timeline-description">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* ========== PRICING SECTION ========== */}
      <section id="pricing" className="section-padding bg-[#FAFAFA]">
        <div className="container">
          <div className="section-header">
            <motion.span 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="section-label"
            >
              Pricing
            </motion.span>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="section-title"
            >
              Simple, transparent pricing
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="section-description"
            >
              Choose the plan that fits your needs. No hidden fees.
            </motion.p>
            
            {/* Billing Toggle */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-4 mt-8"
            >
              <span className={`text-sm font-medium ${!isYearly ? 'text-[#0A0A0A]' : 'text-[#737373]'}`}>Monthly</span>
              <button
                onClick={() => setIsYearly(!isYearly)}
                className={`relative w-14 h-7 rounded-full transition-colors ${isYearly ? 'bg-[#0A0A0A]' : 'bg-[#E8E8E8]'}`}
              >
                <span 
                  className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${isYearly ? 'left-8' : 'left-1'}`}
                />
              </button>
              <span className={`text-sm font-medium ${isYearly ? 'text-[#0A0A0A]' : 'text-[#737373]'}`}>
                Yearly
                <span className="ml-2 px-2 py-0.5 bg-[#0A0A0A] text-white text-xs rounded-full">Save 20%</span>
              </span>
            </motion.div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`pricing-card ${plan.popular ? 'pricing-card-featured' : ''}`}
              >
                {plan.popular && (
                  <div className="pricing-badge">Most Popular</div>
                )}
                <div className="pricing-name">{plan.name}</div>
                <p className={`text-sm mb-6 ${plan.popular ? 'text-white/70' : 'text-[#737373]'}`}>
                  {plan.description}
                </p>
                <div className="pricing-price">
                  {formatPrice(isYearly ? plan.yearlyPrice : plan.monthlyPrice)}
                </div>
                <div className="pricing-period">
                  {plan.monthlyPrice === 0 ? 'forever' : isYearly ? '/year' : '/month'}
                </div>
                <ul className="pricing-features">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="pricing-feature">
                      <Check className={`w-5 h-5 shrink-0 ${plan.popular ? 'text-white' : 'text-[#0A0A0A]'}`} weight="bold" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <Button className={`w-full ${plan.popular ? 'bg-white text-[#0A0A0A] hover:bg-gray-100' : 'btn-primary'}`}>
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* ========== TESTIMONIALS ========== */}
      <section className="section-padding">
        <div className="container">
          <div className="section-header">
            <motion.span 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="section-label"
            >
              Testimonials
            </motion.span>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="section-title"
            >
              Trusted by thousands
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="section-description"
            >
              See what our users have to say about their experience.
            </motion.p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="testimonial-card"
              >
                <div className="flex gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-[#0A0A0A]" weight="fill" />
                  ))}
                </div>
                <p className="testimonial-content">{testimonial.content}</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{testimonial.avatar}</div>
                  <div>
                    <div className="testimonial-name">{testimonial.name}</div>
                    <div className="testimonial-role">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* ========== FINAL CTA ========== */}
      <section className="section-padding bg-[#0A0A0A] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl" />
        
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
            >
              Ready to secure your transactions?
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-white/70 mb-10 max-w-2xl mx-auto"
            >
              Join thousands of users who trust Rekberkan for their online transactions. 
              Start for free today.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link href="/register">
                <Button className="bg-white text-[#0A0A0A] hover:bg-gray-100 btn-lg group">
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" weight="bold" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button className="border-2 border-white/30 bg-transparent text-white hover:bg-white/10 btn-lg">
                  Contact Sales
                </Button>
              </Link>
            </motion.div>
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="mt-8 text-sm text-white/50"
            >
              No credit card required. Free plan available forever.
            </motion.p>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
