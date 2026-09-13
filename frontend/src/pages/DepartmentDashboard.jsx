import React, { useState, useEffect } from "react";
import {
  Wrench,
  Filter,
  AlertCircle,
  CheckCircle2,
  Clock,
  Truck,
  Loader2,
  MapPin,
  Navigation 
} from "lucide-react";
import { useLocation } from "react-router-dom"; 
import ComplaintCard from "../components/ComplaintCard";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import EditProfile from '../components/EditProfile';
import LiveClock from "../components/LiveClock";

// Leaflet Map Imports
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css"; 
import L from "leaflet";

// Fix for default Leaflet marker icons in React
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

// ==========================================
// Custom GPS Locate Component
// ==========================================
const LocateControl = () => {
  const map = useMap();

  const handleLocate = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        map.flyTo([latitude, longitude], 14, {
          duration: 1.5 
        });
      }, () => {
        alert("GPS access denied or unavailable.");
      });
    }
  };

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        handleLocate();
      }}
      className="absolute bottom-6 right-4 z-[400] bg-zinc-900 border border-zinc-700 p-3 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)] text-blue-500 hover:text-blue-400 hover:bg-zinc-800 transition-all group"
      title="Go to Current Location"
    >
      <Navigation size={20} className="group-hover:scale-110 transition-transform" />
    </button>
  );
};

