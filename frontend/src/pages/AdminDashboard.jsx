import React, { useState, useEffect } from "react";
import { Activity, AlertOctagon, CheckCircle, Clock, MapPin, Navigation } from "lucide-react";
import { useLocation } from "react-router-dom";
import ComplaintCard from "../components/ComplaintCard";
import Sidebar from "../components/Sidebar";

// Leaflet Map Imports
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom GPS Locate Component
const LocateControl = () => {
  const map = useMap();

  const handleLocate = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.flyTo([latitude, longitude], 14, { duration: 1.5 });
        },
        () => alert("GPS access denied or unavailable.")
      );
    }
  };

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        handleLocate();
      }}
      className="absolute bottom-6 right-4 z-[400] bg-zinc-900 border border-zinc-700 p-3 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)] text-emerald-500 hover:text-emerald-400 hover:bg-zinc-800 transition-all group"
      title="Go to Current Location"
    >
      <Navigation size={20} className="group-hover:scale-110 transition-transform" />
    </button>
  );
};

const AdminDashboard = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const currentView = queryParams.get("view") || "overview";

  // --- LIVE BACKEND INTEGRATION ---
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        // Grab the auth token from local storage (adjust if you store it differently)
        const token = localStorage.getItem("token") || localStorage.getItem("access_token");
        
        const response = await fetch("http://127.0.0.1:8000/complaints/", {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setComplaints(data);
        } else {
          console.error("Failed to fetch live database reports.");
        }
      } catch (error) {
        console.error("Network error fetching complaints:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  // --- DYNAMIC STATISTICS ENGINE ---
  // These boxes now calculate automatically based on the live database!
  const stats = [
    { 
      label: "Active Reports", 
      value: complaints.length.toString(), 
      icon: Activity, 
      color: "text-emerald-500" 
    },
    { 
      label: "Critical Priority", 
      value: complaints.filter(c => (c.priority || "").toLowerCase() === "high" || (c.severity || "").toLowerCase() === "high").length.toString(), 
      icon: AlertOctagon, 
      color: "text-red-500" 
    },
    { 
      label: "Pending Review", 
      value: complaints.filter(c => ["pending", "open", "submitted"].includes((c.status || "").toLowerCase())).length.toString(), 
      icon: Clock, 
      color: "text-amber-500" 
    },
    { 
      label: "Resolved", 
      value: complaints.filter(c => (c.status || "").toLowerCase() === "resolved").length.toString(), 
      icon: CheckCircle, 
      color: "text-blue-500" 
    },
  ];

  // Mock Fleet Workers for the map (To be connected to live DB in Phase 9)
  const mockFleet = [
    { id: 1, name: "Unit 42-ALPHA", lat: 12.9716, lng: 77.5946, status: "Active - Heavy Repair" },
    { id: 2, name: "Unit 07-BRAVO", lat: 12.965, lng: 77.605, status: "Idle - Inspection" },
  ];

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-6 md:p-10 relative">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-emerald-900/10 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto space-y-8 relative z-10">
          
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800 pb-6">
            <div>
              <h1 className="text-3xl font-bold text-zinc-100 uppercase tracking-widest">
                Command <span className="text-emerald-500">Center</span>
              </h1>
              <p className="text-sm font-mono text-zinc-400 mt-2">
                OVERSEER TERMINAL // {currentView === 'fleet' ? 'FLEET TRACKING ACTIVE' : 'SYSTEM STATUS: NOMINAL'}
              </p>
            </div>

            <div className="flex items-center gap-3 bg-zinc-900/50 px-4 py-2 rounded-lg border border-zinc-800 shadow-inner">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-mono text-emerald-500 uppercase tracking-widest">
                Live Data Feed
              </span>
            </div>
          </div>

          {/* DYNAMIC VIEW RENDERING */}
          {currentView === "fleet" ? (
            /* ========================================================
               VIEW 1: THE FLEET MONITOR MAP
               ======================================================== */
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-full h-[600px] bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden shadow-2xl relative">
                <div className="absolute top-4 right-4 z-[400] bg-zinc-950/90 border border-zinc-800 px-3 py-2 rounded-lg backdrop-blur-md pointer-events-none">
                  <p className="text-xs font-mono text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                    <MapPin size={14} /> Fleet Monitor Active
                  </p>
                </div>

                <MapContainer center={[12.9716, 77.5946]} zoom={13} style={{ height: "100%", width: "100%", zIndex: 1 }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />
                  
                  <LocateControl />

                  {/* Plot the Field Workers */}
                  {mockFleet.map((worker) => (
                    <Marker key={worker.id} position={[worker.lat, worker.lng]}>
                      <Popup className="custom-popup">
                        <div className="p-1 min-w-[150px]">
                          <p className="font-bold text-sm uppercase text-emerald-400 mb-1">{worker.name}</p>
                          <p className="text-xs text-zinc-300 font-mono">{worker.status}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </div>
          ) : (
            /* ========================================================
               VIEW 2: THE STANDARD ANALYTICS DASHBOARD
               ======================================================== */
            <div className="animate-in fade-in duration-500 space-y-8">
              {/* Top Analytics Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div key={index} className="vault-card p-6 bg-zinc-900/50 border border-zinc-800/80 rounded-xl flex items-center justify-between shadow-lg backdrop-blur-sm">
                      <div>
                        <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1">{stat.label}</p>
                        <p className="text-3xl font-bold text-zinc-100">{stat.value}</p>
                      </div>
                      <div className={`p-3 bg-zinc-950 rounded-lg border border-zinc-800 shadow-inner ${stat.color}`}>
                        <Icon size={24} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Main Feed Section */}
              <div className="space-y-6 pt-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-zinc-100 uppercase tracking-wide flex items-center gap-2">
                    <Activity className="text-emerald-500" size={20} />
                    Live Submissions
                  </h2>
                </div>
                
                {isLoading ? (
                  <div className="text-zinc-500 font-mono text-center py-10 animate-pulse">
                    Decrypting Database Stream...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {complaints.length === 0 ? (
                      <div className="col-span-full text-zinc-500 font-mono text-center py-10">
                        No active reports found in the network.
                      </div>
                    ) : (
                      complaints.map((complaint) => (
                        <ComplaintCard key={complaint.id} complaint={complaint} />
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;