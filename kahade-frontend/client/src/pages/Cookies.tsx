/*
 * KAHADE COOKIE POLICY PAGE - Modern Design
 * Brand color: #000000
 */

import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Cookie, Calendar, ArrowLeft, Printer, Gear } from '@phosphor-icons/react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';

const cookieTypes = [
  {
    name: 'Essential Cookies',
    description: 'These cookies are necessary for the website to function and cannot be switched off. They are usually only set in response to actions made by you such as setting your privacy preferences, logging in, or filling in forms.',
    examples: ['Session management', 'Authentication', 'Security tokens', 'Load balancing'],
    canDisable: false
  },
  {
    name: 'Analytics Cookies',
    description: 'These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us know which pages are the most and least popular and see how visitors move around the site.',
    examples: ['Page views', 'User journey tracking', 'Performance metrics', 'Error logging'],
    canDisable: true
  },
  {
    name: 'Functional Cookies',
    description: 'These cookies enable the website to provide enhanced functionality and personalization. They may be set by us or by third-party providers whose services we have added to our pages.',
    examples: ['Language preferences', 'Region settings', 'User preferences', 'Chat widgets'],
    canDisable: true
  },
  {
    name: 'Marketing Cookies',
    description: 'These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant adverts on other sites.',
    examples: ['Ad targeting', 'Retargeting', 'Social media integration', 'Conversion tracking'],
    canDisable: true
  }
];

const sections = [
  {
    id: 'what',
    title: 'What Are Cookies?',
    content: `Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to the owners of the site.

Cookies can be "persistent" or "session" cookies:
• Persistent cookies remain on your device until they expire or you delete them
• Session cookies are deleted when you close your browser

We use both types of cookies on our platform.`
  },
  {
    id: 'how',
    title: 'How We Use Cookies',
    content: `We use cookies for various purposes, including:

• Authentication: To recognize you when you sign in to our platform
• Security: To support security features and detect malicious activity
• Preferences: To remember your settings and preferences
• Analytics: To understand how you use our services and improve them
• Marketing: To deliver relevant advertisements and measure their effectiveness

We may also use similar technologies such as web beacons, pixels, and local storage.`
  },
  {
    id: 'third-party',
    title: 'Third-Party Cookies',
    content: `Some cookies are placed by third-party services that appear on our pages. We use the following third-party services:

• Google Analytics: For website analytics and performance monitoring
• Stripe: For payment processing
• Intercom: For customer support chat
• Facebook Pixel: For advertising and conversion tracking
• Cloudflare: For security and performance optimization

These third parties may use cookies to collect information about your online activities across different websites.`
  },
  {
    id: 'manage',
    title: 'Managing Cookies',
    content: `You can control and manage cookies in several ways:

Browser Settings:
Most browsers allow you to refuse or accept cookies, delete existing cookies, and set preferences for certain websites. Here's how to manage cookies in popular browsers:

• Chrome: Settings > Privacy and Security > Cookies
• Firefox: Options > Privacy & Security > Cookies
• Safari: Preferences > Privacy > Cookies
• Edge: Settings > Privacy & Security > Cookies

Please note that disabling certain cookies may affect the functionality of our website.

Our Cookie Settings:
You can also manage your cookie preferences directly on our platform by clicking the "Cookie Settings" button at the bottom of this page.`
  },
  {
    id: 'retention',
    title: 'Cookie Retention',
    content: `The retention period for cookies varies depending on their purpose:

• Session cookies: Deleted when you close your browser
• Essential cookies: Up to 1 year
• Analytics cookies: Up to 2 years
• Functional cookies: Up to 1 year
• Marketing cookies: Up to 2 years

You can delete cookies at any time through your browser settings.`
  },
  {
    id: 'updates',
    title: 'Updates to This Policy',
    content: `We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons.

We will notify you of any material changes by posting the updated policy on our website with a new "Last Updated" date. We encourage you to review this policy periodically.`
  },
  {
    id: 'contact',
    title: 'Contact Us',
    content: `If you have questions about our use of cookies or this Cookie Policy, please contact us:

Email: privacy@rekberkan.com
Address: Jakarta, Indonesia

You can also manage your cookie preferences at any time using the Cookie Settings button below.`
  }
];

export default function Cookies() {
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
              <Cookie className="w-4 h-4" weight="fill" />
              Legal
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-black">
              Cookie Policy
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
      
      {/* Cookie Types */}
      <section className="py-12 bg-[#FAFAFA]">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl font-bold mb-4 text-black">Types of Cookies We Use</h2>
            <p className="text-[#6B7280] max-w-2xl mx-auto">
              We use different types of cookies for various purposes on our platform.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {cookieTypes.map((cookie, index) => (
              <motion.div
                key={cookie.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="feature-card"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg text-black">{cookie.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    cookie.canDisable 
                      ? 'bg-[#F5F5F5] text-[#6B7280]' 
                      : 'bg-black text-white'
                  }`}>
                    {cookie.canDisable ? 'Optional' : 'Required'}
                  </span>
                </div>
                <p className="text-sm text-[#6B7280] mb-4">{cookie.description}</p>
                <div className="flex flex-wrap gap-2">
                  {cookie.examples.map((example) => (
                    <span key={example} className="text-xs px-2 py-1 rounded-full bg-[#F5F5F5] text-[#6B7280]">
                      {example}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Content */}
      <section className="py-12 bg-white">
        <div className="container">
          <div className="grid lg:grid-cols-4 gap-12">
            {/* Table of Contents */}
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1"
            >
              <div className="sticky top-24 bg-[#FAFAFA] rounded-xl border border-[#E5E5E5] p-6">
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
              
              {/* Cookie Settings Button */}
              <div className="mt-8 p-6 rounded-xl bg-black">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold mb-1 text-white">Manage Your Cookie Preferences</h3>
                    <p className="text-sm text-white/70">
                      Customize which cookies you want to allow on our platform.
                    </p>
                  </div>
                  <Button className="bg-white text-black hover:bg-[#F5F5F5] font-semibold gap-2">
                    <Gear className="w-5 h-5" weight="fill" />
                    Cookie Settings
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
