import React, { useState } from 'react';
import { Shield, Mail, Loader2, ArrowLeft, KeyRound } from 'lucide-react';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please provide a valid identification email.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // TODO: Replace this simulation with the actual FastAPI route later
      // e.g., await fetch('http://localhost:8000/api/auth/forgot-password', { ... })
      
      console.log(`Initiating password reset protocol for: ${email}`);
      
      // Simulating a network request delay (1.5 seconds)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Success! Show the confirmation screen
      setIsSuccess(true);
      
    } catch (err) {
      setError('Failed to initiate recovery protocol. System may be offline.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Aesthetic Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-900/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-zinc-800/20 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-md z-10">
        <div className="vault-card p-8 border-zinc-800/80 shadow-2xl bg-zinc-950/80 backdrop-blur-sm rounded-xl">
          
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl mb-4 shadow-inner relative overflow-hidden">
              <KeyRound size={40} className="text-emerald-500 relative z-10" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-100 uppercase tracking-widest">
              Passcode <span className="text-emerald-500">Recovery</span>
            </h1>
            <p className="text-xs font-mono text-zinc-500 mt-2 uppercase tracking-widest">
              Secure Authentication Reset
            </p>
          </div>

          {isSuccess ? (
            /* Success State */
            <div className="text-center space-y-4 py-6 animate-in fade-in zoom-in duration-300">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-950/50 border border-emerald-900/50 mb-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <Shield size={32} className="text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-zinc-100 uppercase tracking-wide">Protocol Dispatched</h2>
              <p className="text-sm font-mono text-zinc-400">
                If the email <span className="text-emerald-400 font-semibold">{email}</span> exists in our secure registry, you will receive reset instructions shortly.
              </p>
              <div className="pt-4">
                <Link 
                  to="/login" 
                  className="inline-block w-full text-center px-6 py-3 bg-zinc-900 border border-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-800 hover:text-emerald-400 transition-colors font-mono text-sm uppercase tracking-wider"
                >
                  Return to Login
                </Link>
              </div>
            </div>
          ) : (
            /* Form State */
            <>
              {error && (
                <div className="mb-6 p-3 bg-red-950/30 border border-red-900/50 rounded-lg flex items-center gap-2">
                  <span className="text-xs font-mono text-red-400 uppercase tracking-wider">{error}</span>
                </div>
              )}

              <p className="text-sm text-zinc-400 mb-6 text-center font-mono">
                Enter your registered identification email. We will transmit an encrypted recovery link to your inbox.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-2 uppercase tracking-wider">
                    Contact Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail size={16} className="text-zinc-600" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError('');
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-3 py-3 text-zinc-200 placeholder-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none"
                      placeholder="ID@smartcity.gov"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-bold font-mono uppercase tracking-widest py-3.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-3 shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_25px_rgba(16,185,129,0.3)]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Transmitting...
                      </>
                    ) : (
                      'Send Recovery Protocol'
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
        
        {/* Navigation back to Login */}
        {!isSuccess && (
          <div className="mt-6 flex justify-center">
            <Link 
              to="/login" 
              className="flex items-center gap-2 text-zinc-500 hover:text-emerald-400 transition-colors text-xs font-mono uppercase tracking-widest"
            >
              <ArrowLeft size={14} />
              Return to Login Terminal
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;