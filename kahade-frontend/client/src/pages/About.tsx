/*
 * KAHADE ABOUT PAGE - Modern Design
 * Brand color: #000000
 */

import { motion } from 'framer-motion';
import { ShieldCheck, Target, Eye, Heart, Globe, Lightning, ArrowRight } from '@phosphor-icons/react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const values = [
  {
    icon: ShieldCheck,
    title: 'Security',
    description: 'Security is our top priority in every aspect of the platform.'
  },
  {
    icon: Eye,
    title: 'Transparency',
    description: 'We believe in complete openness in every transaction.'
  },
  {
    icon: Heart,
    title: 'Trust',
    description: 'Building trust is the foundation of every business relationship.'
  },
  {
    icon: Lightning,
    title: 'Innovation',
    description: 'Continuously innovating to provide the best solutions for users.'
  }
];

const milestones = [
  { year: '2023', title: 'Founded', description: 'Rekberkan was founded with the vision of becoming a trusted escrow platform.' },
  { year: '2024', title: 'Platform Launch', description: 'Launched the escrow platform with complete security features.' },
  { year: '2024', title: '10,000 Users', description: 'Reached the milestone of 10,000 active users.' },
  { year: '2025', title: 'Regional Expansion', description: 'Expanding services throughout Southeast Asia.' }
];

const stats = [
  { value: '10K+', label: 'Active Users' },
  { value: 'Rp 50M+', label: 'Total Transactions' },
  { value: '99.9%', label: 'Uptime' },
  { value: '4.9/5', label: 'User Rating' },
];

export default function About() {
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
              About Rekberkan
            </h1>
            <p className="text-lg text-[#6B7280]">
              We are a dedicated team creating a safe, transparent, and trusted 
              online transaction ecosystem.
            </p>
          </motion.div>
        </div>
      </section>
      
      {/* Mission & Vision */}
      <section className="py-20 bg-[#FAFAFA]">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 border border-[#E5E5E5]"
            >
              <div className="w-12 h-12 rounded-xl bg-[#F5F5F5] flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-black" weight="duotone" />
              </div>
              <h2 className="text-2xl font-bold mb-4 text-black">Our Mission</h2>
              <p className="text-[#6B7280]">
                To provide a secure and easy-to-use escrow platform to protect every online 
                transaction. We are committed to eliminating fraud risks and building 
                trust in the digital economy.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 border border-[#E5E5E5]"
            >
              <div className="w-12 h-12 rounded-xl bg-[#F5F5F5] flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-black" weight="duotone" />
              </div>
              <h2 className="text-2xl font-bold mb-4 text-black">Our Vision</h2>
              <p className="text-[#6B7280]">
                To become the leading escrow platform in Southeast Asia, known for security, 
                transparency, and technological innovation. We want everyone to be able to 
                transact online with peace of mind and confidence.
              </p>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Values */}
      <section className="py-20 bg-white">
        <div className="container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4 text-black">Our Values</h2>
            <p className="text-[#6B7280] max-w-2xl mx-auto">
              The principles that guide every decision and action we take.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="feature-card text-center group"
              >
                <div className="w-12 h-12 rounded-xl bg-[#F5F5F5] flex items-center justify-center mx-auto mb-4 group-hover:bg-black group-hover:text-white transition-colors">
                  <value.icon className="w-6 h-6" weight="duotone" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-black">{value.title}</h3>
                <p className="text-sm text-[#6B7280]">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Timeline */}
      <section className="py-20 bg-[#FAFAFA]">
        <div className="container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4 text-black">Our Journey</h2>
            <p className="text-[#6B7280] max-w-2xl mx-auto">
              Important milestones in Rekberkan's journey.
            </p>
          </motion.div>
          
          <div className="max-w-3xl mx-auto">
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.year + milestone.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex gap-6 mb-8 last:mb-0"
              >
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm">
                    {milestone.year}
                  </div>
                  {index < milestones.length - 1 && (
                    <div className="w-0.5 h-full bg-[#E5E5E5] mt-2" />
                  )}
                </div>
                <div className="bg-white rounded-xl p-6 flex-1 border border-[#E5E5E5]">
                  <h3 className="text-lg font-semibold mb-2 text-black">{milestone.title}</h3>
                  <p className="text-sm text-[#6B7280]">{milestone.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Stats */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="bg-black rounded-2xl p-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="text-4xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-white/70">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-[#FAFAFA]">
        <div className="container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto"
          >
            <h2 className="text-3xl font-bold mb-4 text-black">Join our team</h2>
            <p className="text-[#6B7280] mb-8">
              We're always looking for talented people to join our mission of making online transactions safer.
            </p>
            <Link href="/careers">
              <Button className="btn-primary group">
                View Open Positions
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" weight="bold" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
