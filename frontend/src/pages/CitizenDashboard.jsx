import React, { useState, useEffect } from "react";
import {
  UserCircle,
  History,
  Zap,
  Loader2,
  CheckCircle,
  Activity,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import ComplaintForm from "../components/ComplaintForm";
import ComplaintCard from "../components/ComplaintCard";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";

const CitizenDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Read the current view from the URL (defaults to 'report' so the map shows first)
  const queryParams = new URLSearchParams(location.search);
  const currentView = queryParams.get("view") || "report";

  const [myComplaints, setMyComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // NEW: State for toggling between Active logs and the Resolution Archive
  const [logTab, setLogTab] = useState("Active");

  // FETCH ALL EXISTING LOGS FROM DATABASE
  useEffect(() => {
    const fetchRealLogs = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:8000/complaints/", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch database logs.");

        const dbData = await response.json();

        // UPGRADED: Added category, lat, lng, and report_count for the new ComplaintCard
        const formattedData = dbData.map((dbItem) => ({
          id: dbItem.id,
          title: dbItem.title,
          description: dbItem.description,
          category: dbItem.category || "General",
          location: dbItem.address || "Location pending GPS",
          lat: dbItem.location_lat,
          lng: dbItem.location_lng,
          date: "Recently",
          priority:
            dbItem.priority || dbItem.severity?.toLowerCase() || "medium",
          status: dbItem.status || "Pending review",
          image_url: dbItem.image_url,
          report_count: dbItem.report_count || 1,
        }));

        const sortedData = formattedData.sort((a, b) => b.id - a.id);

        // This sets all existing database logs into the state!
        setMyComplaints(sortedData);
      } catch (error) {
        console.error("Dashboard connection error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRealLogs();
  }, []);

  // ADD NEWLY CREATED LOG TO THE EXISTING LIST
  const handleNewSubmission = (savedComplaint) => {
    const formattedNewReport = {
      id: savedComplaint.id,
      title: savedComplaint.title,
      description: savedComplaint.description,
      category: savedComplaint.category || "General",
      location: savedComplaint.address || "Location pending GPS",
      lat: savedComplaint.location_lat,
      lng: savedComplaint.location_lng,
      date: "Just now",
      priority: savedComplaint.severity || "medium",
      status: savedComplaint.status || "Pending review",
      image_url: savedComplaint.image_url || null,
      report_count: savedComplaint.report_count || 1,
    };

    setMyComplaints((prevComplaints) => [
      formattedNewReport,
      ...prevComplaints,
    ]);

    // Automatically switch to the logs view so the user can see their new submission
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // FILTER LOGS BASED ON ACTIVE TAB
  const filteredLogs = myComplaints.filter((log) => {
    const status = log.status.toLowerCase();
    if (logTab === "Active") {
      return status !== "resolved";
    }
    return status === "resolved";
  });

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-6 md:p-10 relative">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-emerald-900/10 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-6xl mx-auto space-y-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800 pb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-zinc-900 border border-zinc-700 rounded-xl text-emerald-500 shadow-inner">
                <UserCircle size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-zinc-100 uppercase tracking-widest">
                  CITIZEN/RESIDENT{" "}
                  <span className="text-emerald-500">TERMINAL</span>
                </h1>
                <p className="text-xs font-mono text-zinc-500 mt-1 uppercase tracking-widest">
                  WELCOME BACK //{" "}
                  {user?.full_name
                    ? user.full_name.toUpperCase()
                    : "AUTHORIZED_USER"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-zinc-900/50 px-4 py-2 rounded-lg border border-zinc-800 shadow-inner">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-mono text-emerald-500 uppercase tracking-widest">
                {myComplaints.length} Total Submissions
              </span>
            </div>
          </div>

          {/* DYNAMIC VIEW SWITCHER */}
          {currentView === "report" ? (
            /* VIEW 1: INITIATE NEW REPORT */
            <div className="space-y-4 animate-in fade-in duration-300 max-w-4xl">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={18} className="text-amber-500" />
                <h2 className="text-lg font-mono font-bold text-zinc-300 uppercase tracking-wider">
                  Initiate New Report
                </h2>
              </div>
              <ComplaintForm onSubmit={handleNewSubmission} />
            </div>
          ) : (
            /* VIEW 2: MY LOGS (Active & Archive) */
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* TABS NAVIGATION */}
              <div className="flex flex-col gap-4">
                <div className="flex gap-2 border-b border-zinc-800 pb-px">
                  <button
                    onClick={() => setLogTab("Active")}
                    className={`pb-3 px-4 text-sm font-mono uppercase tracking-widest transition-all flex items-center gap-2 border-b-2 ${
                      logTab === "Active"
                        ? "border-emerald-500 text-emerald-400"
                        : "border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
                    }`}
                  >
                    <Activity size={16} /> Active Logs
                  </button>
                  <button
                    onClick={() => setLogTab("Archive")}
                    className={`pb-3 px-4 text-sm font-mono uppercase tracking-widest transition-all flex items-center gap-2 border-b-2 ${
                      logTab === "Archive"
                        ? "border-emerald-500 text-emerald-400"
                        : "border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
                    }`}
                  >
                    <CheckCircle size={16} /> Resolution Archive
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {isLoading ? (
                  <div className="col-span-full flex items-center justify-center p-10 text-emerald-500">
                    <Loader2 className="animate-spin" size={32} />
                  </div>
                ) : (
                  <>
                    {/* Render filtered complaints */}
                    {filteredLogs.map((complaint) => (
                      <ComplaintCard key={complaint.id} complaint={complaint} />
                    ))}

                    {filteredLogs.length === 0 && (
                      <div className="col-span-full p-12 text-center border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
                        <History
                          size={32}
                          className="mx-auto text-zinc-600 mb-3"
                        />
                        <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">
                          NO {logTab.toUpperCase()} LOGS FOUND
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CitizenDashboard;
