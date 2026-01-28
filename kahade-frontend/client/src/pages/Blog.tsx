/*
 * KAHADE BLOG PAGE - Modern Design
 * Brand color: #000000
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import {
  MagnifyingGlass, Calendar, Clock, User, Tag,
  ArrowRight, BookOpen, TrendUp, Lightbulb
} from '@phosphor-icons/react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const categories = [
  { name: 'All', count: 24 },
  { name: 'Product Updates', count: 8 },
  { name: 'Security', count: 6 },
  { name: 'Tips & Guides', count: 5 },
  { name: 'Industry News', count: 5 },
];

const featuredPost = {
  id: 1,
  title: 'Introducing Kahade 2.0: A New Era of Secure Transactions',
  excerpt: 'We are excited to announce the launch of Kahade 2.0, featuring a completely redesigned interface, enhanced security measures, and new features that make P2P escrow easier than ever.',
  category: 'Product Updates',
  author: 'Kahade Team',
  date: 'Jan 25, 2026',
  readTime: '5 min read',
  image: '/images/blog/featured.jpg'
};

const posts = [
  {
    id: 2,
    title: '5 Tips for Safe Online Transactions in 2026',
    excerpt: 'Learn the essential practices to protect yourself when buying or selling online.',
    category: 'Tips & Guides',
    author: 'Sarah Chen',
    date: 'Jan 22, 2026',
    readTime: '4 min read'
  },
  {
    id: 3,
    title: 'Understanding Escrow: A Complete Guide',
    excerpt: 'Everything you need to know about how escrow works and why it matters.',
    category: 'Tips & Guides',
    author: 'Michael Park',
    date: 'Jan 20, 2026',
    readTime: '7 min read'
  },
  {
    id: 4,
    title: 'How We Protect Your Funds: Security Deep Dive',
    excerpt: 'An inside look at the security measures we use to keep your money safe.',
    category: 'Security',
    author: 'David Kim',
    date: 'Jan 18, 2026',
    readTime: '6 min read'
  },
  {
    id: 5,
    title: 'The Rise of P2P Commerce in Southeast Asia',
    excerpt: 'Exploring the growing trend of peer-to-peer transactions in the region.',
    category: 'Industry News',
    author: 'Lisa Wong',
    date: 'Jan 15, 2026',
    readTime: '5 min read'
  },
  {
    id: 6,
    title: 'New Feature: Instant Dispute Resolution',
    excerpt: 'Introducing our AI-powered dispute resolution system for faster outcomes.',
    category: 'Product Updates',
    author: 'Kahade Team',
    date: 'Jan 12, 2026',
    readTime: '3 min read'
  },
  {
    id: 7,
    title: 'Building Trust in Digital Marketplaces',
    excerpt: 'How escrow services are transforming online commerce and building trust.',
    category: 'Industry News',
    author: 'James Lee',
    date: 'Jan 10, 2026',
    readTime: '5 min read'
  }
];

export default function Blog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-12">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F5F5F5] text-black text-sm font-medium mb-6">
              <BookOpen className="w-4 h-4" weight="fill" />
              Kahade Blog
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-black">
              Insights & Updates
            </h1>
            <p className="text-xl text-[#6B7280] mb-8">
              Stay informed with the latest news, tips, and updates from the Kahade team.
            </p>
            
            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" weight="regular" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-white border-[#E5E5E5] focus:border-black focus:ring-black"
              />
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Categories */}
      <section className="py-6 border-b border-[#E5E5E5]">
        <div className="container">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category.name
                    ? 'bg-black text-white'
                    : 'bg-[#F5F5F5] hover:bg-[#E5E5E5] text-black'
                }`}
              >
                {category.name} ({category.count})
              </button>
            ))}
          </div>
        </div>
      </section>
      
      {/* Featured Post */}
      {selectedCategory === 'All' && !searchQuery && (
        <section className="py-12">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden"
            >
              <div className="grid lg:grid-cols-2 gap-0">
                <div className="h-64 lg:h-auto bg-[#F5F5F5] flex items-center justify-center">
                  <TrendUp className="w-24 h-24 text-[#9CA3AF]" weight="fill" />
                </div>
                <div className="p-8 lg:p-12">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="px-3 py-1 rounded-full bg-black text-white text-sm font-medium">
                      {featuredPost.category}
                    </span>
                    <span className="text-sm text-[#6B7280]">Featured</span>
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-bold mb-4 text-black">
                    {featuredPost.title}
                  </h2>
                  <p className="text-[#6B7280] mb-6">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-[#6B7280] mb-6">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" weight="regular" />
                      {featuredPost.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" weight="regular" />
                      {featuredPost.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" weight="regular" />
                      {featuredPost.readTime}
                    </span>
                  </div>
                  <Button className="btn-primary gap-2">
                    Read Article
                    <ArrowRight className="w-4 h-4" weight="bold" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}
      
      {/* Posts Grid */}
      <section className="py-12 bg-[#FAFAFA]">
        <div className="container">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post, index) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl border border-[#E5E5E5] overflow-hidden group cursor-pointer hover:border-black transition-colors"
              >
                <div className="h-48 bg-[#F5F5F5] flex items-center justify-center">
                  <Lightbulb className="w-12 h-12 text-[#9CA3AF] group-hover:text-black transition-colors" weight="fill" />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 rounded-full bg-[#F5F5F5] text-black text-xs font-medium">
                      {post.category}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-black group-hover:text-[#6B7280] transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-[#6B7280] mb-4 line-clamp-2">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" weight="regular" />
                      {post.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" weight="regular" />
                      {post.readTime}
                    </span>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
          
          {filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto text-[#9CA3AF] mb-4" weight="regular" />
              <h3 className="font-semibold text-lg mb-2 text-black">No articles found</h3>
              <p className="text-[#6B7280]">Try adjusting your search or filter criteria.</p>
            </div>
          )}
          
          {/* Load More */}
          {filteredPosts.length > 0 && (
            <div className="text-center mt-12">
              <Button className="btn-secondary">
                Load More Articles
              </Button>
            </div>
          )}
        </div>
      </section>
      
      {/* Newsletter CTA */}
      <section className="py-20 bg-black">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto"
          >
            <h2 className="text-3xl font-bold mb-4 text-white">
              Subscribe to Our Newsletter
            </h2>
            <p className="text-white/70 mb-8">
              Get the latest articles, tips, and updates delivered straight to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                placeholder="Enter your email"
                className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white focus:ring-white"
              />
              <Button className="bg-white text-black hover:bg-[#F5F5F5] h-12 px-6 font-semibold">
                Subscribe
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
