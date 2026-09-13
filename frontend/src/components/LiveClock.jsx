import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const LiveClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-lg shadow-inner">
      <Clock size={14} className="text-emerald-500" />
      <span className="text-[10px] font-mono text-zinc-300 uppercase tracking-widest">
        {time.toLocaleDateString('en-GB', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric' 
        })} // {time.toLocaleTimeString('en-GB', { hour12: false })}
      </span>
    </div>
  );
};

export default LiveClock;