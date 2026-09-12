import React, { useState, useEffect } from 'react';
import { Shield, Key, Mail, Loader2, Lock, ArrowLeft, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
  const { login, isLoading } = useAuth();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Citizen/Resident');
  const navigate = useNavigate();

  // 2FA & UI States
  const [showOTP, setShowOTP] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Ambient Lighting & Animation States
  const [uiState, setUiState] = useState('idle'); // 'idle', 'typing', 'loading', 'success', 'error'
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Dynamic typing effects
  useEffect(() => {
    if (isVerifying || isLoading || uiState === 'success' || uiState === 'loading') return;
    
    const isTyping = showOTP 
      ? otpCode.length > 0 
      : (credentials.email.length > 0 || credentials.password.length > 0);
    
    if (isTyping && uiState !== 'error') {
      setUiState('typing');
    } else if (!isTyping && uiState !== 'error') {
      setUiState('idle');
    }
  }, [credentials, otpCode, showOTP, uiState, isVerifying, isLoading]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
    if (uiState === 'error') {
      setError('');
      setUiState('typing');
    }
  };

  // ----------------------------------------------------
  // NAVIGATION INTERCEPTOR: Triggers the Spark Animation
  // ----------------------------------------------------
  const triggerWarpTransition = (token) => {
    setUiState('success');
    
    // 1. Save token silently
    if (token) localStorage.setItem('token', token);
    
    // 2. Trigger the massive full-screen animation overlay
    setIsTransitioning(true);
    
    // 3. Wait exactly 2 seconds for the animation to expand, then route!
    setTimeout(() => {
      // BUG FIX: We must use window.location.href here instead of navigate()
      // This forces a hard page reload so your AuthContext properly 
      // reads the new token we just saved from the OTP verification!
      window.location.href = '/dashboard';
    }, 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!credentials.email || !credentials.password) {
      setError('System requires both identification and passcode.');
      setUiState('error');
      return;
    }

    setUiState('loading');
    const result = await login(credentials);

    if (result.require_2fa) {
      setShowOTP(true);
      setError('');
      setUiState('idle'); 
    } else if (!result.success) {
      setError(result.error || 'Authentication protocol failed.');
      setUiState('error');
    } else {
      // Immediate Access (Admins/Workers)
      triggerWarpTransition(null);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setError('Passcode must be exactly 6 digits.');
      setUiState('error');
      return;
    }

    setIsVerifying(true);
    setUiState('loading');
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: credentials.email, otp_code: otpCode })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || 'Invalid or expired verification code.');
        setUiState('error');
        setIsVerifying(false);
        return;
      }

      // 2FA Success (Citizens)
      triggerWarpTransition(data.access_token);

    } catch (err) {
      setError('Network error during verification protocol.');
      setUiState('error');
      setIsVerifying(false);
    }
  };

  // --- DYNAMIC AMBIENT LIGHTING ENGINE ---
  const getCardStyles = () => {
    switch (uiState) {
      case 'typing': return 'border-blue-500/50 shadow-[0_0_50px_rgba(59,130,246,0.15)] bg-blue-950/10';
      case 'loading': return 'border-amber-500/50 shadow-[0_0_50px_rgba(245,158,11,0.15)] bg-amber-950/10';
      case 'success': return 'border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.15)] bg-emerald-950/10';
      case 'error': return 'border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.15)] bg-red-950/10';
      default: return 'border-zinc-800 shadow-[0_0_30px_rgba(0,0,0,0.5)] bg-zinc-950/80';
    }
  };

  const getOrbColor = () => {
    switch (uiState) {
      case 'typing': return 'bg-blue-600/20';
      case 'loading': return 'bg-amber-600/20 animate-pulse';
      case 'success': return 'bg-emerald-600/20';
      case 'error': return 'bg-red-600/20';
      default: return 'bg-emerald-900/10';
    }
  };

  const getInputClass = () => {
    if (uiState === 'error') return 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/20 text-zinc-200';
    if (uiState === 'typing') return 'border-blue-500/50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-zinc-200';
    return 'border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 text-zinc-200';
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-700">

      {/* FULL SCREEN WARP TRANSITION (The Spark Animation) */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-zinc-950 transition-opacity duration-500 ${isTransitioning ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className={`relative flex items-center justify-center transition-all duration-[1500ms] ease-in-out ${isTransitioning ? 'scale-[150] opacity-0 delay-500' : 'scale-100 opacity-100'}`}>
          <svg className="w-16 h-16 animate-[spin_4s_linear_infinite]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C12 6.62742 17.3726 12 24 12C17.3726 12 12 17.3726 12 24C12 17.3726 6.62742 12 0 12C6.62742 12 12 6.62742 12 0Z" fill="url(#ai-spark)"/>
            <defs>
              <linearGradient id="ai-spark" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#ef4444" /> {/* Red */}
                <stop offset="33%" stopColor="#3b82f6" /> {/* Blue */}
                <stop offset="66%" stopColor="#10b981" /> {/* Green */}
                <stop offset="100%" stopColor="#eab308" /> {/* Yellow */}
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Dynamic Background Orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full transition-colors duration-1000 ${getOrbColor()}`}></div>
        <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full transition-colors duration-1000 ${getOrbColor()}`}></div>
      </div>

      <div className={`w-full max-w-md z-10 transition-all duration-700 ${isTransitioning ? 'opacity-0 scale-90 blur-sm' : 'opacity-100 scale-100'}`}>
        <div className={`p-8 rounded-xl backdrop-blur-md transition-all duration-500 border ${getCardStyles()}`}>

          <div className="flex flex-col items-center text-center mb-6">
            <div className={`p-4 rounded-2xl mb-4 shadow-inner relative overflow-hidden transition-colors duration-500 ${uiState === 'success' ? 'bg-emerald-950/50 border-emerald-900/50' : 'bg-zinc-900 border border-zinc-800'}`}>
              {uiState === 'success' ? (
                <CheckCircle2 size={40} className="text-emerald-500 relative z-10 animate-in zoom-in" />
              ) : (
                <Shield size={40} className={`relative z-10 transition-colors duration-500 ${uiState === 'typing' ? 'text-blue-500' : 'text-emerald-500'}`} />
              )}
            </div>
            <h1 className="text-2xl font-bold text-zinc-100 uppercase tracking-widest">
              SmartCity <span className={uiState === 'typing' ? 'text-blue-500 transition-colors' : 'text-emerald-500 transition-colors'}>Connect</span>
            </h1>
            <p className="text-xs font-mono text-zinc-500 mt-2 uppercase tracking-widest">
              Secure Access Terminal
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-950/30 border-l-2 border-red-500 rounded-r-lg flex items-center gap-2 animate-in slide-in-from-top-2">
              <span className="text-xs font-mono text-red-400 uppercase tracking-wider">{error}</span>
            </div>
          )}

          {showOTP ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center mb-6">
                <h2 className="text-emerald-400 font-mono text-sm uppercase tracking-widest mb-2">
                  Identity Verification
                </h2>
                <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest leading-relaxed">
                  A 6-digit secure code has been routed to<br/>
                  <span className="text-zinc-300">{credentials.email}</span>
                </p>
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-5">
                <div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock size={16} className={`transition-colors ${uiState === 'typing' ? 'text-blue-500' : 'text-zinc-600'}`} />
                    </div>
                    <input
                      type="text"
                      maxLength="6"
                      value={otpCode}
                      onChange={(e) => {
                        setOtpCode(e.target.value.replace(/\D/g, ''));
                        if (uiState === 'error') {
                          setError('');
                          setUiState('typing');
                        }
                      }}
                      className={`w-full bg-zinc-950/50 rounded-lg pl-12 pr-4 py-4 text-center text-2xl tracking-[0.5em] focus:outline-none transition-all font-mono shadow-inner border ${getInputClass()}`}
                      placeholder="000000"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isVerifying || otpCode.length !== 6 || uiState === 'success'}
                    className={`w-full font-bold font-mono text-xs uppercase tracking-widest py-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden group/btn ${
                      uiState === 'typing' 
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
                        : 'bg-emerald-600 hover:bg-emerald-500 text-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                    } disabled:opacity-70 disabled:cursor-wait`}
                  >
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover/btn:animate-[shimmer_1.5s_infinite]"></div>
                    {isVerifying || uiState === 'success' ? (
                      <><Loader2 size={16} className="animate-spin text-zinc-900" /> Verifying...</>
                    ) : ('Confirm Identity')}
                  </button>
                </div>
              </form>

              {!isVerifying && uiState !== 'success' && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => {
                      setShowOTP(false);
                      setOtpCode('');
                      setError('');
                      setUiState('idle');
                    }}
                    className="flex items-center justify-center gap-2 w-full text-zinc-600 hover:text-emerald-400 transition-colors text-[10px] font-mono uppercase tracking-widest"
                  >
                    <ArrowLeft size={14} /> Cancel Protocol
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className={uiState === 'success' ? 'opacity-0 pointer-events-none transition-opacity duration-300' : 'animate-in fade-in slide-in-from-left-4 duration-500'}>
              <div className="grid grid-cols-2 gap-2 mb-8">
                {['Citizen/Resident', 'Dept', 'Worker', 'Admin'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setActiveTab(role)}
                    className={`py-3 px-2 text-[10px] sm:text-[10px] font-mono uppercase tracking-widest rounded-md transition-all duration-200 border ${
                      activeTab === role
                        ? 'bg-zinc-800 text-emerald-400 shadow-sm border-zinc-700/50'
                        : 'bg-zinc-900/30 text-zinc-500 border-zinc-800/50 hover:text-zinc-300 hover:bg-zinc-800/50'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className={`block text-[10px] font-mono mb-2 uppercase tracking-widest transition-colors ${uiState === 'typing' ? 'text-blue-400' : 'text-zinc-500'}`}>
                    {activeTab === 'Dept' ? 'Department' : activeTab} Official Email
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail size={16} className={`transition-colors ${uiState === 'typing' ? 'text-blue-500' : 'text-zinc-600'}`} />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={credentials.email}
                      onChange={handleChange}
                      className={`w-full bg-zinc-950/50 rounded-lg pl-12 pr-4 py-3.5 outline-none transition-all font-sans shadow-inner border ${getInputClass()}`}
                      placeholder="ID@smartcity.gov" 
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className={`block text-[10px] font-mono uppercase tracking-widest transition-colors ${uiState === 'typing' ? 'text-blue-400' : 'text-zinc-500'}`}>
                      Passcode
                    </label>
                    <Link 
                      to="/forgot-password" 
                      className="text-[10px] font-mono text-zinc-600 hover:text-emerald-400 transition-colors uppercase tracking-widest"
                    >
                      Forgot Passcode?
                    </Link>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Key size={16} className={`transition-colors ${uiState === 'typing' ? 'text-blue-500' : 'text-zinc-600'}`} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={credentials.password}
                      onChange={handleChange}
                      className={`w-full bg-zinc-950/50 rounded-lg pl-12 pr-12 py-3.5 outline-none transition-all font-sans shadow-inner border ${getInputClass()}`}
                      placeholder="••••••••" 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-600 hover:text-emerald-400 transition-colors"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isLoading || uiState === 'success'}
                    className={`w-full font-bold font-mono text-xs uppercase tracking-widest py-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden group/btn ${
                      uiState === 'typing' 
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
                        : 'bg-emerald-600 hover:bg-emerald-500 text-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                    } disabled:opacity-70 disabled:cursor-wait`}
                  >
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover/btn:animate-[shimmer_1.5s_infinite]"></div>
                    {isLoading || uiState === 'loading' ? (
                      <><Loader2 size={16} className="animate-spin text-zinc-900" /> Authenticating...</>
                    ) : ('Initialize Session')}
                  </button>
                </div>
              </form>

              {activeTab === 'Citizen/Resident' && (
                <div className="mt-8 text-center">
                  <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                    New to the network?
                  </p>
                  <Link
                    to="/register"
                    className="text-[10px] font-mono text-emerald-500 hover:text-emerald-400 uppercase tracking-widest mt-2 inline-block border-b border-emerald-500/30 hover:border-emerald-400 pb-0.5 transition-all"
                  >
                    Initiate Citizen/Resident Registration
                  </Link>
                </div>
              )}
            </div>
          )}

        </div>

        <p className="text-center text-zinc-700 text-[10px] font-mono mt-6 uppercase tracking-widest">
          End-to-End Encrypted via FastAPI
        </p>
      </div>
    </div>
  );
}

export default Login;