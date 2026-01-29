/*
 * KAHADE HOW IT WORKS PAGE - Modern Design
 * Brand color: #000000
 */

import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { 
  UserPlus, FileText, Wallet, PaperPlaneTilt, CheckCircle,
  ArrowRight, ShieldCheck, Clock, Question, Check
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const steps = [
  {
    icon: UserPlus,
    title: 'Create Account',
    description: 'Create a free account on Rekberkan. Registration is quick and easy, just need email and password.',
    details: [
      'Email verification for account security',
      'Complete profile to increase trust',
      'Optional: KYC verification for higher limits'
    ]
  },
  {
    icon: FileText,
    title: 'Create Transaction',
    description: 'Buyer or seller can create a new transaction with complete details about goods/services.',
    details: [
      'Set title and transaction description',
      'Enter amount and currency',
      'Select category and special terms if any',
      'Invite counterparty via link or email'
    ]
  },
  {
    icon: Wallet,
    title: 'Buyer Deposits Funds',
    description: 'Buyer deposits funds to Rekberkan escrow. Funds are safe and cannot be accessed by anyone.',
    details: [
      'Choose payment method (Transfer, E-Wallet, VA)',
      'Funds go to Rekberkan escrow account',
      'Seller gets notification that funds are received',
      'Transaction status updates in real-time'
    ]
  },
  {
    icon: PaperPlaneTilt,
    title: 'Seller Delivers Goods/Services',
    description: 'Seller ships goods or completes services as agreed.',
    details: [
      'Upload proof of delivery or completion',
      'Enter tracking number if applicable',
      'Buyer receives notification',
      'Holding period begins'
    ]
  },
  {
    icon: CheckCircle,
    title: 'Confirm & Release Funds',
    description: 'Buyer confirms receipt, funds are released to seller.',
    details: [
      'Buyer checks and confirms goods/services',
      'Funds automatically released to seller',
      'Both parties can give ratings',
      'Transaction completed and recorded'
    ]
  }
];

const faqs = [
  {
    question: 'How much does it cost to use Rekberkan?',
    answer: 'Rekberkan charges a platform fee of 1-3% of the transaction value, depending on the category and amount. This fee can be borne by the buyer, seller, or split equally as agreed.'
  },
  {
    question: 'What if there is a dispute?',
    answer: 'If a dispute occurs, both parties can file a dispute. Rekberkan mediator team will review evidence from both sides and make a fair decision. The dispute process usually completes within 3-7 business days.'
  },
  {
    question: 'Is my money safe?',
    answer: 'Yes, your funds are very safe. Escrow funds are stored in a separate supervised account and cannot be accessed by anyone except through the defined process. All transactions are recorded for full transparency.'
  },
  {
    question: 'How long does fund disbursement take?',
    answer: 'After the buyer confirms, funds will be disbursed to the seller within 1-3 business days depending on the chosen disbursement method. Transfers to local banks are usually faster.'
  },
  {
    question: 'Is KYC verification required?',
    answer: 'KYC verification is optional for small transactions. However, for transactions above Rp 100,000,000, KYC verification is required for security and regulatory compliance.'
  },
  {
    question: 'What transaction categories are supported?',
    answer: 'Rekberkan supports various categories including: Electronics, Digital Services, Physical Goods, Professional Services, and more. Some prohibited categories such as illegal goods are not allowed.'
  }
];

const securityFeatures = [
  {
    icon: ShieldCheck,
    title: 'Guaranteed Escrow',
    description: 'Funds are stored in a separate, supervised and insured escrow account.'
  },
  {
    icon: Clock,
    title: 'Holding Period',
    description: 'Fund holding period provides time for verification before release.'
  },
  {
    icon: Question,
    title: 'Dispute Resolution',
    description: 'Professional mediator team ready to help resolve disputes fairly.'
  }
];

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20">
        <div className="container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-black">
              How Rekberkan Works
            </h1>
            <p className="text-lg text-[#6B7280]">
              Simple and secure process to protect every transaction. 
              Follow these steps to get started.
            </p>
          </motion.div>
        </div>
      </section>
      
      {/* Steps Section */}
      <section className="py-20 bg-[#FAFAFA]">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative mb-12 last:mb-0"
              >
                {/* Connector */}
                {index < steps.length - 1 && (
                  <div className="absolute left-6 top-20 w-0.5 h-[calc(100%-2rem)] bg-[#E5E5E5]" />
                )}
                
                <div className="flex gap-6">
                  {/* Step Number */}
                  <div className="shrink-0">
                    <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-bold">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="bg-white rounded-xl p-6 flex-1 border border-[#E5E5E5]">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-[#F5F5F5] flex items-center justify-center">
                        <step.icon className="w-5 h-5 text-black" weight="duotone" />
                      </div>
                      <span className="text-sm font-mono text-[#6B7280]">Step {index + 1}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-black">{step.title}</h3>
                    <p className="text-[#6B7280] mb-4">{step.description}</p>
                    <ul className="space-y-2">
                      {step.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" weight="bold" />
                          <span className="text-[#6B7280]">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Security Features */}
      <section className="py-20 bg-white">
        <div className="container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4 text-black">
              Security at Every Step
            </h2>
            <p className="text-[#6B7280] max-w-2xl mx-auto">
              Every stage of the transaction is protected with cutting-edge security technology.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {securityFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="feature-card text-center group"
              >
                <div className="w-14 h-14 rounded-xl bg-[#F5F5F5] flex items-center justify-center mx-auto mb-4 group-hover:bg-black group-hover:text-white transition-colors">
                  <feature.icon className="w-7 h-7" weight="duotone" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-black">{feature.title}</h3>
                <p className="text-sm text-[#6B7280]">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-[#FAFAFA]">
        <div className="container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4 text-black">
              Frequently Asked Questions
            </h2>
            <p className="text-[#6B7280] max-w-2xl mx-auto">
              Answers to commonly asked questions.
            </p>
          </motion.div>
          
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="bg-white rounded-xl px-6 border border-[#E5E5E5]"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-semibold text-black">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-[#6B7280] pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
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
            className="text-center"
          >
            <h2 className="text-3xl font-bold mb-4 text-white">
              Ready to Get Started?
            </h2>
            <p className="text-white/70 max-w-xl mx-auto mb-8">
              Sign up now and enjoy secure transactions with Rekberkan.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button className="bg-white text-black hover:bg-[#F5F5F5] px-8 py-3 h-auto font-semibold rounded-lg group">
                  Sign Up Free
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" weight="bold" />
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
