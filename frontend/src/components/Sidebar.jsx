import React from 'react';
import { Power, Shield, LayoutDashboard, Map } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { logout, user } = useAuth(); 
  const navigate = useNavigate();
  const location = useLocation();

  // Read the current view from the URL (defaults to 'overview')
  const queryParams = new URLSearchParams(location.search);
  const currentView = queryParams.get('view') || 'overview';

  const handleLogout = () => {
    if (logout) logout(); 
    else localStorage.removeItem('token'); 
    
    navigate('/login');
  };

  return (
    <div className="w-20 lg:w-64 h-screen bg-zinc-950 border-r border-zinc-800/80 flex flex-col justify-between py-6 transition-all duration-300 relative z-20">
      
      {/* TOP SECTION: Branding & Links */}
      <div>
        {/* Logo Area */}
        <div className="flex items-center justify-center lg:justify-start lg:px-6 mb-12">
          <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center shadow-inner">
            <Shield className="text-emerald-500" size={20} />
          </div>
          <div className="hidden lg:block ml-3">
            <h2 className="font-bold text-zinc-100 uppercase tracking-widest text-sm leading-tight">
              SmartCity
            </h2>
            <p className="text-[10px] text-emerald-500 font-mono tracking-widest">
              NETWORK
            </p>
          </div>
        </div>

        {/* DYNAMIC MENU LINKS */}
        <nav className="flex flex-col px-2 lg:px-4 space-y-2">
           {/* Only show these specific tabs if the user is an Admin */}
           {user?.role === 'admin' && (
             <>
               <Link 
                 to="/admin" 
                 className={`flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl transition-all duration-200 ${
                   currentView === 'overview' 
                     ? 'bg-zinc-800/80 text-emerald-400 shadow-inner border border-zinc-700/50' 
                     : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                 }`}
                 title="Analytics Overview"
               >
                 <LayoutDashboard size={20} />
                 <span className="hidden lg:block font-mono text-xs uppercase tracking-widest">Overview</span>
               </Link>

               <Link 
                 to="/admin?view=fleet" 
                 className={`flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl transition-all duration-200 ${
                   currentView === 'fleet' 
                     ? 'bg-zinc-800/80 text-emerald-400 shadow-inner border border-zinc-700/50' 
                     : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                 }`}
                 title="Live Fleet Monitor"
               >
                 <Map size={20} />
                 <span className="hidden lg:block font-mono text-xs uppercase tracking-widest">Fleet Monitor</span>
               </Link>
             </>
           )}
        </nav>
      </div>

      {/* BOTTOM SECTION: The Shadow Power Button */}
      <div className="flex justify-center lg:justify-start lg:px-6 pb-4">
        <button
          onClick={handleLogout}
          className="group relative flex items-center justify-center w-12 h-12 lg:w-full lg:justify-start lg:px-4 lg:py-3 rounded-xl bg-transparent transition-all duration-300 outline-none"
          title="Terminate Session"
        >
          <div className="absolute inset-0 rounded-xl bg-emerald-500/0 group-hover:bg-emerald-500/10 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all duration-300 pointer-events-none" />
          <Power 
            size={22} 
            className="text-zinc-600 group-hover:text-emerald-400 transition-colors duration-300 relative z-10" 
          />
          <span className="hidden lg:block ml-3 font-mono text-xs text-zinc-600 group-hover:text-emerald-400 uppercase tracking-widest transition-colors duration-300 relative z-10">
            Terminate Session
          </span>
        </button>
      </div>
      
    </div>
  );
};

export default Sidebar;