import React, { useState } from 'react';
import { ShieldAlert, ArrowLeft, CheckCircle, Copy, AlertTriangle } from 'lucide-react';
import ComplaintForm from '../components/ComplaintForm';
import { useAuth } from '../context/AuthContext';

const ReportIssue = () => {
  const { user } = useAuth();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [trackingId, setTrackingId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    console.log('Transmitting report to central database...', formData);
    
    try {
      // THE FIX: Actually sending the data to your FastAPI backend!
      // Make sure this URL matches your local FastAPI server address and port
      const response = await fetch('http://127.0.0.1:8000/complaints/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // formData must contain: title, description, category, address, and image_url
        body: JSON.stringify(formData) 
      });

      if (response.ok) {
        const savedComplaint = await response.json();
        
        // Grab the real ID from the database, fallback to mock if missing
        const realId = savedComplaint.id 
          ? `REP-${String(savedComplaint.id).padStart(6, '0')}` 
          : `REP-${Math.floor(100000 + Math.random() * 900000)}`;
          
        setTrackingId(realId);
        setIsSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const errorData = await response.json();
        console.error("Backend validation failed:", errorData);
        alert("Failed to save report. Please check the console for details.");
      }
    } catch (error) {
      console.error("Network error during submission:", error);
      alert("Failed to connect to the server. Is FastAPI running?");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(trackingId);
    alert(`Tracking ID ${trackingId} copied to clipboard.`);
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-6 md:p-10 relative overflow-hidden">
      
      {/* Background Aesthetic */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-amber-900/10 to-transparent pointer-events-none"></div>

      <div className="max-w-3xl mx-auto relative z-10 space-y-6">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <a 
            href="/dashboard" 
            className="flex items-center gap-2 text-zinc-400 hover:text-emerald-400 transition-colors text-sm font-mono uppercase tracking-widest"
          >
            <ArrowLeft size={16} />
            Back to Terminal
          </a>
          
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-950/30 border border-amber-900/50 rounded-full">
            <ShieldAlert size={14} className="text-amber-500" />
            <span className="text-xs font-mono text-amber-500 uppercase tracking-widest">
              Official Logging System
            </span>
          </div>
        </div>

        {/* Page Content */}
        {!isSubmitted ? (
          <div className="space-y-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-zinc-100 uppercase tracking-widest mb-2">
                File a <span className="text-amber-500">New Report</span>
              </h1>
              <p className="text-sm font-mono text-zinc-400">
                CITIZEN ID: {user?.id || 'UNREGISTERED'} // ALL FIELDS MANDATORY
              </p>
            </div>

            {/* Warning Banner */}
            <div className="p-4 border border-zinc-800 rounded-lg bg-zinc-900/50 flex items-start gap-3">
              <AlertTriangle className="text-zinc-500 shrink-0 mt-0.5" size={18} />
              <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider leading-relaxed">
                For immediate life-threatening emergencies or crimes in progress, close this application and contact emergency services (911) directly. This system is for non-emergency municipal infrastructure reporting only.
              </p>
            </div>

            {/* Injecting the reusable form */}
            <div className={isSubmitting ? "opacity-50 pointer-events-none transition-opacity" : ""}>
               <ComplaintForm onSubmit={handleFormSubmit} />
            </div>
          </div>
        ) : (
          /* Success Ticket State */
          <div className="vault-card p-8 text-center space-y-6 mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-950/50 border border-emerald-900/50">
              <CheckCircle size={40} className="text-emerald-500" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-zinc-100 uppercase tracking-wide">
                Report Logged Successfully
              </h2>
              <p className="text-sm font-mono text-zinc-400 mt-2">
                Your submission has been securely transmitted to the relevant department.
              </p>
            </div>

            <div className="max-w-sm mx-auto p-6 bg-zinc-950 border border-zinc-800 rounded-lg mt-6 relative group">
              <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-2">
                Official Tracking ID
              </p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl font-bold font-mono text-emerald-400 tracking-wider">
                  {trackingId}
                </span>
                <button 
                  onClick={copyToClipboard}
                  className="p-2 text-zinc-500 hover:text-emerald-400 hover:bg-emerald-950/30 rounded-md transition-all"
                  title="Copy Tracking ID"
                >
                  <Copy size={20} />
                </button>
              </div>
            </div>

            <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a 
                href="/dashboard"
                className="px-6 py-3 bg-zinc-900 border border-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors font-mono text-sm uppercase tracking-wider w-full sm:w-auto"
              >
                Return to Dashboard
              </a>
              <button 
                onClick={() => setIsSubmitted(false)}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold rounded-lg transition-colors font-mono text-sm uppercase tracking-wider w-full sm:w-auto"
              >
                File Another Report
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ReportIssue;