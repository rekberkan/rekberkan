/*
 * KAHADE USER DASHBOARD LAYOUT
 * 
 * Features:
 * - Collapsible sidebar navigation
 * - Top bar with search, notifications, profile dropdown
 * - Phosphor Icons only
 * - Responsive: sidebar collapses into drawer on mobile
 */

import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  House, ArrowsLeftRight, Wallet, Bell, User, Gear,
  SignOut, List, X, CaretRight, Plus, MagnifyingGlass,
  ChartLine, Shield, CaretDown
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

const navItems = [
  { href: '/app', icon: House, label: 'Overview' },
  { href: '/app/transactions', icon: ArrowsLeftRight, label: 'Transactions' },
  { href: '/app/wallet', icon: Wallet, label: 'Wallet / Billing' },
  { href: '/app/analytics', icon: ChartLine, label: 'Analytics' },
  { href: '/app/notifications', icon: Bell, label: 'Notifications' },
  { href: '/app/profile', icon: User, label: 'Profile' },
  { href: '/app/settings', icon: Gear, label: 'Settings' },
];

export default function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    await logout();
    setLocation('/');
  };

  return (
    <div className="min-h-screen flex bg-[#FAFBFC]">
      {/* Sidebar - Desktop */}
      <aside 
        className={cn(
          "hidden lg:flex flex-col border-r border-border bg-white transition-all duration-300",
          isSidebarCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img 
              src="/images/logo.svg" 
              alt="Kahade" 
              className={cn("h-8 w-auto", isSidebarCollapsed && "mx-auto")}
            />
          </Link>
          {!isSidebarCollapsed && (
            <button
              onClick={() => setIsSidebarCollapsed(true)}
              className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
              aria-label="Collapse sidebar"
            >
              <CaretRight className="w-4 h-4 rotate-180" />
            </button>
          )}
        </div>
        
        {/* Quick Action */}
        <div className="p-4">
          <Link href="/app/transactions/new">
            <Button className={cn("btn-accent w-full", isSidebarCollapsed ? "px-3" : "justify-start")}>
              <Plus className="w-5 h-5" weight="bold" />
              {!isSidebarCollapsed && <span className="ml-2">New Transaction</span>}
            </Button>
          </Link>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
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
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                  isSidebarCollapsed && 'justify-center px-3'
                )}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5" weight={isActive ? 'fill' : 'regular'} />
                {!isSidebarCollapsed && (
                  <>
                    <span className="font-medium">{item.label}</span>
                    {isActive && <CaretRight className="w-4 h-4 ml-auto" />}
                  </>
                )}
              </Link>
            );
          })}
        </nav>
        
        {/* Expand button when collapsed */}
        {isSidebarCollapsed && (
          <div className="p-4 border-t border-border">
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              className="w-full p-3 hover:bg-secondary rounded-xl transition-colors flex items-center justify-center"
              aria-label="Expand sidebar"
            >
              <CaretRight className="w-5 h-5" />
            </button>
          </div>
        )}
        
        {/* User Info & Logout */}
        {!isSidebarCollapsed && (
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold">
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
              <SignOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        )}
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
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-white border-r border-border z-50 lg:hidden"
            >
              <div className="p-4 flex items-center justify-between border-b border-border">
                <Link href="/" className="flex items-center gap-2">
                  <img src="/images/logo.svg" alt="Kahade" className="h-8 w-auto" />
                </Link>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 hover:bg-secondary rounded-lg"
                >
                  <X className="w-5 h-5" weight="bold" />
                </button>
              </div>
              
              <div className="p-4">
                <Link href="/app/transactions/new">
                  <Button className="btn-accent w-full justify-start">
                    <Plus className="w-5 h-5 mr-2" weight="bold" />
                    New Transaction
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
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      )}
                    >
                      <item.icon className="w-5 h-5" weight={isActive ? 'fill' : 'regular'} />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
              
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-white">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-muted-foreground hover:text-destructive"
                  onClick={handleLogout}
                >
                  <SignOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 border-b border-border bg-white">
          <div className="flex items-center justify-between px-4 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <button 
                className="lg:hidden p-2 hover:bg-secondary rounded-lg"
                onClick={() => setIsSidebarOpen(true)}
              >
                <List className="w-6 h-6" weight="bold" />
              </button>
              <div>
                {title && <h1 className="text-xl font-bold">{title}</h1>}
                {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Search - Desktop */}
              <div className="hidden md:flex relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64 bg-secondary border-0"
                />
              </div>
              
              {/* Notifications */}
              <Link href="/app/notifications">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
                </Button>
              </Link>
              
              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 p-2 hover:bg-secondary rounded-xl transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent text-sm font-semibold">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:block text-sm font-medium">{user?.username || 'User'}</span>
                  <CaretDown className={cn(
                    "w-4 h-4 transition-transform hidden sm:block",
                    isProfileDropdownOpen && "rotate-180"
                  )} />
                </button>
                
                <AnimatePresence>
                  {isProfileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-border shadow-lg py-2 z-50"
                    >
                      <div className="px-4 py-2 border-b border-border">
                        <div className="font-medium">{user?.username}</div>
                        <div className="text-sm text-muted-foreground truncate">{user?.email}</div>
                      </div>
                      <Link
                        href="/app/profile"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary transition-colors"
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </Link>
                      <Link
                        href="/app/settings"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary transition-colors"
                      >
                        <Gear className="w-4 h-4" />
                        Settings
                      </Link>
                      <div className="border-t border-border mt-2 pt-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-secondary transition-colors w-full"
                        >
                          <SignOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
