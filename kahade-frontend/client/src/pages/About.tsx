/*
 * KAHADE ABOUT PAGE
 * Design: Glassmorphic with company story and team
 */

import { motion } from 'framer-motion';
import { Shield, Target, Eye, Heart, Users, Award, Globe, Zap } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const values = [
  {
    icon: Shield,
    title: 'Keamanan',
    description: 'Keamanan adalah prioritas utama kami dalam setiap aspek platform.'
  },
  {
    icon: Eye,
    title: 'Transparansi',
    description: 'Kami percaya pada keterbukaan penuh dalam setiap transaksi.'
  },
  {
    icon: Heart,
    title: 'Kepercayaan',
    description: 'Membangun kepercayaan adalah fondasi dari setiap hubungan bisnis.'
  },
  {
    icon: Zap,
    title: 'Inovasi',
    description: 'Terus berinovasi untuk memberikan solusi terbaik bagi pengguna.'
  }
];

const milestones = [
  { year: '2023', title: 'Didirikan', description: 'Kahade didirikan dengan visi menjadi platform escrow terpercaya.' },
  { year: '2024', title: 'Peluncuran Platform', description: 'Meluncurkan platform escrow dengan fitur keamanan lengkap.' },
  { year: '2024', title: '10,000 Pengguna', description: 'Mencapai milestone 10,000 pengguna aktif.' },
  { year: '2025', title: 'Ekspansi Regional', description: 'Memperluas layanan ke seluruh Asia Tenggara.' }
];

export default function About() {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20">
        <div className="container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
              Tentang <span className="gradient-text">Kahade</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Kami adalah tim yang berdedikasi untuk menciptakan ekosistem transaksi online yang aman, 
              transparan, dan terpercaya di Indonesia.
            </p>
          </motion.div>
        </div>
      </section>
      
      {/* Mission & Vision */}
      <section className="py-20 bg-white/[0.02]">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-card p-8"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-accent" />
              </div>
              <h2 className="text-2xl font-display font-bold mb-4">Misi Kami</h2>
              <p className="text-muted-foreground">
                Menyediakan platform escrow yang aman dan mudah digunakan untuk melindungi setiap transaksi 
                online di Indonesia. Kami berkomitmen untuk menghilangkan risiko penipuan dan membangun 
                kepercayaan dalam ekonomi digital.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-card p-8"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-display font-bold mb-4">Visi Kami</h2>
              <p className="text-muted-foreground">
                Menjadi platform escrow terdepan di Asia Tenggara yang dikenal karena keamanan, 
                transparansi, dan inovasi teknologi. Kami ingin setiap orang dapat 
                bertransaksi online dengan tenang dan percaya diri.
              </p>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Values */}
      <section className="py-20">
        <div className="container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-display font-bold mb-4">Nilai-Nilai Kami</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Prinsip-prinsip yang memandu setiap keputusan dan tindakan kami.
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
                  <value.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-lg font-display font-semibold mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Timeline */}
      <section className="py-20 bg-white/[0.02]">
        <div className="container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-display font-bold mb-4">Perjalanan Kami</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Milestone penting dalam perjalanan Kahade.
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
                  <h3 className="text-lg font-display font-semibold mb-2">{milestone.title}</h3>
                  <p className="text-sm text-muted-foreground">{milestone.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Stats */}
      <section className="py-20">
        <div className="container">
          <div className="glass-card p-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-display font-bold gradient-text mb-2">10K+</div>
                <div className="text-muted-foreground">Pengguna Aktif</div>
              </div>
              <div>
                <div className="text-4xl font-display font-bold gradient-text mb-2">Rp 50M+</div>
                <div className="text-muted-foreground">Total Transaksi</div>
              </div>
              <div>
                <div className="text-4xl font-display font-bold gradient-text mb-2">99.9%</div>
                <div className="text-muted-foreground">Uptime</div>
              </div>
              <div>
                <div className="text-4xl font-display font-bold gradient-text mb-2">4.9/5</div>
                <div className="text-muted-foreground">Rating Pengguna</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