const DepartmentDashboard = () => {
  const { user } = useAuth();
  
  // --- ADDED: READ THE URL ---
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const currentView = queryParams.get("view") || "dispatch";

  const [activeFilter, useStateFilter] = useState("All");
  const setActiveFilter = useStateFilter; // Just aliasing to prevent React unused warnings if modified later

  // Real database states
  const [departmentTasks, setDepartmentTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dispatch Panel States
  const [dispatchingTaskId, setDispatchingTaskId] = useState(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [isDispatching, setIsDispatching] = useState(false);

  // Default Map Center (Bengaluru)
  const defaultCenter = [12.9716, 77.5946];

  useEffect(() => {
    fetchRealLogs();
  }, []);

  const fetchRealLogs = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/complaints/", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch database logs.");

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
        created_at: dbItem.created_at, // FIX: Passes actual timestamp to ComplaintCard
        priority: dbItem.priority || dbItem.severity?.toLowerCase() || "medium",
        status: dbItem.status || "Pending",
        image_url: dbItem.image_url,
        report_count: dbItem.report_count || 1
      }));

      // Sort newest at the top
      setDepartmentTasks(formattedData.sort((a, b) => b.id - a.id));
    } catch (error) {
      console.error("Dashboard connection error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDispatch = async (taskId) => {
    if (!selectedWorkerId) {
      alert("Please select a Field Unit to dispatch.");
      return;
    }

    setIsDispatching(true);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:8000/complaints/${taskId}/assign?worker_id=${selectedWorkerId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to dispatch unit.");

      setDepartmentTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, status: "Assigned" } : task
        )
      );

      setDispatchingTaskId(null);
      setSelectedWorkerId("");
    } catch (error) {
      console.error("Dispatch Error:", error);
      alert("Failed to communicate with dispatch server.");
    } finally {
      setIsDispatching(false);
    }
  };

  const filteredTasks = departmentTasks.filter((task) => {
    if (activeFilter === "All") return true;

    if (activeFilter === "Pending") {
      const statusLower = task.status.toLowerCase();
      return (
        statusLower.includes("pending") || statusLower.includes("submitted")
      );
    }

    return task.status === activeFilter;
  });

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-6 md:p-10 relative">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto space-y-8 relative z-10">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800 pb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-zinc-900 border border-zinc-700 rounded-xl text-blue-500 shadow-inner">
                <Wrench size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-zinc-100 uppercase tracking-widest">
                  Infrastructure <span className="text-blue-500">Dispatch</span>
                </h1>
                <p className="text-sm font-mono text-zinc-400 mt-1">
                  AUTHORIZED PERSONNEL ONLY // {user?.name?.toUpperCase() || "UNIT COMMANDER"}
                  {currentView === 'settings' && " // IDENTITY MANAGEMENT"}
                </p>
              </div>
            </div>

            {/* INTEGRATED LIVE CLOCK & DATA INDICATOR */}
            <div className="flex items-center gap-4">
              <LiveClock />
              <div className="px-4 py-2 bg-blue-950/30 border border-blue-900/50 rounded-lg shadow-inner">
                <p className="text-xs font-mono text-blue-400 uppercase tracking-widest text-center">
                  Active Units: 2
                </p>
              </div>
            </div>
          </div>

          {/* DYNAMIC INTERCEPTOR */}
          {currentView === "settings" ? (
            /* VIEW 1: SETTINGS / PROFILE EDITOR */
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <EditProfile />
            </div>
          ) : (
            /* VIEW 2: STANDARD DISPATCH DASHBOARD */
            <div className="space-y-8 animate-in fade-in duration-500">
              
              {/* Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 vault-card p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
                <div className="flex items-center gap-2 text-zinc-400 font-mono text-sm uppercase tracking-wider mb-2 sm:mb-0">
                  <Filter size={16} />
                  <span>Filter Queue:</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {["All", "Pending", "Assigned", "Resolved"].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wider transition-all border ${
                        activeFilter === filter
                          ? "bg-zinc-800 border-zinc-600 text-zinc-100 shadow-sm"
                          : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center p-12 text-blue-500">
                  <Loader2 className="animate-spin" size={32} />
                </div>
              ) : (
                <>
                  {/* Map */}
                  <div className="w-full h-[400px] bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden shadow-2xl relative">
                    <div className="absolute top-4 right-4 z-[400] bg-zinc-950/90 border border-zinc-800 px-3 py-2 rounded-lg backdrop-blur-md pointer-events-none">
                      <p className="text-xs font-mono text-blue-400 uppercase tracking-widest flex items-center gap-2">
                        <MapPin size={14} /> Tactical Overview
                      </p>
                    </div>

                    <MapContainer
                      center={defaultCenter}
                      zoom={12}
                      style={{ height: "100%", width: "100%", zIndex: 1 }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap contributors'
                      />

                      <LocateControl />

                      {filteredTasks
                        .filter((t) => t.lat && t.lng)
                        .map((task) => (
                          <Marker
                            key={`map-${task.id}`}
                            position={[task.lat, task.lng]}
                          >
                            <Popup className="custom-popup">
                              <div className="p-1 min-w-[200px]">
                                <p className="font-bold text-sm uppercase mb-1">
                                  {task.title}
                                </p>
                                <p className="text-xs text-gray-500 mb-3 uppercase font-mono">
                                  {task.status}
                                </p>

                                {(task.status.toLowerCase().includes("pending") ||
                                  task.status
                                    .toLowerCase()
                                    .includes("submitted")) && (
                                  <button
                                    onClick={() => {
                                      setDispatchingTaskId(task.id);
                                      window.scrollTo({
                                        top: document.body.scrollHeight,
                                        behavior: "smooth",
                                      });
                                    }}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono py-2 rounded transition-colors"
                                  >
                                    Dispatch Unit Here
                                  </button>
                                )}
                              </div>
                            </Popup>
                          </Marker>
                        ))}
                    </MapContainer>
                  </div>

                  {/* Task List Header */}
                  <div className="flex items-center gap-3 border-b border-zinc-800/80 pb-2 mt-8">
                    <h2 className="text-lg font-bold text-zinc-200 uppercase tracking-wide">
                      {activeFilter} Assignments
                    </h2>
                    <span className="text-xs font-mono bg-zinc-900 text-zinc-400 px-2 py-1 rounded border border-zinc-800 ml-auto">
                      {filteredTasks.length} RESULTS
                    </span>
                  </div>

                  {/* Task List Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                    {filteredTasks.map((task) => (
                      <div
                        key={task.id}
                        className="relative group flex flex-col h-full"
                      >
                        <ComplaintCard complaint={task} />

                        {(task.status.toLowerCase().includes("pending") ||
                          task.status.toLowerCase().includes("submitted") ||
                          task.status.toLowerCase().includes("open")) && (
                          <div className="mt-2">
                            {dispatchingTaskId === task.id ? (
                              <div className="p-4 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
                                <label className="text-xs font-mono text-blue-400 uppercase tracking-widest">
                                  Select Available Unit
                                </label>

                                <select
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-sm text-zinc-200 focus:border-blue-500 outline-none"
                                  value={selectedWorkerId}
                                  onChange={(e) =>
                                    setSelectedWorkerId(e.target.value)
                                  }
                                >
                                  <option value="">-- Select Field Unit --</option>
                                  <option value="2">
                                    Unit 42-ALPHA (Heavy Repair)
                                  </option>
                                  <option value="3">
                                    Unit 07-BRAVO (Inspection)
                                  </option>
                                </select>

                                <div className="flex gap-2 mt-1">
                                  <button
                                    onClick={() => setDispatchingTaskId(null)}
                                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs uppercase py-2 rounded transition-colors"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleDispatch(task.id)}
                                    disabled={isDispatching}
                                    className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 text-zinc-50 font-bold font-mono text-xs uppercase py-2 rounded transition-colors flex justify-center items-center gap-2"
                                  >
                                    {isDispatching ? (
                                      <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                      <Truck size={14} />
                                    )}
                                    Dispatch
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDispatchingTaskId(task.id)}
                                className="w-full bg-zinc-900 border border-zinc-800 hover:border-blue-500/50 hover:bg-blue-950/30 text-zinc-400 hover:text-blue-400 py-3 rounded-lg font-mono text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                              >
                                <Truck size={16} />
                                Assign to Field Unit
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    {filteredTasks.length === 0 && (
                      <div className="col-span-full p-12 text-center border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
                        <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">
                          NO TASKS FOUND FOR CURRENT FILTER
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DepartmentDashboard;