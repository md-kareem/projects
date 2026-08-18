import React, { useState } from 'react';
import { MapPin, Clock, Camera, X } from 'lucide-react';

const ComplaintCard = ({ complaint }) => {
  // NEW: State to control the full-screen image viewer
  const [isModalOpen, setIsModalOpen] = useState(false);

  // We use fallback data just in case a field is missing from the backend
  const { 
    title = "Untitled Issue", 
    description = "No description provided.", 
    location = "Unknown Location", 
    date = "Just now", 
    priority = "low", 
    status = "Pending",
    image_url = null // NEW: Grab the Cloudinary URL from the database
  } = complaint || {};

  // This function dynamically grabs the correct Tailwind classes we wrote in styles.css
  const getPriorityBadgeClass = (priorityLevel) => {
    switch (priorityLevel.toLowerCase()) {
      case 'high': return 'badge-high';
      case 'medium': return 'badge-medium';
      case 'low': return 'badge-low';
      default: return 'badge-low';
    }
  };

  return (
    <>
      {/* .vault-card comes directly from your styles.css @layer components */}
      <div className="vault-card group relative flex flex-col h-full">
        
        {/* Dynamic Priority Badge positioned perfectly in the top right */}
        <div className={`badge ${getPriorityBadgeClass(priority)}`}>
          {priority} PRIORITY
        </div>

        {/* Adding right padding (pr-24) so long titles don't slide underneath the absolute badge */}
        <div className="pr-24 flex-grow">
          <h3 className="text-xl font-bold text-zinc-100 mb-2 truncate" title={title}>
            {title}
          </h3>
          
          {/* line-clamp-2 ensures long descriptions truncate after two lines */}
          <p className="text-sm text-zinc-400 mb-4 line-clamp-2">
            {description}
          </p>

          {/* ==========================================
              PHASE 8: EVIDENCE THUMBNAIL VIEWER
              ========================================== */}
          {image_url && (
            <div 
              onClick={() => setIsModalOpen(true)}
              className="mb-4 relative h-32 w-full rounded-lg overflow-hidden border border-zinc-800 cursor-pointer group/image bg-zinc-950 flex items-center justify-center"
            >
              <img 
                src={image_url} 
                alt="Complaint Evidence" 
                className="object-cover w-full h-full opacity-70 group-hover/image:opacity-30 transition-opacity duration-300"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover/image:opacity-100 transition-all duration-300 scale-95 group-hover/image:scale-100">
                <Camera size={24} className="text-emerald-400 mb-1" />
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest bg-zinc-950/90 px-3 py-1 rounded border border-emerald-900/50 shadow-lg">
                  View Evidence
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 text-xs font-mono text-zinc-500 mt-auto">
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-emerald-500/70 shrink-0" />
              <span className="truncate">{location}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-emerald-500/70 shrink-0" />
              <span>{date}</span>
            </div>
          </div>
        </div>

        {/* Status Footer */}
        <div className="mt-5 pt-4 border-t border-zinc-800/50 flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider font-bold text-zinc-300">
            Status:
          </span>
          <span className={`text-xs px-2 py-1 rounded-md font-mono border ${
            status.toLowerCase() === 'resolved' 
              ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50' 
              : 'bg-zinc-950 text-amber-400 border-zinc-800'
          }`}>
            {status}
          </span>
        </div>
      </div>

      {/* ==========================================
          FULL-SCREEN LIGHTBOX MODAL
          ========================================== */}
      {isModalOpen && image_url && (
        <div 
          className="fixed inset-0 z-[500] flex items-center justify-center bg-zinc-950/90 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()} // Prevents closing when clicking the image itself
          >
            <img 
              src={image_url} 
              alt="Evidence Fullscreen" 
              className="max-w-full max-h-[90vh] rounded-xl border border-zinc-700 shadow-[0_0_50px_rgba(0,0,0,0.8)] object-contain bg-zinc-900"
            />
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute -top-4 -right-4 md:-top-6 md:-right-6 bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-emerald-400 hover:border-emerald-500 rounded-full p-2 transition-all shadow-xl group"
              title="Close Evidence Viewer"
            >
              <X size={24} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ComplaintCard;