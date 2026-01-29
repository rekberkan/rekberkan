/*
 * KAHADE PRIVACY POLICY PAGE - Modern Design
 * Brand color: #000000
 */

import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { ShieldCheck, Calendar, ArrowLeft, Printer } from '@phosphor-icons/react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';

const sections = [
  {
    id: 'introduction',
    title: '1. Introduction',
    content: `Rekberkan ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform and services.

By using Rekberkan, you consent to the data practices described in this policy. If you do not agree with our policies, please do not use our services.`
  },
  {
    id: 'collection',
    title: '2. Information We Collect',
    content: `We collect information that you provide directly to us, including:

Personal Information:
• Name and contact details (email, phone number)
• Government-issued identification documents
• Date of birth and nationality
• Residential address
• Profile photo

Financial Information:
• Bank account details
• Payment card information
• Transaction history
• Wallet balance and activity

Technical Information:
• IP address and device information
• Browser type and settings
• Operating system
• Usage data and analytics
• Cookies and similar technologies`
  },
  {
    id: 'use',
    title: '3. How We Use Your Information',
    content: `We use the information we collect to:

• Provide, maintain, and improve our services
• Process transactions and send related information
• Verify your identity and prevent fraud
• Comply with legal and regulatory requirements
• Send you technical notices and support messages
• Respond to your comments and questions
• Analyze usage patterns and improve user experience
• Personalize your experience on our platform
• Communicate about products, services, and events

We will not use your personal information for purposes other than those described in this policy without your consent.`
  },
  {
    id: 'sharing',
    title: '4. Information Sharing',
    content: `We may share your information in the following circumstances:

With Other Users:
• Transaction counterparties receive limited information necessary to complete transactions
• Your username and transaction history may be visible to other parties in a transaction

With Service Providers:
• Payment processors and financial institutions
• Identity verification services
• Cloud hosting and infrastructure providers
• Analytics and monitoring services

For Legal Purposes:
• To comply with applicable laws and regulations
• To respond to legal process or government requests
• To protect our rights, privacy, safety, or property
• To enforce our terms and agreements

We do not sell your personal information to third parties.`
  },
  {
    id: 'security',
    title: '5. Data Security',
    content: `We implement appropriate technical and organizational measures to protect your information, including:

• 256-bit SSL/TLS encryption for data in transit
• AES-256 encryption for data at rest
• Multi-factor authentication options
• Regular security audits and penetration testing
• Access controls and employee training
• Secure data centers with physical security measures

While we strive to protect your information, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security.`
  },
  {
    id: 'retention',
    title: '6. Data Retention',
    content: `We retain your personal information for as long as necessary to:

• Provide our services to you
• Comply with legal obligations
• Resolve disputes and enforce agreements
• Maintain business records

After account closure, we may retain certain information as required by law or for legitimate business purposes. Transaction records are typically retained for 7 years for regulatory compliance.`
  },
  {
    id: 'rights',
    title: '7. Your Rights',
    content: `Depending on your location, you may have the following rights:

• Access: Request a copy of your personal information
• Correction: Request correction of inaccurate data
• Deletion: Request deletion of your personal information
• Portability: Request transfer of your data to another service
• Objection: Object to certain processing of your data
• Restriction: Request restriction of processing
• Withdrawal: Withdraw consent where processing is based on consent

To exercise these rights, please contact us at privacy@rekberkan.com. We will respond to your request within 30 days.`
  },
  {
    id: 'cookies',
    title: '8. Cookies and Tracking',
    content: `We use cookies and similar technologies to:

• Remember your preferences and settings
• Authenticate users and prevent fraud
• Analyze site traffic and usage patterns
• Deliver personalized content and ads

Types of cookies we use:
• Essential cookies: Required for basic functionality
• Analytics cookies: Help us understand how you use our site
• Preference cookies: Remember your settings and choices
• Marketing cookies: Used for advertising purposes

You can control cookies through your browser settings. Note that disabling certain cookies may affect site functionality.`
  },
  {
    id: 'international',
    title: '9. International Transfers',
    content: `Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws.

When we transfer data internationally, we ensure appropriate safeguards are in place, including:
• Standard contractual clauses approved by relevant authorities
• Adequacy decisions by data protection authorities
• Certification mechanisms where applicable

By using our services, you consent to the transfer of your information to countries outside your residence.`
  },
  {
    id: 'children',
    title: '10. Children\'s Privacy',
    content: `Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from children.

If we learn that we have collected information from a child under 18, we will take steps to delete that information as soon as possible. If you believe we have collected information from a child, please contact us immediately.`
  },
  {
    id: 'changes',
    title: '11. Changes to This Policy',
    content: `We may update this Privacy Policy from time to time. We will notify you of any material changes by:

• Posting the new policy on our website
• Sending an email notification
• Displaying a notice in our app

Your continued use of our services after changes are posted constitutes acceptance of the updated policy. We encourage you to review this policy periodically.`
  },
  {
    id: 'contact',
    title: '12. Contact Us',
    content: `If you have questions about this Privacy Policy or our data practices, please contact us:

Data Protection Officer
Email: privacy@rekberkan.com
Address: Jakarta, Indonesia

For EU residents, you also have the right to lodge a complaint with your local data protection authority.`
  },
];

export default function Privacy() {
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
              <ShieldCheck className="w-4 h-4" weight="fill" />
              Legal
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-black">
              Privacy Policy
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
                  Your privacy is important to us. This Privacy Policy explains how Rekberkan collects, uses, 
                  and protects your personal information.
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
