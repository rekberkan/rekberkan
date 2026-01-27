/*
 * KAHADE HOME PAGE - Complete Landing Page
 * 
 * Sections:
 * 1. Hero - Strong headline, CTAs, trust signals
 * 2. Risk on Both Sides - Split layout showing buyer/seller risks
 * 3. Why Choose Kahade - Feature grid (6-9 features)
 * 4. How Kahade Works - Step-based timeline (4-6 steps)
 * 5. Transparent Pricing - 3 tier pricing cards with toggle
 * 6. What Users Say - Slider/carousel testimonials
 * 7. Final CTA - Strong call-to-action banner
 */

import { useState, useRef, useEffect } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, Lock, Lightning, Users, ArrowRight, CheckCircle,
  Wallet, FileText, Clock, Star, CaretRight, Globe, Eye, 
  IdentificationBadge, Headset, CreditCard, Warning, UserCircle,
  Package, HandCoins, Scales, ChartLineUp, Fingerprint, Bell,
  CaretLeft, Quotes
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Section 3: Features
const features = [
  {
    icon: ShieldCheck,
    title: 'Secure Escrow',
    description: 'Funds are held safely until both parties are satisfied with the transaction.',
  },
  {
    icon: CreditCard,
    title: 'Multi Payment',
    description: 'Various payment methods: bank transfer, e-wallet, and virtual account.',
  },
  {
    icon: Lock,
    title: 'Multi-Layer Security',
    description: 'End-to-end encryption, 2FA, and enterprise-grade security systems.',
  },
  {
    icon: Lightning,
    title: 'Fast Processing',
    description: 'Transactions processed in minutes, not days.',
  },
  {
    icon: Eye,
    title: 'Full Transparency',
    description: 'Monitor transaction status in real-time anytime.',
  },
  {
    icon: IdentificationBadge,
    title: 'KYC Verification',
    description: 'Identity verification system for additional security.',
  },
  {
    icon: Scales,
    title: 'Fair Dispute Resolution',
    description: 'Professional mediation for any transaction disputes.',
  },
  {
    icon: Bell,
    title: 'Real-time Notifications',
    description: 'Stay updated with instant alerts on all transaction activities.',
  },
  {
    icon: Fingerprint,
    title: 'Biometric Auth',
    description: 'Advanced biometric authentication for mobile users.',
  },
];

// Section 4: Steps
const steps = [
  {
    step: '01',
    title: 'Create Transaction',
    description: 'Buyer or seller creates a new transaction with complete details.',
    icon: FileText,
    learnMore: '/how-it-works#step-1'
  },
  {
    step: '02',
    title: 'Deposit Funds',
    description: 'Buyer deposits funds into Kahade secure escrow account.',
    icon: Wallet,
    learnMore: '/how-it-works#step-2'
  },
  {
    step: '03',
    title: 'Deliver Goods/Services',
    description: 'Seller delivers the goods/services and uploads proof.',
    icon: Package,
    learnMore: '/how-it-works#step-3'
  },
  {
    step: '04',
    title: 'Confirm Receipt',
    description: 'Buyer confirms receipt and satisfaction with the delivery.',
    icon: CheckCircle,
    learnMore: '/how-it-works#step-4'
  },
  {
    step: '05',
    title: 'Release Funds',
    description: 'After confirmation, funds are released to the seller.',
    icon: HandCoins,
    learnMore: '/how-it-works#step-5'
  },
];

