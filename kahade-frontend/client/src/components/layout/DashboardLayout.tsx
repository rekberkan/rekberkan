/*
 * REKBERKAN DASHBOARD LAYOUT - EXCLUSIVE EDITION
 * 
 * Design Philosophy:
 * - Clean, professional workspace
 * - Intuitive navigation
 * - Generous spacing
 * - Subtle animations
 */

import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  House, ArrowsLeftRight, Wallet, Bell, User, Gear,
  SignOut, List, X, CaretRight, Plus, MagnifyingGlass,
  Bank, IdentificationCard, Users, Scales, ClockCounterClockwise,
  CaretDown, ArrowUpRight
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
  { href: '/', icon: House, label: 'Overview' },
  { href: '/transactions', icon: ArrowsLeftRight, label: 'Transactions' },
  { href: '/wallet', icon: Wallet, label: 'Wallet' },
  { href: '/bank-accounts', icon: Bank, label: 'Bank Accounts' },
  { href: '/disputes', icon: Scales, label: 'Disputes' },
  { href: '/referrals', icon: Users, label: 'Referrals' },
  { href: '/kyc', icon: IdentificationCard, label: 'KYC Verification' },
  { href: '/activity', icon: ClockCounterClockwise, label: 'Activity Log' },
];

const bottomNavItems = [
  { href: '/notifications', icon: Bell, label: 'Notifications' },
  { href: '/profile', icon: User, label: 'Profile' },
  { href: '/settings', icon: Gear, label: 'Settings' },
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
    <div className="min-h-screen flex bg-[#F8F8F8]">
      {/* Sidebar - Desktop */}
      <aside 
        className={cn(
          "hidden lg:flex flex-col border-r border-[#E8E8E8] bg-white transition-all duration-300 ease-in-out",
          isSidebarCollapsed ? "w-20" : "w-72"
        )}
      >
        {/* Logo */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-[#E8E8E8]">
          <Link href="/" className="flex items-center gap-2">
            <img 
              src="/images/logo.svg" 
              alt="Rekberkan" 
              className={cn("h-7 w-auto transition-opacity", isSidebarCollapsed && "opacity-0 w-0")}
            />
            {isSidebarCollapsed && (
              <div className="w-8 h-8 bg-[#0A0A0A] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
            )}
          </Link>
          {!isSidebarCollapsed && (
            <button
              onClick={() => setIsSidebarCollapsed(true)}
              className="p-2 hover:bg-[#F5F5F5] rounded-lg transition-colors"
              aria-label="Collapse sidebar"
            >
              <CaretRight className="w-4 h-4 rotate-180 text-[#737373]" weight="bold" />
            </button>
          )}
        </div>
        
        {/* Quick Action */}
        <div className="p-4">
          <Link href="/transactions/new">
            <Button className={cn(
              "btn-primary w-full h-11",
              isSidebarCollapsed ? "px-0 justify-center" : "justify-start"
            )}>
              <Plus className="w-5 h-5" weight="bold" />
              {!isSidebarCollapsed && <span className="ml-2">New Transaction</span>}
            </Button>
          </Link>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href || 
              (item.href !== '/' && location.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-[#0A0A0A] text-white shadow-lg shadow-black/10'
                    : 'text-[#737373] hover:bg-[#F5F5F5] hover:text-[#0A0A0A]',
                  isSidebarCollapsed && 'justify-center px-0'
                )}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 shrink-0" weight={isActive ? 'fill' : 'regular'} />
                {!isSidebarCollapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
              </Link>
            );
          })}
          
          {/* Divider */}
          <div className="my-4 mx-4 h-px bg-[#E8E8E8]" />
          
          {bottomNavItems.map((item) => {
            const isActive = location === item.href || 
              (item.href !== '/' && location.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-[#0A0A0A] text-white shadow-lg shadow-black/10'
                    : 'text-[#737373] hover:bg-[#F5F5F5] hover:text-[#0A0A0A]',
                  isSidebarCollapsed && 'justify-center px-0'
                )}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 shrink-0" weight={isActive ? 'fill' : 'regular'} />
                {!isSidebarCollapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>
        
        {/* Expand button when collapsed */}
        {isSidebarCollapsed && (
          <div className="p-4 border-t border-[#E8E8E8]">
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              className="w-full p-3 hover:bg-[#F5F5F5] rounded-xl transition-colors flex items-center justify-center"
              aria-label="Expand sidebar"
            >
              <CaretRight className="w-5 h-5 text-[#737373]" weight="bold" />
            </button>
          </div>
        )}
        
        {/* User Info & Logout */}
        {!isSidebarCollapsed && (
          <div className="p-4 border-t border-[#E8E8E8]">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F8F8F8] mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#0A0A0A] flex items-center justify-center text-white font-bold">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate text-[#0A0A0A]">{user?.username || 'User'}</div>
                <div className="text-xs text-[#737373] truncate">{user?.email}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#737373] hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <SignOut className="w-5 h-5" weight="bold" />
              <span className="font-medium">Sign Out</span>
            </button>
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
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-white border-r border-[#E8E8E8] z-50 lg:hidden overflow-y-auto"
            >
              <div className="h-16 px-6 flex items-center justify-between border-b border-[#E8E8E8]">
                <Link href="/" className="flex items-center gap-2">
                  <img src="/images/logo.svg" alt="Rekberkan" className="h-7 w-auto" />
                </Link>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 hover:bg-[#F5F5F5] rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-[#0A0A0A]" weight="bold" />
                </button>
              </div>
              
              <div className="p-4">
                <Link href="/transactions/new" onClick={() => setIsSidebarOpen(false)}>
                  <Button className="btn-primary w-full h-11 justify-start">
                    <Plus className="w-5 h-5 mr-2" weight="bold" />
                    New Transaction
                  </Button>
                </Link>
              </div>
              
              <nav className="px-3 py-2 space-y-1">
                {navItems.map((item) => {
                  const isActive = location === item.href || 
                    (item.href !== '/' && location.startsWith(item.href));
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                        isActive
                          ? 'bg-[#0A0A0A] text-white'
                          : 'text-[#737373] hover:bg-[#F5F5F5] hover:text-[#0A0A0A]'
                      )}
                    >
                      <item.icon className="w-5 h-5" weight={isActive ? 'fill' : 'regular'} />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
                
                <div className="my-4 mx-4 h-px bg-[#E8E8E8]" />
                
                {bottomNavItems.map((item) => {
                  const isActive = location === item.href || 
                    (item.href !== '/' && location.startsWith(item.href));
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                        isActive
                          ? 'bg-[#0A0A0A] text-white'
                          : 'text-[#737373] hover:bg-[#F5F5F5] hover:text-[#0A0A0A]'
                      )}
                    >
                      <item.icon className="w-5 h-5" weight={isActive ? 'fill' : 'regular'} />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
              
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#E8E8E8] bg-white">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F8F8F8] mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0A0A0A] flex items-center justify-center text-white font-bold">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate text-[#0A0A0A]">{user?.username || 'User'}</div>
                    <div className="text-xs text-[#737373] truncate">{user?.email}</div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#737373] hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <SignOut className="w-5 h-5" weight="bold" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 border-b border-[#E8E8E8] bg-white/90 backdrop-blur-xl">
          <div className="flex items-center justify-between h-full px-4 lg:px-8">
            <div className="flex items-center gap-4">
              <button 
                className="lg:hidden p-2 hover:bg-[#F5F5F5] rounded-xl transition-colors"
                onClick={() => setIsSidebarOpen(true)}
              >
                <List className="w-6 h-6 text-[#0A0A0A]" weight="bold" />
              </button>
              <div>
                {title && <h1 className="text-xl font-bold text-[#0A0A0A]">{title}</h1>}
                {subtitle && <p className="text-sm text-[#737373]">{subtitle}</p>}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Search - Desktop */}
              <div className="hidden md:flex relative">
                <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A3A3A3]" />
                <Input
                  type="search"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 w-64 h-10 bg-[#F5F5F5] border-0 rounded-xl focus:ring-2 focus:ring-[#0A0A0A] focus:bg-white transition-all"
                />
              </div>
              
              {/* Notifications */}
              <Link href="/notifications">
                <button className="relative p-2.5 hover:bg-[#F5F5F5] rounded-xl transition-colors">
                  <Bell className="w-5 h-5 text-[#737373]" weight="bold" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-[#0A0A0A] rounded-full" />
                </button>
              </Link>
              
              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 hover:bg-[#F5F5F5] rounded-xl transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#0A0A0A] flex items-center justify-center text-white font-bold text-sm">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <CaretDown className={cn(
                    "w-4 h-4 text-[#737373] transition-transform hidden sm:block",
                    isProfileDropdownOpen && "rotate-180"
                  )} weight="bold" />
                </button>
                
                <AnimatePresence>
                  {isProfileDropdownOpen && (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl border border-[#E8E8E8] shadow-2xl shadow-black/10 z-50 overflow-hidden"
                      >
                        <div className="p-4 border-b border-[#E8E8E8]">
                          <div className="font-semibold text-[#0A0A0A]">{user?.username || 'User'}</div>
                          <div className="text-sm text-[#737373]">{user?.email}</div>
                        </div>
                        <div className="p-2">
                          <Link
                            href="/profile"
                            onClick={() => setIsProfileDropdownOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#737373] hover:text-[#0A0A0A] hover:bg-[#F5F5F5] transition-colors"
                          >
                            <User className="w-5 h-5" weight="bold" />
                            <span className="font-medium">Profile</span>
                          </Link>
                          <Link
                            href="/settings"
                            onClick={() => setIsProfileDropdownOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#737373] hover:text-[#0A0A0A] hover:bg-[#F5F5F5] transition-colors"
                          >
                            <Gear className="w-5 h-5" weight="bold" />
                            <span className="font-medium">Settings</span>
                          </Link>
                          <a
                            href="/"
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#737373] hover:text-[#0A0A0A] hover:bg-[#F5F5F5] transition-colors"
                          >
                            <ArrowUpRight className="w-5 h-5" weight="bold" />
                            <span className="font-medium">Back to Website</span>
                          </a>
                        </div>
                        <div className="p-2 border-t border-[#E8E8E8]">
                          <button
                            onClick={() => {
                              setIsProfileDropdownOpen(false);
                              handleLogout();
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#737373] hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <SignOut className="w-5 h-5" weight="bold" />
                            <span className="font-medium">Sign Out</span>
                          </button>
                        </div>
                      </motion.div>
                    </>
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
