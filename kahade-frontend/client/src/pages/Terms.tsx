/*
 * KAHADE TERMS OF SERVICE PAGE - Modern Design
 * Brand color: #000000
 */

import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { FileText, Calendar, ArrowLeft, Printer } from '@phosphor-icons/react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';

const sections = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    content: `By accessing or using Kahade's services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing our services.

These Terms of Service apply to all users of the platform, including without limitation users who are browsers, vendors, customers, merchants, and/or contributors of content.`
  },
  {
    id: 'services',
    title: '2. Description of Services',
    content: `Kahade provides a peer-to-peer escrow platform that facilitates secure transactions between buyers and sellers. Our services include:

• Secure fund holding during transactions
• Transaction management and tracking
• Dispute resolution services
• Identity verification (KYC)
• Payment processing and withdrawals

We reserve the right to modify, suspend, or discontinue any aspect of our services at any time without prior notice.`
  },
  {
    id: 'eligibility',
    title: '3. Eligibility',
    content: `To use Kahade's services, you must:

• Be at least 18 years of age
• Have the legal capacity to enter into binding contracts
• Not be prohibited from using our services under applicable laws
• Provide accurate and complete registration information
• Maintain the security of your account credentials

We reserve the right to refuse service, terminate accounts, or cancel transactions at our sole discretion.`
  },
  {
    id: 'accounts',
    title: '4. User Accounts',
    content: `When you create an account with us, you must provide accurate, complete, and current information. Failure to do so constitutes a breach of these Terms.

You are responsible for:
• Safeguarding your password and account credentials
• All activities that occur under your account
• Notifying us immediately of any unauthorized access
• Ensuring your contact information is up to date

We are not liable for any loss or damage arising from your failure to comply with these requirements.`
  },
  {
    id: 'transactions',
    title: '5. Transactions and Escrow',
    content: `When using our escrow services:

• Funds are held securely until transaction conditions are met
• Both parties must fulfill their obligations as agreed
• Release of funds is subject to confirmation from the buyer
• Disputes must be filed within the specified timeframe
• Our decision on disputes is final and binding

Transaction fees are non-refundable once a transaction is initiated. Please review all transaction details carefully before proceeding.`
  },
  {
    id: 'fees',
    title: '6. Fees and Payments',
    content: `Our fee structure is as follows:

• Standard escrow fee: 1-3% of transaction amount
• Minimum fee: Rp 5.000 per transaction
• Withdrawal fees may apply depending on payment method
• Currency conversion fees may apply for international transactions

All fees are subject to change with 30 days notice. Current fees are always displayed before transaction confirmation.`
  },
  {
    id: 'prohibited',
    title: '7. Prohibited Activities',
    content: `You agree not to use our services for:

• Illegal activities or transactions
• Money laundering or terrorist financing
• Fraud or deceptive practices
• Transactions involving prohibited goods or services
• Circumventing our security measures
• Harassing or threatening other users
• Creating multiple accounts for fraudulent purposes
• Any activity that violates applicable laws or regulations

Violation of these prohibitions may result in immediate account termination and legal action.`
  },
  {
    id: 'intellectual',
    title: '8. Intellectual Property',
    content: `All content, features, and functionality of Kahade's platform are owned by Kahade and are protected by international copyright, trademark, and other intellectual property laws.

You may not:
• Copy, modify, or distribute our content without permission
• Use our trademarks without written consent
• Reverse engineer our software or systems
• Remove any copyright or proprietary notices`
  },
  {
    id: 'liability',
    title: '9. Limitation of Liability',
    content: `To the maximum extent permitted by law, Kahade shall not be liable for:

• Any indirect, incidental, or consequential damages
• Loss of profits, data, or business opportunities
• Damages arising from third-party actions
• Service interruptions or technical failures
• Unauthorized access to your account

Our total liability for any claim shall not exceed the fees paid by you in the 12 months preceding the claim.`
  },
  {
    id: 'indemnification',
    title: '10. Indemnification',
    content: `You agree to indemnify, defend, and hold harmless Kahade and its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from:

• Your use of our services
• Your violation of these Terms
• Your violation of any third-party rights
• Any content you submit through our platform`
  },
  {
    id: 'termination',
    title: '11. Termination',
    content: `We may terminate or suspend your account immediately, without prior notice, for any reason, including:

• Breach of these Terms of Service
• Suspected fraudulent or illegal activity
• Request by law enforcement
• Extended periods of inactivity

Upon termination, your right to use our services will cease immediately. Provisions that by their nature should survive termination shall survive.`
  },
  {
    id: 'governing',
    title: '12. Governing Law',
    content: `These Terms shall be governed by and construed in accordance with the laws of Indonesia, without regard to its conflict of law provisions.

Any disputes arising from these Terms or your use of our services shall be resolved through binding arbitration in Indonesia, unless otherwise required by applicable law.`
  },
  {
    id: 'changes',
    title: '13. Changes to Terms',
    content: `We reserve the right to modify these Terms at any time. We will provide notice of material changes through:

• Email notification to registered users
• Prominent notice on our website
• In-app notifications

Your continued use of our services after such modifications constitutes acceptance of the updated Terms.`
  },
  {
    id: 'contact',
    title: '14. Contact Information',
    content: `For questions about these Terms of Service, please contact us:

Email: legal@kahade.com
Address: Jakarta, Indonesia

We aim to respond to all inquiries within 5 business days.`
  },
];

export default function Terms() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-12">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <Link href="/">
              <Button variant="ghost" size="sm" className="mb-6 gap-2 text-[#6B7280] hover:text-black">
                <ArrowLeft className="w-4 h-4" weight="bold" />
                Back to Home
              </Button>
            </Link>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F5F5F5] text-black text-sm font-medium mb-6">
              <FileText className="w-4 h-4" weight="fill" />
              Legal
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-black">
              Terms of Service
            </h1>
            <div className="flex items-center gap-4 text-[#6B7280]">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" weight="regular" />
                Last updated: January 1, 2026
              </span>
              <Button variant="ghost" size="sm" className="gap-2 text-[#6B7280] hover:text-black" onClick={() => window.print()}>
                <Printer className="w-4 h-4" weight="regular" />
                Print
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Content */}
      <section className="py-12 bg-[#FAFAFA]">
        <div className="container">
          <div className="grid lg:grid-cols-4 gap-12">
            {/* Table of Contents */}
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1"
            >
              <div className="sticky top-24 bg-white rounded-xl border border-[#E5E5E5] p-6">
                <h3 className="font-semibold mb-4 text-black">Table of Contents</h3>
                <nav className="space-y-2">
                  {sections.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="block text-sm text-[#6B7280] hover:text-black transition-colors py-1"
                    >
                      {section.title}
                    </a>
                  ))}
                </nav>
              </div>
            </motion.aside>
            
            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-3"
            >
              <div className="bg-white rounded-xl border border-[#E5E5E5] p-8">
                <p className="text-lg text-[#6B7280] mb-8">
                  Please read these Terms of Service carefully before using Kahade's platform and services. 
                  By using our services, you agree to be bound by these terms.
                </p>
                
                {sections.map((section, index) => (
                  <motion.div
                    key={section.id}
                    id={section.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="mb-12 scroll-mt-24"
                  >
                    <h2 className="text-xl font-bold mb-4 text-black">{section.title}</h2>
                    <div className="text-[#6B7280] whitespace-pre-line leading-relaxed">
                      {section.content}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
