/*
 * KAHADE ADMIN LAYOUT
 * Design: Sidebar navigation for admin dashboard
 */

import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, LayoutDashboard, Users, ArrowLeftRight, AlertTriangle,
  FileText, Settings, LogOut, Menu, X, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/users', icon: Users, label: 'Pengguna' },
  { href: '/admin/transactions', icon: ArrowLeftRight, label: 'Transaksi' },
  { href: '/admin/disputes', icon: AlertTriangle, label: 'Dispute' },
  { href: '/admin/audit-logs', icon: FileText, label: 'Audit Logs' },
  { href: '/admin/settings', icon: Settings, label: 'Pengaturan' },
];

export default function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
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
          <Link href="/admin" className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-accent" />
            <div>
              <span className="text-xl font-display font-bold">Kahade</span>
              <span className="text-xs text-accent ml-2 px-2 py-0.5 bg-accent/10 rounded-full">Admin</span>
            </div>
          </Link>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || 
              (item.href !== '/admin' && location.startsWith(item.href));
            
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
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-semibold">
              A
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">Admin</div>
              <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/app" className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                User View
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
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
                <Link href="/admin" className="flex items-center gap-2">
                  <Shield className="w-8 h-8 text-accent" />
                  <span className="text-xl font-display font-bold">Admin</span>
                </Link>
                <button onClick={() => setIsSidebarOpen(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <nav className="p-4 space-y-1">
                {navItems.map((item) => {
                  const isActive = location === item.href || 
                    (item.href !== '/admin' && location.startsWith(item.href));
                  
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
            <ThemeToggle />
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
