import React, { useState } from 'react';
import { MapPin, Clock, Camera, X, Users, AlertTriangle, Layers } from 'lucide-react';

const ComplaintCard = ({ complaint }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { 
    title = "Untitled Issue", 
    description = "No description provided.", 
    location = "Location pending GPS", 
    date = "Just now", 
    priority = "low", 
    status = "Pending",
    image_url = null,
    report_count = 1,
    category = "General"
  } = complaint || {};

  const getPriorityBadgeClass = (priorityLevel) => {
    switch (priorityLevel?.toLowerCase()) {
      case 'high': return 'bg-rose-950/50 text-rose-400 border-rose-900/50 shadow-[0_0_10px_rgba(225,29,72,0.2)]';
      case 'medium': return 'bg-amber-950/50 text-amber-400 border-amber-900/50 shadow-[0_0_10px_rgba(251,191,36,0.2)]';
      case 'low': return 'bg-emerald-950/50 text-emerald-400 border-emerald-900/50 shadow-[0_0_10px_rgba(52,211,153,0.2)]';
      default: return 'bg-zinc-900 text-zinc-400 border-zinc-800';
    }
  };

  const isCluster = report_count > 1;

  return (
    <>
      {/* Enhanced Hover & Entrance Animation */}
      <div className={`vault-card group relative flex flex-col h-full bg-zinc-950/50 border rounded-xl p-5 transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-2xl ${
        isCluster 
          ? 'border-rose-900/30 hover:border-rose-700/50 hover:shadow-[0_10px_40px_rgba(225,29,72,0.15)]' 
          : 'border-zinc-800/80 hover:border-zinc-600/80 hover:shadow-[0_10px_40px_rgba(0,0,0,0.3)]'
      } animate-in fade-in zoom-in-95 duration-500`}>
        
        {/* Dynamic Priority Badge */}
        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border backdrop-blur-md transition-all duration-300 group-hover:scale-105 ${getPriorityBadgeClass(priority)}`}>
          {priority} PRIORITY
        </div>

        <div className="pr-24 flex-grow">
          
          {/* Department / Category Tag */}
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 mb-3 uppercase tracking-widest transition-colors group-hover:text-zinc-400">
            <Layers size={14} className="text-blue-500/70" />
            {category}
          </div>

          <h3 className="text-xl font-bold text-zinc-100 mb-2 truncate transition-colors group-hover:text-white" title={title}>
            {title}
          </h3>
          
          <p className="text-sm text-zinc-400 mb-4 line-clamp-2 leading-relaxed transition-colors group-hover:text-zinc-300">
            {description}
          </p>

          {/* ==========================================
              PHASE 4: INCIDENT CLUSTER WARNING BADGE
              ========================================== */}
          {isCluster && (
            <div className="flex items-center gap-2 mb-5 bg-gradient-to-r from-rose-950/40 to-transparent border-l-2 border-rose-500 text-rose-400 px-3 py-2 text-xs font-bold tracking-wide w-fit relative overflow-hidden transition-all duration-300 group-hover:from-rose-950/60">
              <AlertTriangle size={14} className="animate-pulse drop-shadow-[0_0_5px_rgba(225,29,72,0.8)]" />
              CLUSTER: VERIFIED BY {report_count} CITIZENS
            </div>
          )}

          {/* Evidence Thumbnail Viewer */}
          {image_url && (
            <div 
              onClick={() => setIsModalOpen(true)}
              className="mb-5 relative h-36 w-full rounded-lg overflow-hidden border border-zinc-800/80 cursor-pointer group/image bg-zinc-900 flex items-center justify-center transition-all duration-500 group-hover:border-zinc-600"
            >
              <img 
                src={image_url} 
                alt="Complaint Evidence" 
                className="object-cover w-full h-full opacity-60 group-hover/image:opacity-40 transition-all duration-700 group-hover/image:scale-110 group-hover/image:rotate-1"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover/image:opacity-100 transition-all duration-300 scale-90 group-hover/image:scale-100 backdrop-blur-sm bg-zinc-950/40">
                <Camera size={28} className="text-emerald-400 mb-2 drop-shadow-md" />
                <span className="text-[10px] font-mono text-emerald-300 uppercase tracking-widest bg-emerald-950/80 px-3 py-1.5 rounded-md border border-emerald-800 shadow-xl">
                  Expand Evidence
                </span>
              </div>
            </div>
          )}

          {/* Location and Time Data */}
          <div className="flex flex-col gap-2.5 text-xs font-mono text-zinc-500 mt-auto bg-zinc-950/30 p-3 rounded-lg border border-zinc-800/50">
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-emerald-500/70 shrink-0" />
              <span className="truncate group-hover:text-zinc-400 transition-colors">{location || "Location pending GPS"}</span>
            </div>
            
            <div className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-emerald-500/70 shrink-0" />
                <span className="group-hover:text-zinc-400 transition-colors">{date}</span>
              </div>
              
              {/* Subtle Single Report Indicator if not clustered */}
              {!isCluster && (
                <div className="flex items-center gap-1.5 text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
                  <Users size={10} />
                  <span className="text-[10px]">1 Report</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Footer */}
        <div className="mt-5 pt-4 border-t border-zinc-800/50 flex items-center justify-between transition-colors group-hover:border-zinc-700/50">
          <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">
            Status / Action
          </span>
          <span className={`text-[10px] px-2.5 py-1 rounded-md font-mono font-bold uppercase tracking-wider border shadow-sm transition-colors ${
            status.toLowerCase() === 'resolved' 
              ? 'bg-emerald-950/50 text-emerald-400 border-emerald-900/50' 
              : status.toLowerCase() === 'assigned'
              ? 'bg-blue-950/50 text-blue-400 border-blue-900/50'
              : 'bg-amber-950/30 text-amber-500 border-amber-900/30'
          }`}>
            {status}
          </span>
        </div>
      </div>

      {/* FULL-SCREEN LIGHTBOX MODAL */}
      {isModalOpen && image_url && (
        <div 
          className="fixed inset-0 z-[500] flex items-center justify-center bg-zinc-950/90 backdrop-blur-lg p-4 animate-in fade-in duration-300"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="relative max-w-5xl w-full max-h-[90vh] flex items-center justify-center animate-in zoom-in-95 duration-300 slide-in-from-bottom-4"
            onClick={(e) => e.stopPropagation()} 
          >
            <img 
              src={image_url} 
              alt="Evidence Fullscreen" 
              className="max-w-full max-h-[90vh] rounded-xl border border-zinc-700 shadow-[0_0_50px_rgba(0,0,0,0.8)] object-contain bg-zinc-900"
            />
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute -top-4 -right-4 md:-top-6 md:-right-6 bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-emerald-400 hover:border-emerald-500 rounded-full p-2.5 transition-all hover:scale-110 shadow-2xl hover:shadow-emerald-500/20 group"
              title="Close Evidence Viewer"
            >
              <X size={24} className="transition-transform group-hover:rotate-90" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ComplaintCard;