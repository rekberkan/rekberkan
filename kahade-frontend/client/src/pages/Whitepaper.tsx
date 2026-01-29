/*
 * KAHADE WHITEPAPER PAGE - Modern Design
 * Brand color: #000000
 */

import { motion } from 'framer-motion';
import { Link } from 'wouter';
import {
  FileText, Download, BookOpen, ChartLine, Shield,
  Users, Globe, ArrowRight, CheckCircle, Clock
} from '@phosphor-icons/react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';

const tableOfContents = [
  { number: '01', title: 'Executive Summary', page: 3 },
  { number: '02', title: 'Problem Statement', page: 5 },
  { number: '03', title: 'Market Analysis', page: 8 },
  { number: '04', title: 'The Rekberkan Solution', page: 12 },
  { number: '05', title: 'Technology Architecture', page: 18 },
  { number: '06', title: 'Security Framework', page: 24 },
  { number: '07', title: 'Business Model', page: 28 },
  { number: '08', title: 'Roadmap', page: 32 },
  { number: '09', title: 'Team & Advisors', page: 36 },
  { number: '10', title: 'Conclusion', page: 40 },
];

const highlights = [
  {
    icon: Globe,
    stat: '$2.5T',
    label: 'Global P2P Market Size',
    description: 'The peer-to-peer marketplace is growing at 15% annually'
  },
  {
    icon: Shield,
    stat: '99.9%',
    label: 'Fraud Prevention Rate',
    description: 'Our escrow system prevents virtually all transaction fraud'
  },
  {
    icon: Users,
    stat: '10M+',
    label: 'Target Users by 2028',
    description: 'Projected user base across Southeast Asia and beyond'
  },
  {
    icon: ChartLine,
    stat: '40%',
    label: 'YoY Growth Target',
    description: 'Sustainable growth through product excellence'
  },
];

const keyPoints = [
  'Comprehensive analysis of the P2P marketplace trust problem',
  'Detailed technical architecture of our escrow platform',
  'Security measures and compliance framework',
  'Go-to-market strategy and expansion plans',
  'Financial projections and business model',
  'Team background and advisory board',
];

export default function Whitepaper() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F5F5F5] text-black text-sm font-medium mb-6">
                <FileText className="w-4 h-4" weight="fill" />
                Official Document
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-black">
                Rekberkan Whitepaper
              </h1>
              <p className="text-xl text-[#6B7280] mb-6">
                A comprehensive overview of our vision, technology, and strategy for building 
                the most trusted P2P escrow platform in the world.
              </p>
              
              <div className="flex items-center gap-4 text-sm text-[#9CA3AF] mb-8">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" weight="regular" />
                  42 Pages
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" weight="regular" />
                  Updated Jan 2026
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="btn-primary gap-2">
                  <Download className="w-5 h-5" weight="bold" />
                  Download PDF
                </Button>
                <Button className="btn-secondary gap-2">
                  <BookOpen className="w-5 h-5" weight="regular" />
                  Read Online
                </Button>
              </div>
            </motion.div>
            
            {/* Document Preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <div className="relative bg-white rounded-2xl shadow-2xl border border-[#E5E5E5] p-8 transform rotate-2 hover:rotate-0 transition-transform">
                <div className="absolute top-4 right-4 w-12 h-12 rounded-xl bg-black flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" weight="fill" />
                </div>
                <div className="space-y-4">
                  <div className="h-4 bg-[#E5E5E5] rounded w-3/4" />
                  <div className="h-3 bg-[#F5F5F5] rounded w-full" />
                  <div className="h-3 bg-[#F5F5F5] rounded w-5/6" />
                  <div className="h-3 bg-[#F5F5F5] rounded w-4/5" />
                  <div className="h-8" />
                  <div className="h-3 bg-[#F5F5F5] rounded w-full" />
                  <div className="h-3 bg-[#F5F5F5] rounded w-3/4" />
                  <div className="h-3 bg-[#F5F5F5] rounded w-5/6" />
                  <div className="h-8" />
                  <div className="h-20 bg-[#F5F5F5] rounded-lg" />
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-black rounded-2xl p-6 shadow-lg">
                <div className="text-3xl font-bold text-white">v2.0</div>
                <div className="text-sm text-white/70">Latest Version</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Key Highlights */}
      <section className="py-20 bg-[#FAFAFA]">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4 text-black">Key Highlights</h2>
            <p className="text-[#6B7280] max-w-2xl mx-auto">
              Important metrics and projections from our whitepaper.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {highlights.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="feature-card text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-[#F5F5F5] flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-black" weight="fill" />
                </div>
                <div className="text-3xl font-bold text-black mb-1">{item.stat}</div>
                <div className="font-medium mb-2 text-black">{item.label}</div>
                <p className="text-sm text-[#6B7280]">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Table of Contents */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-4 text-black">Table of Contents</h2>
              <p className="text-[#6B7280] mb-8">
                Explore the comprehensive coverage of our platform, technology, and vision.
              </p>
              
              <div className="space-y-3">
                {tableOfContents.map((item, index) => (
                  <motion.div
                    key={item.number}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-[#FAFAFA] hover:bg-[#F5F5F5] transition-colors cursor-pointer group border border-transparent hover:border-[#E5E5E5]"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-black font-mono font-bold">{item.number}</span>
                      <span className="font-medium text-black">
                        {item.title}
                      </span>
                    </div>
                    <span className="text-sm text-[#9CA3AF]">p. {item.page}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div className="feature-card sticky top-24">
                <h3 className="text-xl font-bold mb-4 text-black">What You'll Learn</h3>
                <ul className="space-y-3 mb-8">
                  {keyPoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-black flex-shrink-0 mt-0.5" weight="fill" />
                      <span className="text-[#6B7280]">{point}</span>
                    </li>
                  ))}
                </ul>
                
                <Button className="w-full btn-primary gap-2">
                  <Download className="w-5 h-5" weight="bold" />
                  Download Whitepaper
                </Button>
              </div>
            </motion.div>
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
            <h2 className="text-3xl font-bold mb-4 text-white">
              Ready to Learn More?
            </h2>
            <p className="text-white/70 mb-8">
              Have questions about our whitepaper or want to discuss partnership opportunities?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button className="bg-white text-black hover:bg-[#F5F5F5] px-8 py-3 h-auto font-semibold rounded-lg gap-2">
                  Contact Us
                  <ArrowRight className="w-5 h-5" weight="bold" />
                </Button>
              </Link>
              <Link href="/about">
                <Button className="bg-transparent text-white border border-white/30 hover:bg-white/10 px-8 py-3 h-auto font-semibold rounded-lg">
                  About Rekberkan
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
