/*
 * KAHADE PRESS / NEWS PAGE - Modern Design
 * Brand color: #000000
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Newspaper, Calendar, ArrowRight, Download, Envelope,
  Image, FileText, Play, MagnifyingGlass
} from '@phosphor-icons/react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const pressReleases = [
  {
    id: 1,
    title: 'Rekberkan Raises $25M Series B to Expand Across Southeast Asia',
    date: 'Jan 20, 2026',
    category: 'Funding',
    excerpt: 'The funding round was led by prominent venture capital firms, bringing total funding to $40M.'
  },
  {
    id: 2,
    title: 'Rekberkan Launches Mobile App for iOS and Android',
    date: 'Jan 10, 2026',
    category: 'Product',
    excerpt: 'The new mobile app brings the full escrow experience to users on the go.'
  },
  {
    id: 3,
    title: 'Rekberkan Partners with Major E-commerce Platforms',
    date: 'Dec 15, 2025',
    category: 'Partnership',
    excerpt: 'Strategic partnerships to provide escrow services to millions of online sellers.'
  },
  {
    id: 4,
    title: 'Rekberkan Achieves SOC 2 Type II Certification',
    date: 'Nov 28, 2025',
    category: 'Security',
    excerpt: 'Demonstrating our commitment to the highest security and compliance standards.'
  },
  {
    id: 5,
    title: 'Rekberkan Surpasses 1 Million Transactions Milestone',
    date: 'Oct 15, 2025',
    category: 'Milestone',
    excerpt: 'A testament to the growing trust in our platform from users worldwide.'
  },
];

const mediaFeatures = [
  { outlet: 'TechCrunch', title: 'How Rekberkan is Solving Trust in P2P Commerce', date: 'Jan 2026' },
  { outlet: 'Forbes', title: 'Top 10 Fintech Startups to Watch in 2026', date: 'Jan 2026' },
  { outlet: 'Bloomberg', title: 'The Rise of Escrow Services in Digital Commerce', date: 'Dec 2025' },
  { outlet: 'The Verge', title: 'Rekberkan Review: Making Online Transactions Safer', date: 'Nov 2025' },
];

const mediaKitItems = [
  { icon: Image, title: 'Logo Package', description: 'Various formats and sizes', format: 'ZIP' },
  { icon: FileText, title: 'Brand Guidelines', description: 'Colors, typography, usage', format: 'PDF' },
  { icon: Image, title: 'Product Screenshots', description: 'High-resolution images', format: 'ZIP' },
  { icon: FileText, title: 'Company Fact Sheet', description: 'Key facts and figures', format: 'PDF' },
];

export default function Press() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredReleases = pressReleases.filter(release =>
    release.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    release.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F5F5F5] text-black text-sm font-medium mb-6">
              <Newspaper className="w-4 h-4" weight="fill" />
              Press & News
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-black">
              Rekberkan in the News
            </h1>
            <p className="text-xl text-[#6B7280] mb-8">
              Stay updated with the latest news, press releases, and media coverage about Rekberkan.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="btn-primary gap-2">
                <Envelope className="w-5 h-5" weight="fill" />
                Media Inquiries
              </Button>
              <Button className="btn-secondary gap-2">
                <Download className="w-5 h-5" weight="bold" />
                Download Media Kit
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Press Releases */}
      <section className="py-16 bg-[#FAFAFA]">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <h2 className="text-2xl font-bold text-black">Press Releases</h2>
            <div className="relative w-full md:w-64">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" weight="regular" />
              <Input
                placeholder="Search releases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white border-[#E5E5E5] focus:border-black focus:ring-black"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            {filteredReleases.map((release, index) => (
              <motion.article
                key={release.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="feature-card group cursor-pointer"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-2 py-0.5 rounded-full bg-black text-white text-xs font-medium">
                        {release.category}
                      </span>
                      <span className="text-sm text-[#9CA3AF] flex items-center gap-1">
                        <Calendar className="w-4 h-4" weight="regular" />
                        {release.date}
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg mb-2 text-black group-hover:text-[#6B7280] transition-colors">
                      {release.title}
                    </h3>
                    <p className="text-sm text-[#6B7280]">{release.excerpt}</p>
                  </div>
                  <Button variant="ghost" className="gap-2 flex-shrink-0 text-black hover:text-[#6B7280]">
                    Read More
                    <ArrowRight className="w-4 h-4" weight="bold" />
                  </Button>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
      
      {/* Media Coverage */}
      <section className="py-16 bg-white">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl font-bold mb-4 text-black">Media Coverage</h2>
            <p className="text-[#6B7280]">Featured stories from leading publications</p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {mediaFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="feature-card flex items-center gap-4 group cursor-pointer"
              >
                <div className="w-16 h-16 rounded-xl bg-[#F5F5F5] flex items-center justify-center flex-shrink-0 group-hover:bg-black transition-colors">
                  <Play className="w-8 h-8 text-[#9CA3AF] group-hover:text-white transition-colors" weight="fill" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-black font-medium mb-1">{feature.outlet}</div>
                  <h3 className="font-semibold text-black">
                    {feature.title}
                  </h3>
                  <div className="text-sm text-[#9CA3AF]">{feature.date}</div>
                </div>
                <ArrowRight className="w-5 h-5 text-[#9CA3AF] group-hover:text-black transition-colors" weight="bold" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Media Kit */}
      <section className="py-16 bg-[#FAFAFA]">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl font-bold mb-4 text-black">Media Kit</h2>
            <p className="text-[#6B7280]">Download official Rekberkan brand assets</p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mediaKitItems.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="feature-card text-center group cursor-pointer"
              >
                <div className="w-14 h-14 rounded-xl bg-[#F5F5F5] flex items-center justify-center mx-auto mb-4 group-hover:bg-black transition-colors">
                  <item.icon className="w-7 h-7 text-black group-hover:text-white transition-colors" weight="fill" />
                </div>
                <h3 className="font-semibold mb-1 text-black">{item.title}</h3>
                <p className="text-sm text-[#6B7280] mb-3">{item.description}</p>
                <span className="inline-flex items-center gap-1 text-xs text-black font-medium">
                  <Download className="w-3 h-3" weight="bold" />
                  {item.format}
                </span>
              </motion.div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Button className="btn-primary gap-2">
              <Download className="w-5 h-5" weight="bold" />
              Download Complete Media Kit
            </Button>
          </div>
        </div>
      </section>
      
      {/* Contact Section */}
      <section className="py-16 bg-black">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto"
          >
            <Envelope className="w-16 h-16 mx-auto text-white mb-6" weight="fill" />
            <h2 className="text-3xl font-bold mb-4 text-white">
              Media Inquiries
            </h2>
            <p className="text-white/70 mb-6">
              For press inquiries, interview requests, or media partnerships, please contact our communications team.
            </p>
            <div className="bg-white/10 rounded-xl p-6 inline-block">
              <div className="text-lg font-semibold text-white">press@rekberkan.com</div>
              <div className="text-sm text-white/70">We typically respond within 24 hours</div>
            </div>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
