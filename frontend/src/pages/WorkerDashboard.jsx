import React, { useState, useEffect } from "react";
import { CheckCircle, Truck, Wrench, Loader2, Navigation, AlertOctagon, Camera, X, Upload } from "lucide-react";
import ComplaintCard from "../components/ComplaintCard";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";

const WorkerDashboard = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Active"); 
  
  // New States for the Camera/Resolution Workflow
  const [resolvingTaskId, setResolvingTaskId] = useState(null);
  const [resolutionPreview, setResolutionPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");
      const response = await fetch("http://localhost:8000/complaints/", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch assignments.");

      const dbData = await response.json();

      const formattedData = dbData.map((dbItem) => ({
        id: dbItem.id,
        title: dbItem.title,
        description: dbItem.description,
        category: dbItem.category || "General",
        location: dbItem.address || "Location pending GPS",
        lat: dbItem.location_lat,
        lng: dbItem.location_lng,
        date: "Recently",
        priority: dbItem.priority || dbItem.severity?.toLowerCase() || "medium",
        status: dbItem.status || "Assigned",
        image_url: dbItem.image_url,
        report_count: dbItem.report_count || 1,
      }));

      setAssignments(formattedData.sort((a, b) => b.id - a.id));
    } catch (error) {
      console.error("Dashboard connection error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Image Selection/Capture
  const handleImageCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setResolutionPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Final Submit to Database
  const submitResolution = async () => {
    if (!resolvingTaskId) return;
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");
      
      const response = await fetch(`http://localhost:8000/complaints/${resolvingTaskId}/status?status=Resolved`, {
        method: "POST", 
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to update status");

      setAssignments((prev) =>
        prev.map((task) => (task.id === resolvingTaskId ? { ...task, status: "Resolved" } : task))
      );
      
      // Close modal and reset
      setResolvingTaskId(null);
      setResolutionPreview(null);
    } catch (error) {
      console.error("Error resolving task:", error);
      alert("Network error: Could not verify resolution.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openInOSM = (lat, lng) => {
    if (lat && lng) {
      window.open(`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`, "_blank");
    } else {
      alert("No GPS coordinates available for this task.");
    }
  };

  const filteredAssignments = assignments.filter((task) => {
    const status = task.status.toLowerCase();
    if (activeTab === "Active") {
      return status === "assigned" || status === "in progress" || status === "open";
    }
    return status === "resolved";
  });

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <main className="flex-1 overflow-y-auto p-4 md:p-10 relative">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-emerald-900/10 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          
          <div className="flex flex-col gap-4 border-b border-zinc-800 pb-6 mt-4 md:mt-0">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-zinc-900 border border-zinc-700 rounded-xl text-emerald-500 shadow-inner">
                <Truck size={32} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-zinc-100 uppercase tracking-widest">
                  Field <span className="text-emerald-500">Unit</span>
                </h1>
                <p className="text-xs font-mono text-zinc-400 mt-1">
                  UNIT ID: {user?.name?.toUpperCase() || "ALPHA-42"} // ACTIVE DISPATCH
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800">
            <button
              onClick={() => setActiveTab("Active")}
              className={`flex-1 py-3 text-xs md:text-sm font-mono uppercase tracking-widest rounded-md transition-all flex items-center justify-center gap-2 ${
                activeTab === "Active"
                  ? "bg-zinc-800 text-zinc-100 shadow-md border border-zinc-700"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <AlertOctagon size={16} /> Active Tasks
            </button>
            <button
              onClick={() => setActiveTab("Resolved")}
              className={`flex-1 py-3 text-xs md:text-sm font-mono uppercase tracking-widest rounded-md transition-all flex items-center justify-center gap-2 ${
                activeTab === "Resolved"
                  ? "bg-zinc-800 text-emerald-400 shadow-md border border-zinc-700"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <CheckCircle size={16} /> Resolved
            </button>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-20 text-emerald-500 gap-4">
              <Loader2 className="animate-spin" size={40} />
              <p className="font-mono text-sm uppercase tracking-widest text-zinc-500">Syncing with dispatch...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {filteredAssignments.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
                  <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">
                    No {activeTab.toLowerCase()} assignments.
                  </p>
                </div>
              ) : (
                filteredAssignments.map((task) => (
                  <div key={task.id} className="relative group flex flex-col h-full animate-in fade-in slide-in-from-bottom-4">
                    <ComplaintCard complaint={task} />

                    <div className="mt-2 flex flex-col sm:flex-row gap-2">
                      <button 
                        onClick={() => openInOSM(task.lat, task.lng)}
                        className="flex-1 bg-zinc-900 border border-zinc-800 hover:border-blue-500/50 hover:bg-blue-950/30 text-zinc-300 hover:text-blue-400 py-4 rounded-lg font-mono text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg"
                      >
                        <Navigation size={16} /> Navigate
                      </button>

                      {task.status.toLowerCase() !== "resolved" && (
                        <button 
                          onClick={() => setResolvingTaskId(task.id)}
                          className="flex-[2] bg-emerald-600/90 hover:bg-emerald-500 border border-emerald-500/50 text-white py-4 rounded-lg font-mono text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                        >
                          <Camera size={16} /> Upload Proof & Resolve
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      {/* RESOLUTION CAMERA MODAL */}
      {resolvingTaskId && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-zinc-950/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 relative">
            
            <button 
              onClick={() => { setResolvingTaskId(null); setResolutionPreview(null); }}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-zinc-800 p-1.5 rounded-full z-10"
            >
              <X size={20} />
            </button>

            <div className="p-6 border-b border-zinc-800">
              <h2 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <CheckCircle className="text-emerald-500" /> Verify Resolution
              </h2>
              <p className="text-zinc-400 text-sm mt-2">
                Please provide photographic evidence that the task has been completed before closing this ticket.
              </p>
            </div>

            <div className="p-6 bg-zinc-950/50 flex flex-col items-center">
              {resolutionPreview ? (
                <div className="relative w-full h-48 rounded-lg overflow-hidden border border-zinc-700">
                  <img src={resolutionPreview} alt="Resolution" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setResolutionPreview(null)}
                    className="absolute bottom-2 right-2 bg-rose-600 text-white p-2 rounded-lg text-xs font-bold uppercase shadow-lg flex items-center gap-1 hover:bg-rose-500"
                  >
                    <Upload size={14}/> Retake
                  </button>
                </div>
              ) : (
                <label className="w-full h-48 border-2 border-dashed border-zinc-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-950/20 transition-all group">
                  <Camera size={40} className="text-zinc-500 group-hover:text-emerald-400 mb-3 transition-colors" />
                  <span className="text-zinc-400 font-mono text-sm uppercase tracking-widest group-hover:text-emerald-300">Tap to Open Camera</span>
                  {/* The capture="environment" tag forces mobile phones to open the back camera natively! */}
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageCapture} />
                </label>
              )}
            </div>

            <div className="p-6 border-t border-zinc-800 flex gap-3">
              <button 
                onClick={() => submitResolution()}
                disabled={!resolutionPreview || isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 uppercase tracking-widest text-sm transition-colors"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Wrench size={18} />}
                Confirm & Resolve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerDashboard;