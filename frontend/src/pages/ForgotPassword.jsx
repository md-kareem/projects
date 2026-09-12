import React, { useState, useEffect } from 'react';
import { Shield, Mail, Loader2, ArrowLeft, KeyRound, CheckCircle2, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password, 3: Success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [uiState, setUiState] = useState('idle'); // 'idle', 'typing', 'loading', 'success', 'error'
  const [errorMsg, setErrorMsg] = useState('');

  // Handle typing effects for ambient lighting
  useEffect(() => {
    if (uiState === 'loading' || uiState === 'success') return;
    
    const isTyping = step === 1 ? email.length > 0 : (otp.length > 0 || newPassword.length > 0);
    
    if (isTyping && uiState !== 'error') {
      setUiState('typing');
    } else if (!isTyping && uiState !== 'error') {
      setUiState('idle');
    }
  }, [email, otp, newPassword, step, uiState]);

  // STEP 1: Request the OTP
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please provide a valid identification email.');
      setUiState('error');
      return;
    }

    setUiState('loading');
    setErrorMsg('');

    try {
      const response = await fetch('http://localhost:8000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!response.ok) throw new Error();
      
      await new Promise(resolve => setTimeout(resolve, 800));
      setUiState('idle');
      setStep(2); // Move to OTP input step
      
    } catch (err) {
      setErrorMsg('Failed to initiate recovery protocol. System may be offline.');
      setUiState('error');
    }
  };

  // STEP 2: Submit OTP and New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp || !newPassword) {
      setErrorMsg('Both Secure Code and New Passcode are required.');
      setUiState('error');
      return;
    }

    setUiState('loading');
    setErrorMsg('');

    try {
      const response = await fetch('http://localhost:8000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email,
          otp: otp,
          new_password: newPassword
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Invalid secure code.");
      }
      
      await new Promise(resolve => setTimeout(resolve, 800));
      setUiState('success');
      setStep(3); // Move to Success Screen
      
    } catch (err) {
      setErrorMsg(err.message);
      setUiState('error');
    }
  };

  // --- DYNAMIC AMBIENT LIGHTING ENGINE ---
  const getCardStyles = () => {
    switch (uiState) {
      case 'typing': return 'border-blue-500/50 shadow-[0_0_50px_rgba(59,130,246,0.15)] bg-blue-950/10';
      case 'loading': return 'border-amber-500/50 shadow-[0_0_50px_rgba(245,158,11,0.15)] bg-amber-950/10';
      case 'success': return 'border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.15)] bg-emerald-950/10';
      case 'error': return 'border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.15)] bg-red-950/10';
      default: return 'border-zinc-800/80 shadow-[0_0_30px_rgba(0,0,0,0.5)] bg-zinc-950/80';
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

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-700">
      
      {/* Dynamic Background Orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-[-10%] right-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full transition-colors duration-1000 ${getOrbColor()}`}></div>
        <div className={`absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full transition-colors duration-1000 ${getOrbColor()}`}></div>
      </div>

      <div className="w-full max-w-md z-10">
        <div className={`p-8 rounded-xl backdrop-blur-md transition-all duration-500 border ${getCardStyles()}`}>
          
          <div className="flex flex-col items-center text-center mb-8">
            <div className={`p-4 rounded-2xl mb-4 shadow-inner relative overflow-hidden transition-colors duration-500 ${uiState === 'success' ? 'bg-emerald-950/50 border-emerald-900/50' : 'bg-zinc-900 border border-zinc-800'}`}>
              {uiState === 'success' ? (
                <CheckCircle2 size={40} className="text-emerald-500 relative z-10 animate-in zoom-in" />
              ) : (
                <KeyRound size={40} className={`relative z-10 transition-colors duration-500 ${uiState === 'typing' ? 'text-blue-500' : 'text-emerald-500'}`} />
              )}
            </div>
            <h1 className="text-2xl font-bold text-zinc-100 uppercase tracking-widest">
              Passcode <span className={uiState === 'typing' ? 'text-blue-500 transition-colors' : 'text-emerald-500 transition-colors'}>Recovery</span>
            </h1>
            <p className="text-[10px] font-mono text-zinc-500 mt-2 uppercase tracking-widest">
              {step === 1 && "Secure Authentication Reset"}
              {step === 2 && "Identity Verification Required"}
              {step === 3 && "Protocol Completed"}
            </p>
          </div>

          {uiState === 'error' && (
            <div className="mb-6 p-4 bg-red-950/30 border-l-2 border-red-500 rounded-r-lg flex items-center gap-3 animate-in slide-in-from-top-2">
              <Shield size={16} className="text-red-500 shrink-0" />
              <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: REQUEST OTP */}
          {step === 1 && (
            <form onSubmit={handleRequestOTP} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <p className="text-[11px] text-zinc-400 mb-6 text-center font-mono uppercase tracking-wide leading-relaxed">
                Enter your registered identification email to receive a secure recovery code.
              </p>
              <div>
                <label className={`block text-[10px] font-mono mb-2 uppercase tracking-widest transition-colors ${uiState === 'typing' ? 'text-blue-400' : 'text-zinc-500'}`}>
                  Contact Email
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail size={16} className={`transition-colors ${uiState === 'typing' ? 'text-blue-500' : 'text-zinc-600 group-focus-within:text-emerald-500'}`} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (uiState === 'error') setUiState('typing');
                    }}
                    className={`w-full bg-zinc-950/50 border rounded-lg pl-12 pr-4 py-4 text-zinc-200 placeholder-zinc-700 outline-none transition-all font-sans shadow-inner ${
                      uiState === 'error' ? 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/20' : 
                      uiState === 'typing' ? 'border-blue-500/50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20' :
                      'border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20'
                    }`}
                    placeholder="ID@smartcity.gov"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={uiState === 'loading'}
                  className={`w-full font-bold font-mono text-xs uppercase tracking-widest py-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden group/btn ${
                    uiState === 'typing' 
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
                      : 'bg-emerald-600 hover:bg-emerald-500 text-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                  } disabled:opacity-70 disabled:cursor-wait`}
                >
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover/btn:animate-[shimmer_1.5s_infinite]"></div>
                  {uiState === 'loading' ? (
                    <><Loader2 size={16} className="animate-spin text-zinc-900" /> Transmitting...</>
                  ) : ('Send Recovery Protocol')}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: ENTER OTP & NEW PASSWORD */}
          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <p className="text-[11px] text-zinc-400 mb-6 text-center font-mono uppercase tracking-wide leading-relaxed">
                Protocol Dispatched. Check your terminal for the 6-digit secure code.
              </p>
              
              <div>
                <label className={`block text-[10px] font-mono mb-2 uppercase tracking-widest transition-colors ${uiState === 'typing' ? 'text-blue-400' : 'text-zinc-500'}`}>
                  6-Digit Secure Code
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Shield size={16} className={`transition-colors ${uiState === 'typing' ? 'text-blue-500' : 'text-zinc-600 group-focus-within:text-emerald-500'}`} />
                  </div>
                  <input
                    type="text"
                    maxLength="6"
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/[^0-9]/g, '')); // Only allow numbers
                      if (uiState === 'error') setUiState('typing');
                    }}
                    className={`w-full bg-zinc-950/50 border rounded-lg pl-12 pr-4 py-4 text-zinc-200 placeholder-zinc-700 outline-none transition-all font-mono tracking-[0.5em] text-center shadow-inner ${
                      uiState === 'error' ? 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/20' : 
                      uiState === 'typing' ? 'border-blue-500/50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20' :
                      'border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20'
                    }`}
                    placeholder="••••••"
                  />
                </div>
              </div>

              <div>
                <label className={`block text-[10px] font-mono mb-2 uppercase tracking-widest transition-colors ${uiState === 'typing' ? 'text-blue-400' : 'text-zinc-500'}`}>
                  New Passcode
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={16} className={`transition-colors ${uiState === 'typing' ? 'text-blue-500' : 'text-zinc-600 group-focus-within:text-emerald-500'}`} />
                  </div>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (uiState === 'error') setUiState('typing');
                    }}
                    className={`w-full bg-zinc-950/50 border rounded-lg pl-12 pr-4 py-4 text-zinc-200 placeholder-zinc-700 outline-none transition-all font-sans shadow-inner ${
                      uiState === 'error' ? 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/20' : 
                      uiState === 'typing' ? 'border-blue-500/50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20' :
                      'border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20'
                    }`}
                    placeholder="Enter new secure passcode"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={uiState === 'loading'}
                  className={`w-full font-bold font-mono text-xs uppercase tracking-widest py-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden group/btn ${
                    uiState === 'typing' 
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
                      : 'bg-emerald-600 hover:bg-emerald-500 text-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                  } disabled:opacity-70 disabled:cursor-wait`}
                >
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover/btn:animate-[shimmer_1.5s_infinite]"></div>
                  {uiState === 'loading' ? (
                    <><Loader2 size={16} className="animate-spin text-zinc-900" /> Verifying...</>
                  ) : ('Confirm Identity & Reset')}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 3 && (
            <div className="text-center space-y-4 py-2 animate-in fade-in zoom-in duration-500">
              <h2 className="text-lg font-bold text-emerald-400 uppercase tracking-wide">Passcode Updated</h2>
              <p className="text-sm font-mono text-zinc-400 leading-relaxed">
                Your secure passcode has been successfully reset. You may now return to the login terminal.
              </p>
              <div className="pt-6">
                <Link 
                  to="/login" 
                  className="inline-block w-full text-center px-6 py-4 bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-900 hover:border-emerald-500 hover:text-emerald-400 transition-all font-mono text-[11px] uppercase tracking-widest shadow-inner"
                >
                  Return to Login
                </Link>
              </div>
            </div>
          )}

        </div>
        
        {step !== 3 && (
          <div className="mt-8 flex justify-center">
            <Link 
              to="/login" 
              className="flex items-center gap-2 text-zinc-600 hover:text-emerald-400 transition-colors text-[10px] font-mono uppercase tracking-widest"
            >
              <ArrowLeft size={14} />
              Cancel Protocol
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;