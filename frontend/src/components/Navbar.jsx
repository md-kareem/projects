import React from 'react';
import { ShieldAlert, Bell, Menu, User } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 w-full bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand / Logo Section */}
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="p-2 bg-emerald-950/50 rounded-lg border border-emerald-900/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <ShieldAlert className="text-emerald-500" size={24} />
            </div>
            <span className="font-mono font-bold text-lg tracking-widest text-zinc-100 uppercase">
              SmartCity<span className="text-emerald-500">_Connect</span>
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#" className="text-sm font-mono text-emerald-400 border-b-2 border-emerald-500 pb-1 transition-colors">
              DASHBOARD
            </a>
            <a href="#" className="text-sm font-mono text-zinc-400 hover:text-zinc-200 hover:border-b-2 hover:border-zinc-600 pb-1 transition-all">
              REPORTS
            </a>
            <a href="#" className="text-sm font-mono text-zinc-400 hover:text-zinc-200 hover:border-b-2 hover:border-zinc-600 pb-1 transition-all">
              ANALYTICS
            </a>
          </div>

          {/* User Actions & Mobile Menu */}
          <div className="flex items-center gap-5">
            
            {/* Notification Bell with Ping Animation */}
            <button className="text-zinc-400 hover:text-emerald-400 transition-colors relative group" title="Notifications">
              <Bell size={20} className="group-hover:animate-swing" />
              {/* Active Indicator Dot */}
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-zinc-950"></span>
              </span>
            </button>

            {/* Desktop User Avatar */}
            <div className="hidden md:flex items-center justify-center h-9 w-9 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300 cursor-pointer transition-colors">
              <User size={18} />
            </div>

            {/* Mobile Menu Hamburger (Hidden on Desktop) */}
            <button className="md:hidden text-zinc-400 hover:text-zinc-200 transition-colors">
              <Menu size={24} />
            </button>
            
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;