// Section 5: Pricing
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
      'Standard processing time',
      'Basic analytics',
    ],
    cta: 'Get Started Free',
    popular: false,
  },
  {
    name: 'Professional',
    description: 'Ideal for freelancers and growing businesses',
    monthlyPrice: 29,
    yearlyPrice: 290,
    features: [
      'Unlimited transactions',
      'Advanced escrow protection',
      'Priority support 24/7',
      'Fast processing time',
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
    monthlyPrice: 99,
    yearlyPrice: 990,
    features: [
      'Everything in Professional',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee',
      'White-label solution',
      'Advanced security features',
      'Compliance support',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

// Section 6: Testimonials
const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Freelance Designer',
    company: 'Self-employed',
    content: 'Kahade has transformed how I handle client payments. No more chasing invoices or worrying about non-payment. The escrow system gives both me and my clients peace of mind.',
    rating: 5,
    avatar: 'SJ'
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
  {
    name: 'David Kim',
    role: 'Software Developer',
    company: 'CodeCraft Solutions',
    content: 'Finally, a payment solution that understands freelancers. The milestone payment feature is a game-changer for long-term projects. Worth every penny.',
    rating: 5,
    avatar: 'DK'
  },
  {
    name: 'Lisa Thompson',
    role: 'Art Collector',
    company: 'Private Collector',
    content: 'Buying high-value art online was always risky until I discovered Kahade. Now I can purchase with confidence knowing my money is protected until I verify the artwork.',
    rating: 5,
    avatar: 'LT'
  },
];

// Trust signals
const trustSignals = [
  { value: '$50M+', label: 'Total Transactions' },
  { value: '10,000+', label: 'Active Users' },
  { value: '99.9%', label: 'Success Rate' },
  { value: '24/7', label: 'Support Available' },
];

export default function Home() {
  const [isYearly, setIsYearly] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const testimonialRef = useRef<HTMLDivElement>(null);

  // Auto-advance testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <Navbar />
      
      {/* ========== SECTION 1: HERO ========== */}
      <section className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-accent/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        </div>
        
        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial="initial"
              animate="animate"
              variants={staggerContainer}
              className="text-center lg:text-left"
            >
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
                <ShieldCheck className="w-4 h-4 text-accent" weight="fill" />
                <span className="text-sm text-accent font-medium">Trusted P2P Escrow Platform</span>
              </motion.div>
              
              <motion.h1 
                variants={fadeInUp}
                className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
              >
                Secure Transactions with{' '}
                <span className="gradient-text">Trusted Escrow</span>{' '}
                Protection
              </motion.h1>
              
              <motion.p 
                variants={fadeInUp}
                className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0"
              >
                Protect every transaction with our secure and reliable escrow system. 
                Full protection for both buyers and sellers in every deal.
              </motion.p>
              
              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/register">
                  <Button className="btn-accent text-base px-8 py-4 h-auto group">
                    Get Started Free
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" weight="bold" />
                  </Button>
                </Link>
                <Link href="/how-it-works">
                  <Button className="btn-secondary text-base px-8 py-4 h-auto">
                    Learn How It Works
                  </Button>
                </Link>
              </motion.div>
              
              {/* Trust Signals */}
              <motion.div variants={fadeInUp} className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
                {trustSignals.map((signal) => (
                  <div key={signal.label} className="text-center lg:text-left">
                    <div className="text-2xl font-bold text-foreground">{signal.value}</div>
                    <div className="text-sm text-muted-foreground">{signal.label}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
            
            {/* Hero Visual */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="relative">
                <div className="w-full max-w-lg mx-auto aspect-square rounded-3xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 flex items-center justify-center">
                  <ShieldCheck className="w-48 h-48 text-accent" weight="duotone" />
                </div>
                {/* Floating cards */}
                <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-lg p-4 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" weight="fill" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Transaction Complete</div>
                      <div className="text-xs text-muted-foreground">Funds released securely</div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-lg p-4 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-accent" weight="fill" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">256-bit Encryption</div>
                      <div className="text-xs text-muted-foreground">Bank-level security</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* ========== SECTION 2: RISK ON BOTH SIDES ========== */}
      <section className="py-24 bg-white">
        <div className="container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Risk Exists on <span className="gradient-text">Both Sides</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
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
                    <span className="text-red-800">{risk}</span>
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
                    <span className="text-orange-800">{risk}</span>
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
            className="mt-12 bg-gradient-to-r from-accent to-accent/80 rounded-2xl p-8 text-white text-center"
          >
            <ShieldCheck className="w-12 h-12 mx-auto mb-4" weight="duotone" />
            <h3 className="text-2xl font-bold mb-2">Kahade Eliminates These Risks</h3>
            <p className="text-white/80 max-w-2xl mx-auto">
              Our escrow system holds funds securely until both parties are satisfied, 
              ensuring fair and protected transactions for everyone.
            </p>
          </motion.div>
        </div>
      </section>
      
      {/* ========== SECTION 3: WHY CHOOSE KAHADE ========== */}
      <section id="features" className="py-24 bg-[#FAFBFC]">
        <div className="container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose <span className="gradient-text">Kahade</span>?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The most comprehensive escrow platform with cutting-edge security features to protect every transaction.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card-hover p-6 group"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-accent" weight="duotone" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* ========== SECTION 4: HOW KAHADE WORKS ========== */}
      <section className="py-24 bg-white">
        <div className="container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How <span className="gradient-text">Kahade</span> Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Simple 5-step process for secure and trusted transactions.
            </p>
          </motion.div>
          
          <div className="relative">
            {/* Timeline line - desktop only */}
            <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
            
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
              {steps.map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  className="relative"
                >
                  <div className="glass-card p-6 text-center relative z-10 h-full">
                    {/* Step number */}
                    <div className="w-12 h-12 rounded-full bg-accent text-white font-bold text-lg flex items-center justify-center mx-auto mb-4">
                      {step.step}
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                      <step.icon className="w-7 h-7 text-accent" weight="duotone" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{step.description}</p>
                    <Link href={step.learnMore} className="text-sm text-accent hover:underline inline-flex items-center gap-1">
                      Learn more <CaretRight className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* ========== SECTION 5: TRANSPARENT PRICING ========== */}
      <section id="pricing" className="py-24 bg-[#FAFBFC]">
        <div className="container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Transparent <span className="gradient-text">Pricing</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Choose the plan that fits your needs. No hidden fees, no surprises.
            </p>
            
            {/* Monthly/Yearly Toggle */}
            <div className="inline-flex items-center gap-4 p-1 bg-secondary rounded-xl">
              <button
                onClick={() => setIsYearly(false)}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                  !isYearly ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                  isYearly ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground'
                }`}
              >
                Yearly <span className="text-accent ml-1">Save 20%</span>
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
                    ? 'bg-foreground text-white border-2 border-accent scale-105' 
                    : 'bg-white border border-border'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-accent text-white text-sm font-medium rounded-full">
                    Most Popular
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <p className={`text-sm ${plan.popular ? 'text-white/70' : 'text-muted-foreground'}`}>
                    {plan.description}
                  </p>
                </div>
                
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold">
                    ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                  </div>
                  <div className={`text-sm ${plan.popular ? 'text-white/70' : 'text-muted-foreground'}`}>
                    {isYearly ? '/year' : '/month'}
                  </div>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle 
                        className={`w-5 h-5 shrink-0 ${plan.popular ? 'text-accent' : 'text-accent'}`} 
                        weight="fill" 
                      />
                      <span className={`text-sm ${plan.popular ? 'text-white/90' : 'text-foreground'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full ${plan.popular ? 'btn-accent' : 'btn-secondary'}`}
                >
                  {plan.cta}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* ========== SECTION 6: WHAT USERS SAY (CAROUSEL) ========== */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              What <span className="gradient-text">Users Say</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Trusted by thousands of users worldwide for secure transactions.
            </p>
          </motion.div>
          
          {/* Carousel */}
          <div className="relative max-w-4xl mx-auto">
            <div 
              ref={testimonialRef}
              className="overflow-hidden"
            >
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="bg-secondary/50 rounded-2xl p-8 md:p-12"
              >
                <Quotes className="w-12 h-12 text-accent/30 mb-6" weight="fill" />
                
                <p className="text-xl md:text-2xl text-foreground mb-8 leading-relaxed">
                  "{testimonials[currentTestimonial].content}"
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-lg">
                      {testimonials[currentTestimonial].avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">
                        {testimonials[currentTestimonial].name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {testimonials[currentTestimonial].role}, {testimonials[currentTestimonial].company}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-amber-400" weight="fill" />
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
            
            {/* Navigation */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={prevTestimonial}
                className="w-12 h-12 rounded-full bg-white border border-border hover:border-accent hover:text-accent flex items-center justify-center transition-colors"
                aria-label="Previous testimonial"
              >
                <CaretLeft className="w-5 h-5" weight="bold" />
              </button>
              
              {/* Dots */}
              <div className="flex items-center gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      index === currentTestimonial 
                        ? 'bg-accent w-8' 
                        : 'bg-border hover:bg-accent/50'
                    }`}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>
              
              <button
                onClick={nextTestimonial}
                className="w-12 h-12 rounded-full bg-white border border-border hover:border-accent hover:text-accent flex items-center justify-center transition-colors"
                aria-label="Next testimonial"
              >
                <CaretRight className="w-5 h-5" weight="bold" />
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* ========== SECTION 7: FINAL CTA ========== */}
      <section className="py-24 bg-gradient-to-br from-foreground to-foreground/90">
        <div className="container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
              Ready to Transact with <span className="text-accent">Confidence</span>?
            </h2>
            <p className="text-white/70 mb-8 text-lg">
              Join thousands of users who trust Kahade for their secure transactions. 
              Sign up free today and experience the peace of mind that comes with protected payments.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button className="btn-accent text-base px-8 py-4 h-auto group">
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" weight="bold" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" className="text-base px-8 py-4 h-auto border-white/20 text-white hover:bg-white/10">
                  Talk to Sales
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
