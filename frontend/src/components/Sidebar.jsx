import React, { useState, useEffect, useRef } from 'react';
import { Power, Shield, LayoutDashboard, Map, Zap, History, ChevronRight, ChevronLeft } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { logout, user } = useAuth(); 
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarRef = useRef(null);

  // 1. New State for the Roll-Out Drawer
  const [isExpanded, setIsExpanded] = useState(false);

  const queryParams = new URLSearchParams(location.search);
  const currentView = queryParams.get('view') || 'overview';

  const handleLogout = () => {
    if (logout) logout(); 
    else localStorage.removeItem('token'); 
    
    navigate('/login');
  };

  // 2. Click-Outside Listener (Rolls the sidebar back in if you click away)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsExpanded(false);
      }
    };

    // Attach the event listener to the whole document
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div 
      ref={sidebarRef}
      // 3. Dynamic width: w-64 when open, w-20 when closed
      className={`${isExpanded ? 'w-64 shadow-2xl shadow-emerald-900/10' : 'w-20'} h-screen bg-zinc-950 border-r border-zinc-800/80 flex flex-col justify-between py-6 transition-all duration-300 relative z-50`}
    >
      
      {/* 4. The Floating Toggle Button */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -right-3 top-8 bg-zinc-800 hover:bg-emerald-600 text-zinc-400 hover:text-zinc-950 border border-zinc-700 rounded-full p-1 shadow-lg transition-all duration-200 z-[60]"
        title={isExpanded ? "Close Menu" : "Open Menu"}
      >
        {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      <div>
        {/* Logo Area */}
        <div className={`flex items-center ${isExpanded ? 'px-6 justify-start' : 'justify-center'} mb-12 transition-all duration-300`}>
          <div className="w-10 h-10 min-w-[40px] bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center shadow-inner">
            <Shield className="text-emerald-500" size={20} />
          </div>
          
          {/* Text gracefully hides when w-0 and opacity-0 */}
          <div className={`overflow-hidden whitespace-nowrap transition-all duration-300 flex flex-col justify-center ${isExpanded ? 'w-32 opacity-100 ml-3' : 'w-0 opacity-0 ml-0'}`}>
            <h2 className="font-bold text-zinc-100 uppercase tracking-widest text-sm leading-tight">
              SmartCity
            </h2>
            <p className="text-[10px] text-emerald-500 font-mono tracking-widest">
              NETWORK
            </p>
          </div>
        </div>

        <nav className="flex flex-col px-3 space-y-2">
           {/* ADMIN LINKS */}
           {user?.role === 'admin' && (
             <>
               <Link 
                 to="/admin" 
                 onClick={() => setIsExpanded(false)}
                 className={`flex items-center h-12 rounded-xl transition-all duration-200 ${
                   currentView === 'overview' 
                     ? 'bg-zinc-800/80 text-emerald-400 shadow-inner border border-zinc-700/50' 
                     : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                 } ${isExpanded ? 'px-4 justify-start' : 'justify-center'}`}
                 title="Analytics Overview"
               >
                 <LayoutDashboard size={20} className="min-w-[20px]" />
                 <span className={`font-mono text-xs uppercase tracking-widest overflow-hidden whitespace-nowrap transition-all duration-300 ${isExpanded ? 'w-auto opacity-100 ml-3' : 'w-0 opacity-0 ml-0'}`}>
                   Overview
                 </span>
               </Link>

               <Link 
                 to="/admin?view=fleet" 
                 onClick={() => setIsExpanded(false)}
                 className={`flex items-center h-12 rounded-xl transition-all duration-200 ${
                   currentView === 'fleet' 
                     ? 'bg-zinc-800/80 text-emerald-400 shadow-inner border border-zinc-700/50' 
                     : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                 } ${isExpanded ? 'px-4 justify-start' : 'justify-center'}`}
                 title="Live Fleet Monitor"
               >
                 <Map size={20} className="min-w-[20px]" />
                 <span className={`font-mono text-xs uppercase tracking-widest overflow-hidden whitespace-nowrap transition-all duration-300 ${isExpanded ? 'w-auto opacity-100 ml-3' : 'w-0 opacity-0 ml-0'}`}>
                   Fleet Monitor
                 </span>
               </Link>
             </>
           )}

           {/* CITIZEN LINKS */}
           {user?.role === 'citizen' && (
             <>
               <Link 
                 to="/dashboard" 
                 onClick={() => setIsExpanded(false)} // Auto-close on click
                 className={`flex items-center h-12 rounded-xl transition-all duration-200 ${
                   currentView === 'overview' || currentView === 'report'
                     ? 'bg-zinc-800/80 text-emerald-400 shadow-inner border border-zinc-700/50' 
                     : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                 } ${isExpanded ? 'px-4 justify-start' : 'justify-center'}`}
                 title="New Report"
               >
                 <Zap size={20} className="min-w-[20px]" />
                 <span className={`font-mono text-xs uppercase tracking-widest overflow-hidden whitespace-nowrap transition-all duration-300 ${isExpanded ? 'w-auto opacity-100 ml-3' : 'w-0 opacity-0 ml-0'}`}>
                   New Report
                 </span>
               </Link>

               <Link 
                 to="/dashboard?view=logs" 
                 onClick={() => setIsExpanded(false)} // Auto-close on click
                 className={`flex items-center h-12 rounded-xl transition-all duration-200 ${
                   currentView === 'logs' 
                     ? 'bg-zinc-800/80 text-emerald-400 shadow-inner border border-zinc-700/50' 
                     : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                 } ${isExpanded ? 'px-4 justify-start' : 'justify-center'}`}
                 title="My Active Logs"
               >
                 <History size={20} className="min-w-[20px]" />
                 <span className={`font-mono text-xs uppercase tracking-widest overflow-hidden whitespace-nowrap transition-all duration-300 ${isExpanded ? 'w-auto opacity-100 ml-3' : 'w-0 opacity-0 ml-0'}`}>
                   My Logs
                 </span>
               </Link>
             </>
           )}
        </nav>
      </div>

      {/* BOTTOM SECTION: Power Button */}
      <div className="flex justify-center px-3 pb-4">
        <button
          onClick={handleLogout}
          className={`group relative flex items-center h-12 rounded-xl bg-transparent transition-all duration-300 outline-none w-full ${isExpanded ? 'px-4 justify-start' : 'justify-center'}`}
          title="Terminate Session"
        >
          <div className="absolute inset-0 rounded-xl bg-emerald-500/0 group-hover:bg-emerald-500/10 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all duration-300 pointer-events-none" />
          
          <Power 
            size={22} 
            className="min-w-[22px] text-zinc-600 group-hover:text-emerald-400 transition-colors duration-300 relative z-10" 
          />
          
          <span className={`font-mono text-xs text-zinc-600 group-hover:text-emerald-400 uppercase tracking-widest transition-all duration-300 relative z-10 overflow-hidden whitespace-nowrap ${isExpanded ? 'w-auto opacity-100 ml-3' : 'w-0 opacity-0 ml-0'}`}>
            Terminate
          </span>
        </button>
      </div>
      
    </div>
  );
};

export default Sidebar;