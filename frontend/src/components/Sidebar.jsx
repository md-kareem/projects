import React, { useState, useEffect, useRef } from "react";
import {
  Power,
  Shield,
  LayoutDashboard,
  Map,
  Zap,
  History,
  ChevronRight,
  ChevronLeft,
  Settings,
  FileText,
  Users,
  HardHat,
  ChevronDown,
} from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarRef = useRef(null);

  // 1. Roll-Out Drawer States
  const [isExpanded, setIsExpanded] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false); // NEW: Dropdown State

  // 2. View tracking for active states
  const queryParams = new URLSearchParams(location.search);
  const currentView = queryParams.get("view") || "overview";
  
  // 3. Dynamic Base Path for the settings route
  const basePath = user?.role === "admin" ? "/admin" : "/dashboard";

  const handleLogout = () => {
    if (logout) logout();
    else localStorage.removeItem("token");
    navigate("/login");
  };

  // Click-Outside Listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsExpanded(false);
        setIsReportsOpen(false); // Close dropdown when clicking outside
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div
      ref={sidebarRef}
      className={`${isExpanded ? "w-64 shadow-2xl shadow-emerald-900/10" : "w-20"} h-screen bg-zinc-950 border-r border-zinc-800/80 flex flex-col justify-between py-6 transition-all duration-300 relative z-50`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -right-3 top-8 bg-zinc-800 hover:bg-emerald-600 text-zinc-400 hover:text-zinc-950 border border-zinc-700 rounded-full p-1 shadow-lg transition-all duration-200 z-[60]"
        title={isExpanded ? "Close Menu" : "Open Menu"}
      >
        {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* Main Scrollable Area (Allows dropdowns without breaking layout) */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Logo Area */}
        <div className={`flex items-center ${isExpanded ? "px-6 justify-start" : "justify-center"} mb-12 transition-all duration-300`}>
          <div className="w-10 h-10 min-w-[40px] bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center shadow-inner">
            <Shield className="text-emerald-500" size={20} />
          </div>

          <div className={`overflow-hidden whitespace-nowrap transition-all duration-300 flex flex-col justify-center ${isExpanded ? "w-32 opacity-100 ml-3" : "w-0 opacity-0 ml-0"}`}>
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
          {user?.role === "admin" && (
            <>
              <Link
                to="/admin"
                onClick={() => setIsExpanded(false)}
                className={`flex items-center h-12 rounded-xl transition-all duration-200 ${
                  currentView === "overview"
                    ? "bg-zinc-800/80 text-emerald-400 shadow-inner border border-zinc-700/50"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                } ${isExpanded ? "px-4 justify-start" : "justify-center"}`}
                title="Analytics Overview"
              >
                <LayoutDashboard size={20} className="min-w-[20px]" />
                <span className={`font-mono text-xs uppercase tracking-widest overflow-hidden whitespace-nowrap transition-all duration-300 ${isExpanded ? "w-auto opacity-100 ml-3" : "w-0 opacity-0 ml-0"}`}>
                  Overview
                </span>
              </Link>

              <Link
                to="/admin?view=fleet"
                onClick={() => setIsExpanded(false)}
                className={`flex items-center h-12 rounded-xl transition-all duration-200 ${
                  currentView === "fleet"
                    ? "bg-zinc-800/80 text-emerald-400 shadow-inner border border-zinc-700/50"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                } ${isExpanded ? "px-4 justify-start" : "justify-center"}`}
                title="Live Fleet Monitor"
              >
                <Map size={20} className="min-w-[20px]" />
                <span className={`font-mono text-xs uppercase tracking-widest overflow-hidden whitespace-nowrap transition-all duration-300 ${isExpanded ? "w-auto opacity-100 ml-3" : "w-0 opacity-0 ml-0"}`}>
                  Fleet Monitor
                </span>
              </Link>

              {/* NEW: NESTED REPORTS MENU */}
              <div className="flex flex-col overflow-hidden">
                <button
                  onClick={() => { 
                    setIsExpanded(true); 
                    setIsReportsOpen(!isReportsOpen); 
                  }}
                  className={`flex items-center h-12 rounded-xl transition-all duration-200 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 ${isExpanded ? "px-4 justify-start" : "justify-center"}`}
                  title="Authorization Requests"
                >
                  <FileText size={20} className="min-w-[20px]" />
                  <span className={`font-mono text-xs uppercase tracking-widest flex-1 text-left whitespace-nowrap transition-all duration-300 ${isExpanded ? "w-auto opacity-100 ml-3" : "w-0 opacity-0 ml-0"}`}>
                    Requests
                  </span>
                  {isExpanded && <ChevronDown size={14} className={`transition-transform duration-300 ${isReportsOpen ? "rotate-180" : ""}`} />}
                </button>

                <div className={`flex flex-col pl-11 space-y-1 transition-all duration-300 ${isReportsOpen && isExpanded ? "max-h-40 opacity-100 mt-1" : "max-h-0 opacity-0 pointer-events-none"}`}>
                  <Link
                    to="/admin?view=requests&filter=dept"
                    className={`flex items-center h-10 text-[10px] font-mono uppercase tracking-widest transition-colors ${currentView === 'requests' && queryParams.get('filter') === 'dept' ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    <Users size={14} className="mr-2 min-w-[14px]" /> Dept Requests
                  </Link>
                  <Link
                    to="/admin?view=requests&filter=worker"
                    className={`flex items-center h-10 text-[10px] font-mono uppercase tracking-widest transition-colors ${currentView === 'requests' && queryParams.get('filter') === 'worker' ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    <HardHat size={14} className="mr-2 min-w-[14px]" /> Worker Requests
                  </Link>
                </div>
              </div>
            </>
          )}

          {/* CITIZEN LINKS */}
          {user?.role === "citizen" && (
            <>
              <Link
                to="/dashboard"
                onClick={() => setIsExpanded(false)}
                className={`flex items-center h-12 rounded-xl transition-all duration-200 ${
                  (currentView === "overview" || currentView === "report")
                    ? "bg-zinc-800/80 text-emerald-400 shadow-inner border border-zinc-700/50"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                } ${isExpanded ? "px-4 justify-start" : "justify-center"}`}
                title="New Report"
              >
                <Zap size={20} className="min-w-[20px]" />
                <span className={`font-mono text-xs uppercase tracking-widest overflow-hidden whitespace-nowrap transition-all duration-300 ${isExpanded ? "w-auto opacity-100 ml-3" : "w-0 opacity-0 ml-0"}`}>
                  New Report
                </span>
              </Link>

              <Link
                to="/dashboard?view=logs"
                onClick={() => setIsExpanded(false)}
                className={`flex items-center h-12 rounded-xl transition-all duration-200 ${
                  currentView === "logs"
                    ? "bg-zinc-800/80 text-emerald-400 shadow-inner border border-zinc-700/50"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                } ${isExpanded ? "px-4 justify-start" : "justify-center"}`}
                title="My Active Logs"
              >
                <History size={20} className="min-w-[20px]" />
                <span className={`font-mono text-xs uppercase tracking-widest overflow-hidden whitespace-nowrap transition-all duration-300 ${isExpanded ? "w-auto opacity-100 ml-3" : "w-0 opacity-0 ml-0"}`}>
                  My Logs
                </span>
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* BOTTOM SECTION: Settings & Power Buttons */}
      <div className="flex flex-col space-y-2 px-3 pt-4 border-t border-zinc-800/80">
        
        <Link
          to={`${basePath}?view=settings`}
          onClick={() => setIsExpanded(false)}
          className={`group relative flex items-center h-12 rounded-xl transition-all duration-200 ${
            currentView === "settings"
              ? "bg-zinc-800/80 text-emerald-400 shadow-inner border border-zinc-700/50"
              : "bg-transparent text-zinc-600 hover:text-emerald-400 hover:bg-zinc-900"
          } ${isExpanded ? "px-4 justify-start" : "justify-center"}`}
          title="Edit Profile"
        >
          <Settings
            size={22}
            className={`min-w-[22px] transition-colors duration-300 relative z-10 ${currentView === "settings" ? "text-emerald-400" : "text-zinc-600 group-hover:text-emerald-400"}`}
          />
          <span className={`font-mono text-xs uppercase tracking-widest transition-all duration-300 relative z-10 overflow-hidden whitespace-nowrap ${isExpanded ? "w-auto opacity-100 ml-3" : "w-0 opacity-0 ml-0"}`}>
            Settings
          </span>
        </Link>

        <button
          onClick={handleLogout}
          className={`group relative flex items-center h-12 rounded-xl bg-transparent transition-all duration-300 outline-none w-full ${isExpanded ? "px-4 justify-start" : "justify-center"}`}
          title="Terminate Session"
        >
          <div className="absolute inset-0 rounded-xl bg-emerald-500/0 group-hover:bg-emerald-500/10 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all duration-300 pointer-events-none" />

          <Power
            size={22}
            className="min-w-[22px] text-zinc-600 group-hover:text-emerald-400 transition-colors duration-300 relative z-10"
          />

          <span className={`font-mono text-xs text-zinc-600 group-hover:text-emerald-400 uppercase tracking-widest transition-all duration-300 relative z-10 overflow-hidden whitespace-nowrap ${isExpanded ? "w-auto opacity-100 ml-3" : "w-0 opacity-0 ml-0"}`}>
            Terminate
          </span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;