/*
 * KAHADE HELP CENTER PAGE
 * Icons: Phosphor Icons only
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import {
  MagnifyingGlass, Question, Book, Wallet, ShieldCheck,
  User, Gear, ChatCircle, ArrowRight, CaretRight,
  Headset, Envelope, Clock
} from '@phosphor-icons/react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const categories = [
  {
    icon: Book,
    title: 'Getting Started',
    description: 'Learn the basics of using Kahade',
    articles: 12,
    href: '/help/getting-started'
  },
  {
    icon: Wallet,
    title: 'Payments & Wallet',
    description: 'Deposits, withdrawals, and balance',
    articles: 15,
    href: '/help/payments'
  },
  {
    icon: ShieldCheck,
    title: 'Security & Privacy',
    description: 'Keep your account safe',
    articles: 8,
    href: '/help/security'
  },
  {
    icon: User,
    title: 'Account & Profile',
    description: 'Manage your account settings',
    articles: 10,
    href: '/help/account'
  },
  {
    icon: Question,
    title: 'Transactions & Escrow',
    description: 'How escrow transactions work',
    articles: 18,
    href: '/help/transactions'
  },
  {
    icon: Gear,
    title: 'Troubleshooting',
    description: 'Common issues and solutions',
    articles: 14,
    href: '/help/troubleshooting'
  }
];

const popularArticles = [
  { title: 'How to create your first escrow transaction', category: 'Getting Started' },
  { title: 'Understanding escrow fees and pricing', category: 'Payments & Wallet' },
  { title: 'How to verify your identity (KYC)', category: 'Account & Profile' },
  { title: 'What to do if a transaction goes wrong', category: 'Transactions & Escrow' },
  { title: 'How to withdraw funds to your bank', category: 'Payments & Wallet' },
  { title: 'Setting up two-factor authentication', category: 'Security & Privacy' }
];

const contactOptions = [
  {
    icon: ChatCircle,
    title: 'Live Chat',
    description: 'Chat with our support team',
    availability: 'Available 24/7',
    action: 'Start Chat'
  },
  {
    icon: Envelope,
    title: 'Email Support',
    description: 'Send us a detailed message',
    availability: 'Response within 24 hours',
    action: 'Send Email'
  },
  {
    icon: Headset,
    title: 'Phone Support',
    description: 'Talk to a support agent',
    availability: 'Mon-Fri, 9AM-6PM',
    action: 'Call Now'
  }
];

export default function Help() {
  const [searchQuery, setSearchQuery] = useState('');

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
              <Headset className="w-4 h-4" weight="fill" />
              Help Center
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              How Can We Help You?
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Search our knowledge base or browse categories to find answers to your questions.
            </p>
            
            {/* Search */}
            <div className="relative max-w-xl mx-auto">
              <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" weight="regular" />
              <Input
                placeholder="Search for help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg bg-white border-border shadow-lg"
              />
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Categories Grid */}
      <section className="py-16">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Browse by Category</h2>
            <p className="text-muted-foreground">Find answers organized by topic</p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={category.href}>
                  <div className="glass-card p-6 h-full group cursor-pointer hover:border-accent/50 transition-all">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                      <category.icon className="w-6 h-6 text-accent" weight="fill" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-accent transition-colors">
                      {category.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {category.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {category.articles} articles
                      </span>
                      <CaretRight className="w-5 h-5 text-accent opacity-0 group-hover:opacity-100 transition-opacity" weight="bold" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Popular Articles */}
      <section className="py-16 bg-secondary/30">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Popular Articles</h2>
            <p className="text-muted-foreground">Most frequently viewed help articles</p>
          </motion.div>
          
          <div className="max-w-3xl mx-auto">
            <div className="glass-card divide-y divide-border">
              {popularArticles.map((article, index) => (
                <motion.div
                  key={article.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 flex items-center justify-between group cursor-pointer hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Book className="w-5 h-5 text-accent" weight="regular" />
                    <div>
                      <div className="font-medium group-hover:text-accent transition-colors">
                        {article.title}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {article.category}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" weight="bold" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* Contact Options */}
      <section className="py-16">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Still Need Help?</h2>
            <p className="text-muted-foreground">Our support team is here to assist you</p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {contactOptions.map((option, index) => (
              <motion.div
                key={option.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-6 text-center"
              >
                <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <option.icon className="w-7 h-7 text-accent" weight="fill" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{option.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">{option.description}</p>
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-4">
                  <Clock className="w-3 h-3" weight="regular" />
                  {option.availability}
                </div>
                <Button className="w-full btn-accent">{option.action}</Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* FAQ Link */}
      <section className="py-16 bg-gradient-to-br from-accent/10 to-primary/10">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-2xl font-bold mb-4">
              Looking for Quick Answers?
            </h2>
            <p className="text-muted-foreground mb-6">
              Check out our frequently asked questions for instant answers.
            </p>
            <Link href="/faq">
              <Button size="lg" className="btn-accent gap-2">
                View FAQ
                <ArrowRight className="w-5 h-5" weight="bold" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
