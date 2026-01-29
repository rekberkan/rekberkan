/*
 * KAHADE CAREERS PAGE - Modern Design
 * Brand color: #000000
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Briefcase, MapPin, Clock, CurrencyDollar, Users,
  Heart, Rocket, GraduationCap, Coffee, ArrowRight,
  Buildings, Globe, MagnifyingGlass
} from '@phosphor-icons/react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const benefits = [
  { icon: Heart, title: 'Health Insurance', description: 'Comprehensive medical, dental, and vision coverage' },
  { icon: Rocket, title: 'Career Growth', description: 'Learning budget and mentorship programs' },
  { icon: Clock, title: 'Flexible Hours', description: 'Work when you\'re most productive' },
  { icon: Globe, title: 'Remote First', description: 'Work from anywhere in the world' },
  { icon: CurrencyDollar, title: 'Competitive Pay', description: 'Above-market compensation packages' },
  { icon: Coffee, title: 'Team Events', description: 'Regular team retreats and social events' },
];

const departments = [
  { name: 'All Departments', count: 12 },
  { name: 'Engineering', count: 5 },
  { name: 'Product', count: 2 },
  { name: 'Design', count: 2 },
  { name: 'Marketing', count: 2 },
  { name: 'Operations', count: 1 },
];

const jobs = [
  {
    id: 1,
    title: 'Senior Full Stack Engineer',
    department: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
    salary: '$120k - $180k'
  },
  {
    id: 2,
    title: 'Backend Engineer',
    department: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
    salary: '$100k - $150k'
  },
  {
    id: 3,
    title: 'Frontend Engineer',
    department: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
    salary: '$90k - $140k'
  },
  {
    id: 4,
    title: 'Product Manager',
    department: 'Product',
    location: 'Remote',
    type: 'Full-time',
    salary: '$110k - $160k'
  },
  {
    id: 5,
    title: 'Product Designer',
    department: 'Design',
    location: 'Remote',
    type: 'Full-time',
    salary: '$90k - $130k'
  },
  {
    id: 6,
    title: 'UX Researcher',
    department: 'Design',
    location: 'Remote',
    type: 'Full-time',
    salary: '$80k - $120k'
  },
  {
    id: 7,
    title: 'Growth Marketing Manager',
    department: 'Marketing',
    location: 'Remote',
    type: 'Full-time',
    salary: '$90k - $130k'
  },
  {
    id: 8,
    title: 'Content Marketing Specialist',
    department: 'Marketing',
    location: 'Remote',
    type: 'Full-time',
    salary: '$60k - $90k'
  },
  {
    id: 9,
    title: 'DevOps Engineer',
    department: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
    salary: '$110k - $160k'
  },
  {
    id: 10,
    title: 'Security Engineer',
    department: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
    salary: '$120k - $170k'
  },
  {
    id: 11,
    title: 'Product Analyst',
    department: 'Product',
    location: 'Remote',
    type: 'Full-time',
    salary: '$70k - $100k'
  },
  {
    id: 12,
    title: 'Customer Success Manager',
    department: 'Operations',
    location: 'Remote',
    type: 'Full-time',
    salary: '$60k - $90k'
  },
];

const values = [
  { title: 'Trust First', description: 'We build trust in everything we do, both internally and with our users.' },
  { title: 'Move Fast', description: 'We ship quickly, learn from feedback, and iterate constantly.' },
  { title: 'Think Big', description: 'We tackle ambitious problems and aim for global impact.' },
  { title: 'Stay Humble', description: 'We listen, learn, and grow together as a team.' },
];

export default function Careers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = selectedDepartment === 'All Departments' || job.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F5F5F5] text-black text-sm font-medium mb-6">
              <Briefcase className="w-4 h-4" weight="fill" />
              We're Hiring
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-black">
              Build the Future of Trust
            </h1>
            <p className="text-xl text-[#6B7280] mb-8">
              Join our mission to make online transactions safe and trustworthy for everyone. 
              We're looking for passionate people to help us grow.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-[#6B7280]">
              <span className="flex items-center gap-2">
                <Users className="w-5 h-5 text-black" weight="fill" />
                50+ Team Members
              </span>
              <span className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-black" weight="fill" />
                15+ Countries
              </span>
              <span className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-black" weight="fill" />
                {jobs.length} Open Roles
              </span>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Values Section */}
      <section className="py-20 bg-[#FAFAFA]">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4 text-black">Our Values</h2>
            <p className="text-[#6B7280] max-w-2xl mx-auto">
              These principles guide everything we do at Rekberkan.
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
                className="feature-card text-center"
              >
                <h3 className="font-semibold text-lg mb-2 text-black">{value.title}</h3>
                <p className="text-sm text-[#6B7280]">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4 text-black">Benefits & Perks</h2>
            <p className="text-[#6B7280] max-w-2xl mx-auto">
              We take care of our team so they can focus on doing their best work.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="feature-card flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-[#F5F5F5] flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="w-6 h-6 text-black" weight="fill" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-black">{benefit.title}</h3>
                  <p className="text-sm text-[#6B7280]">{benefit.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Open Positions */}
      <section className="py-20 bg-[#FAFAFA]">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4 text-black">Open Positions</h2>
            <p className="text-[#6B7280] max-w-2xl mx-auto">
              Find your next opportunity and join our growing team.
            </p>
          </motion.div>
          
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" weight="regular" />
              <Input
                placeholder="Search positions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 bg-white border-[#E5E5E5] focus:border-black focus:ring-black"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {departments.map((dept) => (
                <button
                  key={dept.name}
                  onClick={() => setSelectedDepartment(dept.name)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedDepartment === dept.name
                      ? 'bg-black text-white'
                      : 'bg-white border border-[#E5E5E5] hover:bg-[#F5F5F5] text-black'
                  }`}
                >
                  {dept.name} ({dept.count})
                </button>
              ))}
            </div>
          </div>
          
          {/* Jobs List */}
          <div className="space-y-4">
            {filteredJobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl border border-[#E5E5E5] p-6 hover:border-black transition-colors group cursor-pointer"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-lg text-black group-hover:text-[#6B7280] transition-colors">
                      {job.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-[#6B7280]">
                      <span className="flex items-center gap-1">
                        <Buildings className="w-4 h-4" weight="regular" />
                        {job.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" weight="regular" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" weight="regular" />
                        {job.type}
                      </span>
                      <span className="flex items-center gap-1">
                        <CurrencyDollar className="w-4 h-4" weight="regular" />
                        {job.salary}
                      </span>
                    </div>
                  </div>
                  <Button className="btn-primary whitespace-nowrap gap-2">
                    Apply Now
                    <ArrowRight className="w-4 h-4" weight="bold" />
                  </Button>
                </div>
              </motion.div>
            ))}
            
            {filteredJobs.length === 0 && (
              <div className="text-center py-12">
                <Briefcase className="w-16 h-16 mx-auto text-[#9CA3AF] mb-4" weight="regular" />
                <h3 className="font-semibold text-lg mb-2 text-black">No positions found</h3>
                <p className="text-[#6B7280]">Try adjusting your search or filter criteria.</p>
              </div>
            )}
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
              Don't See the Right Role?
            </h2>
            <p className="text-white/70 mb-8">
              We're always looking for talented people. Send us your resume and we'll keep you in mind for future opportunities.
            </p>
            <Button className="bg-white text-black hover:bg-[#F5F5F5] px-8 py-3 h-auto font-semibold rounded-lg gap-2">
              Send Your Resume
              <ArrowRight className="w-5 h-5" weight="bold" />
            </Button>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
