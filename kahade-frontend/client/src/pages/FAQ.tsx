/*
 * KAHADE FAQ PAGE
 * Icons: Phosphor Icons only
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import {
  Question, CaretDown, MagnifyingGlass, ChatCircle,
  ArrowRight, Lightbulb
} from '@phosphor-icons/react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const faqCategories = [
  { id: 'general', name: 'General' },
  { id: 'transactions', name: 'Transactions' },
  { id: 'payments', name: 'Payments' },
  { id: 'security', name: 'Security' },
  { id: 'account', name: 'Account' },
];

const faqs = [
  {
    category: 'general',
    question: 'What is Kahade?',
    answer: 'Kahade is a secure peer-to-peer escrow platform that protects both buyers and sellers in online transactions. We hold funds safely until both parties fulfill their obligations, ensuring a trustworthy exchange.'
  },
  {
    category: 'general',
    question: 'How does escrow work?',
    answer: 'Escrow works in three simple steps: 1) The buyer deposits funds into Kahade, 2) The seller delivers the goods or services, 3) Once the buyer confirms satisfaction, we release the funds to the seller. This protects both parties from fraud.'
  },
  {
    category: 'general',
    question: 'Is Kahade safe to use?',
    answer: 'Yes, Kahade employs bank-level security measures including 256-bit SSL encryption, two-factor authentication, and secure fund storage. Your money is protected throughout the entire transaction process.'
  },
  {
    category: 'transactions',
    question: 'How do I create a transaction?',
    answer: 'To create a transaction, log into your dashboard, click "New Transaction", enter the details (amount, description, counterparty), and submit. You can then share the transaction link with the other party.'
  },
  {
    category: 'transactions',
    question: 'What happens if there\'s a dispute?',
    answer: 'If a dispute arises, either party can open a dispute case. Our team will review the evidence from both sides and make a fair decision. We aim to resolve disputes within 3-5 business days.'
  },
  {
    category: 'transactions',
    question: 'How long do transactions take?',
    answer: 'Transaction duration depends on the agreement between parties. Typically, once the buyer confirms receipt, funds are released to the seller within 24 hours. The escrow period can be customized from 1-30 days.'
  },
  {
    category: 'payments',
    question: 'What payment methods do you accept?',
    answer: 'We accept bank transfers, credit/debit cards, and various digital payment methods. Available options may vary by region. All payments are processed securely through our platform.'
  },
  {
    category: 'payments',
    question: 'What are the fees?',
    answer: 'Our standard fee is 1% of the transaction amount, with a minimum fee of $1. Fees are typically paid by the buyer but can be split or paid by the seller based on agreement. View our pricing page for detailed information.'
  },
  {
    category: 'payments',
    question: 'How do I withdraw my funds?',
    answer: 'Go to your Wallet, click "Withdraw", enter the amount and your bank details, then confirm. Withdrawals are typically processed within 1-3 business days depending on your bank.'
  },
  {
    category: 'security',
    question: 'How do you protect my data?',
    answer: 'We use industry-standard encryption, secure servers, and strict access controls. Your personal and financial data is never shared with third parties without your consent. We comply with international data protection regulations.'
  },
  {
    category: 'security',
    question: 'What is two-factor authentication?',
    answer: 'Two-factor authentication (2FA) adds an extra layer of security by requiring a verification code from your phone in addition to your password. We strongly recommend enabling 2FA in your account settings.'
  },
  {
    category: 'account',
    question: 'How do I verify my account?',
    answer: 'Account verification (KYC) requires submitting a government-issued ID and proof of address. This helps us prevent fraud and comply with regulations. Verification is typically completed within 24-48 hours.'
  },
  {
    category: 'account',
    question: 'Can I have multiple accounts?',
    answer: 'No, each user is allowed only one account. Multiple accounts may result in suspension. If you need separate accounts for business purposes, please contact our support team.'
  },
  {
    category: 'account',
    question: 'How do I delete my account?',
    answer: 'To delete your account, ensure all transactions are completed and your balance is zero. Then go to Settings > Account > Delete Account. Note that this action is irreversible and all data will be permanently removed.'
  }
];

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-accent/5 via-transparent to-primary/5">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
              <Question className="w-4 h-4" weight="fill" />
              FAQ
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Find quick answers to common questions about Kahade.
            </p>
            
            {/* Search */}
            <div className="relative max-w-xl mx-auto">
              <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" weight="regular" />
              <Input
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg bg-white border-border shadow-lg"
              />
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Category Tabs */}
      <section className="py-6 border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="container">
          <div className="flex flex-wrap justify-center gap-2">
            {faqCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => { setSelectedCategory(category.id); setOpenIndex(null); }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'bg-accent text-white'
                    : 'bg-secondary hover:bg-secondary/80 text-foreground'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>
      
      {/* FAQ Accordion */}
      <section className="py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto space-y-4">
            {filteredFaqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full p-6 flex items-center justify-between text-left hover:bg-secondary/30 transition-colors"
                >
                  <span className="font-semibold pr-4">{faq.question}</span>
                  <CaretDown 
                    className={`w-5 h-5 text-accent flex-shrink-0 transition-transform ${
                      openIndex === index ? 'rotate-180' : ''
                    }`} 
                    weight="bold" 
                  />
                </button>
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 text-muted-foreground">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
            
            {filteredFaqs.length === 0 && (
              <div className="text-center py-12">
                <Lightbulb className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" weight="regular" />
                <h3 className="font-semibold text-lg mb-2">No questions found</h3>
                <p className="text-muted-foreground">Try adjusting your search terms.</p>
              </div>
            )}
          </div>
        </div>
      </section>
      
      {/* Contact CTA */}
      <section className="py-16 bg-gradient-to-br from-accent/10 to-primary/10">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto"
          >
            <ChatCircle className="w-16 h-16 mx-auto text-accent mb-6" weight="fill" />
            <h2 className="text-3xl font-bold mb-4">
              Still Have Questions?
            </h2>
            <p className="text-muted-foreground mb-8">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg" className="btn-accent gap-2">
                  Contact Support
                  <ArrowRight className="w-5 h-5" weight="bold" />
                </Button>
              </Link>
              <Link href="/help">
                <Button size="lg" variant="outline">
                  Visit Help Center
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
