import React, { useState, useEffect, useRef } from "react";
import {
  HardHat,
  MapPin,
  CheckSquare,
  Truck,
  CheckCircle2,
  Loader2,
  Camera,
  X,
  Upload
} from "lucide-react";
import ComplaintCard from "../components/ComplaintCard";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import MapComponent from "../components/MapComponent";

const WorkerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("queue");
  const [myTasks, setMyTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- NEW CAMERA & VERIFICATION STATE ---
  const [resolvingTaskId, setResolvingTaskId] = useState(null); 
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolutionImage, setResolutionImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem("token");
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
          location: dbItem.address || "Location pending GPS",
          date: "Assigned Today",
          priority: dbItem.severity || "high",
          status: dbItem.status || "Pending",
        }));

        setMyTasks(formattedData.sort((a, b) => b.id - a.id));
      } catch (error) {
        console.error("Dashboard connection error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // --- NEW FILE HANDLING FUNCTIONS ---
  const handleImageCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResolutionImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const cancelResolution = () => {
    setResolvingTaskId(null);
    setResolutionImage(null);
    setResolutionNotes("");
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  // --- UPGRADED SUBMIT FUNCTION FOR FILES ---
  const submitVerification = async (taskId) => {
    if (!resolutionImage) {
      alert("Verification photo is required to close this task.");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      
      const formData = new FormData();
      formData.append("notes", resolutionNotes || "Task completed. No notes provided.");
      formData.append("image", resolutionImage); 

      const response = await fetch(
        `http://localhost:8000/worker/complaints/${taskId}/resolve`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: formData, 
        }
      );

      if (!response.ok) throw new Error("Backend rejected the resolution.");

      setMyTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, status: "Resolved" } : task
        )
      );
      
      cancelResolution();
      console.log(`Task ${taskId} verified and resolved.`);

    } catch (error) {
      console.error("Failed to sync verification:", error);
      alert("Upload failed. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingTasks = myTasks.filter((task) => task.status !== "Resolved");
  const completedTasks = myTasks.filter((task) => task.status === "Resolved");

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 md:p-10 relative">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-amber-900/10 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto space-y-8 relative z-10">
          
          {/* Field Worker Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800 pb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-zinc-900 border border-zinc-700 rounded-xl text-amber-500 shadow-inner">
                <HardHat size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-zinc-100 uppercase tracking-widest">
                  Field <span className="text-amber-500">Unit</span>
                </h1>
                <p className="text-sm font-mono text-zinc-400 mt-1">
                  UNIT ID: 42-ALPHA // OPERATOR: {user?.name?.toUpperCase() || "FIELD TECH"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 bg-amber-950/30 border border-amber-900/50 rounded-lg">
              <Truck size={18} className="text-amber-500 animate-pulse" />
              <p className="text-xs font-mono text-amber-400 uppercase tracking-widest">
                GPS: Tracking Active
              </p>
            </div>
          </div>

          {/* MAP DASHBOARD SECTION - Placed right below the header! */}
          <div className="w-full h-80 bg-zinc-900 border border-zinc-800 rounded-lg p-2 shadow-lg relative z-0">
            <MapComponent 
              workerLocation={{ lat: 12.9716, lng: 77.5946 }} // Hardcoded for testing
              complaintLocation={{ lat: 12.9850, lng: 77.6000 }} 
            />
          </div>

          {/* Action Bar */}
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-1 w-full max-w-md">
            <button
              onClick={() => setActiveTab("queue")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md font-mono text-xs uppercase tracking-wider transition-all ${
                activeTab === "queue" ? "bg-zinc-800 text-amber-400 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <MapPin size={16} /> Active Route ({pendingTasks.length})
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md font-mono text-xs uppercase tracking-wider transition-all ${
                activeTab === "completed" ? "bg-zinc-800 text-emerald-400 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <CheckSquare size={16} /> Completed ({completedTasks.length})
            </button>
          </div>

          {/* Task Feed */}
          <div className="space-y-6 pt-2">
            {isLoading ? (
              <div className="flex items-center justify-center p-12 text-amber-500">
                <Loader2 className="animate-spin" size={32} />
              </div>
            ) : activeTab === "queue" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingTasks.map((task) => (
                  <div key={task.id} className="relative group flex flex-col h-full">
                    <ComplaintCard complaint={task} />

                    {/* DYNAMIC BOTTOM PANEL */}
                    {resolvingTaskId === task.id ? (
                      <div className="mt-2 p-4 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
                        
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-xs font-mono text-amber-400 uppercase tracking-widest">Verification Required</p>
                          <button onClick={cancelResolution} className="text-zinc-500 hover:text-red-400 transition-colors">
                            <X size={18} />
                          </button>
                        </div>

                        {/* Hidden File Input */}
                        <input 
                          type="file" 
                          accept="image/*" 
                          capture="environment" 
                          ref={fileInputRef}
                          onChange={handleImageCapture}
                          className="hidden"
                        />

                        {/* Image Preview or Capture Button */}
                        {previewUrl ? (
                          <div className="relative h-32 w-full rounded-md overflow-hidden border border-zinc-700">
                            <img src={previewUrl} alt="Verification" className="w-full h-full object-cover" />
                            <button 
                              onClick={() => fileInputRef.current?.click()}
                              className="absolute bottom-2 right-2 bg-zinc-900/80 p-2 rounded-full text-zinc-300 hover:text-amber-400 border border-zinc-700"
                            >
                              <Upload size={16} />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="h-32 w-full border-2 border-dashed border-zinc-700 hover:border-amber-500/50 bg-zinc-950/50 rounded-md flex flex-col items-center justify-center gap-2 text-zinc-500 hover:text-amber-400 transition-colors group"
                          >
                            <Camera size={28} className="group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-mono uppercase tracking-wider">Tap to Capture</span>
                          </button>
                        )}

                        {/* Notes Input */}
                        <textarea
                          placeholder="Resolution details..."
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-sm text-zinc-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none resize-none h-20"
                        />

                        {/* Submit Final Verification */}
                        <button
                          onClick={() => submitVerification(task.id)}
                          disabled={isSubmitting || !resolutionImage}
                          className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-bold font-mono text-xs uppercase tracking-widest py-3 rounded-md transition-all flex justify-center items-center gap-2"
                        >
                          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                          {isSubmitting ? "Uploading..." : "Verify & Close Job"}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setResolvingTaskId(task.id)}
                        className="w-full mt-2 bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 hover:bg-amber-950/30 text-zinc-400 hover:text-amber-400 py-3 rounded-lg font-mono text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                      >
                        <Camera size={16} />
                        Verify Resolution
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75">
                {completedTasks.map((task) => (
                  <ComplaintCard key={task.id} complaint={task} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default WorkerDashboard;