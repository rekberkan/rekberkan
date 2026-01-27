/*
 * KAHADE ABOUT PAGE
 * Design: Glassmorphic with company story and team
 * Icons: Phosphor Icons only
 */

import { motion } from 'framer-motion';
import { ShieldCheck, Target, Eye, Heart, Globe, Lightning } from '@phosphor-icons/react';
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
  { year: '2023', title: 'Founded', description: 'Kahade was founded with the vision of becoming a trusted escrow platform.' },
  { year: '2024', title: 'Platform Launch', description: 'Launched the escrow platform with complete security features.' },
  { year: '2024', title: '10,000 Users', description: 'Reached the milestone of 10,000 active users.' },
  { year: '2025', title: 'Regional Expansion', description: 'Expanding services throughout Southeast Asia.' }
];

export default function About() {
  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20">
        <div className="container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              About <span className="gradient-text">Kahade</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              We are a dedicated team creating a safe, transparent, and trusted 
              online transaction ecosystem.
            </p>
          </motion.div>
        </div>
      </section>
      
      {/* Mission & Vision */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-card p-8"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-accent" weight="duotone" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
              <p className="text-muted-foreground">
                To provide a secure and easy-to-use escrow platform to protect every online 
                transaction. We are committed to eliminating fraud risks and building 
                trust in the digital economy.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-card p-8"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-accent" weight="duotone" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
              <p className="text-muted-foreground">
                To become the leading escrow platform in Southeast Asia, known for security, 
                transparency, and technological innovation. We want everyone to be able to 
                transact online with peace of mind and confidence.
              </p>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Values */}
      <section className="py-20 bg-[#FAFBFC]">
        <div className="container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Our Values</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
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
                className="glass-card-hover p-6 text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-6 h-6 text-accent" weight="duotone" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Timeline */}
      <section className="py-20 bg-white">
        <div className="container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Our Journey</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Important milestones in Kahade's journey.
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
                  <div className="w-12 h-12 rounded-full bg-accent/10 border-2 border-accent flex items-center justify-center text-accent font-bold text-sm">
                    {milestone.year}
                  </div>
                  {index < milestones.length - 1 && (
                    <div className="w-0.5 h-full bg-accent/20 mt-2" />
                  )}
                </div>
                <div className="glass-card p-6 flex-1">
                  <h3 className="text-lg font-semibold mb-2">{milestone.title}</h3>
                  <p className="text-sm text-muted-foreground">{milestone.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Stats */}
      <section className="py-20 bg-[#FAFBFC]">
        <div className="container">
          <div className="glass-card p-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold gradient-text mb-2">10K+</div>
                <div className="text-muted-foreground">Active Users</div>
              </div>
              <div>
                <div className="text-4xl font-bold gradient-text mb-2">$50M+</div>
                <div className="text-muted-foreground">Total Transactions</div>
              </div>
              <div>
                <div className="text-4xl font-bold gradient-text mb-2">99.9%</div>
                <div className="text-muted-foreground">Uptime</div>
              </div>
              <div>
                <div className="text-4xl font-bold gradient-text mb-2">4.9/5</div>
                <div className="text-muted-foreground">User Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
