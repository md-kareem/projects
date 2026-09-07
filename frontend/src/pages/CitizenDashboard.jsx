import React, { useState, useEffect } from 'react';
import { UserCircle, History, Zap, Loader2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import ComplaintForm from '../components/ComplaintForm';
import ComplaintCard from '../components/ComplaintCard';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext'; 

const CitizenDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Read the current view from the URL (defaults to 'report' so the map shows first)
  const queryParams = new URLSearchParams(location.search);
  const currentView = queryParams.get('view') || 'report';

  const [myComplaints, setMyComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // FETCH ALL EXISTING LOGS FROM DATABASE
  useEffect(() => {
    const fetchRealLogs = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8000/complaints/', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error("Failed to fetch database logs.");
        
        const dbData = await response.json();

        const formattedData = dbData.map(dbItem => ({
          id: dbItem.id,
          title: dbItem.title,
          description: dbItem.description,
          location: dbItem.address || "Location pending GPS", 
          date: "Recently", 
          priority: dbItem.severity?.toLowerCase() || "medium",
          status: dbItem.status || "Pending review",
          image_url: dbItem.image_url
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
      location: savedComplaint.address || "Location pending GPS",
      date: "Just now",
      priority: savedComplaint.severity || "medium",
      status: savedComplaint.status || "Pending review",
      image_url: savedComplaint.image_url || null
    };

    setMyComplaints((prevComplaints) => [formattedNewReport, ...prevComplaints]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-6 md:p-10 relative">
        
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-emerald-900/10 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-5xl mx-auto space-y-8 relative z-10">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800 pb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-zinc-900 border border-zinc-700 rounded-xl text-emerald-500 shadow-inner">
                <UserCircle size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-zinc-100 uppercase tracking-widest">
                  CITIZEN/RESIDENT <span className="text-emerald-500">Terminal</span>
                </h1>
                <p className="text-sm font-mono text-zinc-400 mt-1">
                  WELCOME BACK // {user?.name?.toUpperCase() || 'AUTHORIZED USER'}
                </p>
              </div>
            </div>
          </div>

          {/* DYNAMIC VIEW SWITCHER */}
          {currentView === 'report' || currentView === 'overview' ? (
            
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

            /* VIEW 2: MY ACTIVE LOGS (Shows existing DB data + newly submitted data) */
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <History size={18} className="text-emerald-500" />
                  <h2 className="text-lg font-mono font-bold text-zinc-300 uppercase tracking-wider">
                    My Active Logs
                  </h2>
                </div>
                <span className="text-xs font-mono bg-zinc-900 text-zinc-400 px-3 py-1.5 rounded-md border border-zinc-800">
                  {myComplaints.length} RECORDS
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                   <div className="col-span-full flex items-center justify-center p-10 text-emerald-500">
                     <Loader2 className="animate-spin" size={32} />
                   </div>
                ) : (
                  <>
                    {/* Render ALL complaints (Old and New) */}
                    {myComplaints.map(complaint => (
                      <ComplaintCard key={complaint.id} complaint={complaint} />
                    ))}
                    
                    {myComplaints.length === 0 && (
                      <div className="col-span-full p-12 text-center border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
                        <History size={32} className="mx-auto text-zinc-600 mb-3" />
                        <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">NO ACTIVE LOGS FOUND</p>
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