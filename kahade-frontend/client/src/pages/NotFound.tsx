/*
 * KAHADE 404 NOT FOUND PAGE - Modern Design
 * Brand color: #000000
 */

import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { House, MagnifyingGlass, ArrowLeft } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-lg"
      >
        {/* 404 Number */}
        <div className="relative mb-8">
          <h1 className="text-[150px] md:text-[200px] font-bold text-[#F5F5F5] leading-none select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-2xl bg-black flex items-center justify-center">
              <MagnifyingGlass className="w-12 h-12 text-white" weight="bold" />
            </div>
          </div>
        </div>
        
        <h2 className="text-2xl md:text-3xl font-bold text-black mb-4">
          Page Not Found
        </h2>
        
        <p className="text-[#6B7280] mb-8 max-w-sm mx-auto">
          Sorry, the page you are looking for doesn't exist or has been moved to another location.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button className="btn-primary gap-2">
              <House className="w-5 h-5" weight="bold" />
              Back to Home
            </Button>
          </Link>
          <Button 
            className="btn-secondary gap-2"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-5 h-5" weight="bold" />
            Go Back
          </Button>
        </div>
        
        {/* Quick Links */}
        <div className="mt-12 pt-8 border-t border-[#E5E5E5]">
          <p className="text-sm text-[#9CA3AF] mb-4">Or visit these popular pages:</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/how-it-works" className="text-sm text-black hover:underline font-medium">
              How It Works
            </Link>
            <Link href="/about" className="text-sm text-black hover:underline font-medium">
              About Us
            </Link>
            <Link href="/contact" className="text-sm text-black hover:underline font-medium">
              Contact
            </Link>
            <Link href="/faq" className="text-sm text-black hover:underline font-medium">
              FAQ
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
