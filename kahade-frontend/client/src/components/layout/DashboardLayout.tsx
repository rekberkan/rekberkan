/*
 * KAHADE DASHBOARD LAYOUT
 * Design: Sidebar navigation with glassmorphic panels
 */

import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, LayoutDashboard, ArrowLeftRight, Wallet, Bell, User, Settings,
  LogOut, Menu, X, ChevronRight, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

const navItems = [
  { href: '/app', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/app/transactions', icon: ArrowLeftRight, label: 'Transaksi' },
  { href: '/app/wallet', icon: Wallet, label: 'Wallet' },
  { href: '/app/notifications', icon: Bell, label: 'Notifikasi' },
  { href: '/app/profile', icon: User, label: 'Profil' },
  { href: '/app/settings', icon: Settings, label: 'Pengaturan' },
];

export default function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setLocation('/');
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-sidebar/80 backdrop-blur-xl">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-accent" />
            <span className="text-xl font-display font-bold">Kahade</span>
          </Link>
        </div>
        
        {/* Quick Action */}
        <div className="p-4">
          <Link href="/app/transactions/new">
            <Button className="btn-accent w-full justify-center">
              <Plus className="w-4 h-4 mr-2" />
              Transaksi Baru
            </Button>
          </Link>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || 
              (item.href !== '/app' && location.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <ChevronRight className="w-4 h-4 ml-auto" />
                )}
              </Link>
            );
          })}
        </nav>
        
        {/* User Info & Logout */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white font-semibold">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{user?.username || 'User'}</div>
              <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Keluar
          </Button>
        </div>
      </aside>
      
      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-sidebar border-r border-border z-50 lg:hidden"
            >
              <div className="p-4 flex items-center justify-between border-b border-border">
                <Link href="/" className="flex items-center gap-2">
                  <Shield className="w-8 h-8 text-accent" />
                  <span className="text-xl font-display font-bold">Kahade</span>
                </Link>
                <button onClick={() => setIsSidebarOpen(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-4">
                <Link href="/app/transactions/new">
                  <Button className="btn-accent w-full justify-center">
                    <Plus className="w-4 h-4 mr-2" />
                    Transaksi Baru
                  </Button>
                </Link>
              </div>
              
              <nav className="p-4 space-y-1">
                {navItems.map((item) => {
                  const isActive = location === item.href || 
                    (item.href !== '/app' && location.startsWith(item.href));
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                        isActive
                          ? 'bg-accent/10 text-accent'
                          : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
              
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-muted-foreground hover:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Keluar
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <button 
                className="lg:hidden p-2 hover:bg-muted rounded-lg"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                {title && <h1 className="text-xl font-display font-bold">{title}</h1>}
                {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link href="/app/notifications">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
                </Button>
              </Link>
              <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-border">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-accent-foreground text-sm font-semibold">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="text-sm font-medium">{user?.username || 'User'}</span>
              </div>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <div className="flex-1 p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
