import React, { useState } from 'react';
import { Shield, Key, Mail, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
  const { login, isLoading } = useAuth();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  // Updated default state to match the new inclusive tab name
  const [activeTab, setActiveTab] = useState('Citizen/Resident');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!credentials.email || !credentials.password) {
      setError('System requires both identification and passcode.');
      return;
    }

    const result = await login(credentials);

    if (!result.success) {
      setError(result.error || 'Authentication protocol failed.');
    } else {
      // If login is successful, switch the page to the dashboard!
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 relative overflow-hidden">

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-900/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-zinc-800/20 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-md z-10">
        <div className="vault-card p-8 bg-zinc-950/80 border border-zinc-800 shadow-2xl rounded-xl backdrop-blur-sm">

          <div className="flex flex-col items-center text-center mb-6">
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl mb-4 shadow-inner">
              <Shield size={40} className="text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-100 uppercase tracking-widest">
              SmartCity <span className="text-emerald-500">Connect</span>
            </h1>
            <p className="text-xs font-mono text-zinc-500 mt-2 uppercase tracking-widest">
              Secure Access Terminal
            </p>
          </div>
          
          {/* Role Tabs */}
          <div className="grid grid-cols-2 gap-2 mb-8">
            {['Citizen/Resident', 'Dept', 'Worker', 'Admin'].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setActiveTab(role)}
                className={`py-3 px-2 text-[10px] sm:text-xs font-mono uppercase tracking-widest rounded-md transition-all duration-200 border ${
                  activeTab === role
                    ? 'bg-zinc-800 text-emerald-400 shadow-sm border-zinc-700/50'
                    : 'bg-zinc-900/30 text-zinc-500 border-zinc-800/50 hover:text-zinc-300 hover:bg-zinc-800/50'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-950/30 border border-red-900/50 rounded-lg flex items-center gap-2">
              <span className="text-xs font-mono text-red-400 uppercase tracking-wider">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-2 uppercase tracking-wider">
                {activeTab === 'Dept' ? 'Department' : activeTab} Official Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={16} className="text-zinc-600" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={credentials.email}
                  onChange={handleChange}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-3 py-3 text-zinc-200 placeholder-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none"
                  placeholder="ID@smartcity.gov" 
                />
              </div>
            </div>

            <div>
              {/* FORGOT PASSWORD ADDITION IS HERE */}
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">
                  Passcode
                </label>
                <Link 
                  to="/forgot-password" 
                  className="text-[10px] font-mono text-zinc-500 hover:text-emerald-400 transition-colors uppercase tracking-widest"
                >
                  Forgot Passcode?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key size={16} className="text-zinc-600" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={credentials.password}
                  onChange={handleChange}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-3 py-3 text-zinc-200 placeholder-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none"
                  placeholder="••••••••" 
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-bold font-mono uppercase tracking-widest py-3.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-3 shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_25px_rgba(16,185,129,0.3)]"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  'Initialize Session'
                )}
              </button>
            </div>
          </form>

          {/* Dynamic Registration Link */}
          {activeTab === 'Citizen/Resident' && (
            <div className="mt-6 text-center">
              <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                New to the network?
              </p>
              <Link
                to="/register"
                className="text-xs font-mono text-emerald-500 hover:text-emerald-400 uppercase tracking-widest mt-1 inline-block border-b border-emerald-500/30 hover:border-emerald-400 pb-0.5 transition-all"
              >
                Initiate Citizen/Resident Registration
              </Link>
            </div>
          )}

        </div>

        <p className="text-center text-zinc-600 text-xs font-mono mt-6 uppercase tracking-widest">
          End-to-End Encrypted via FastAPI
        </p>
      </div>
    </div>
  );
}

export default Login;