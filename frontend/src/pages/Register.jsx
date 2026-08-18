import React, { useState } from 'react';
import { Shield, User, Mail, Key, Loader2, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const { register } = useAuth(); // Pulling in our new secure register function!
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Frontend Validation
    if (!formData.name || !formData.email || !formData.password) {
      setError('All identification fields are required.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Security passcodes do not match.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Passcode must be at least 8 characters long.');
      return;
    }

    // 2. Real API Call to FastAPI
    setIsLoading(true);
    try {
      // We map the data exactly to how your UserCreate Pydantic schema expects it!
      const result = await register({
        full_name: formData.name, 
        email: formData.email,
        password: formData.password,
        role: "Citizen" // Defaulting to Citizen for public registration
      });

      if (!result.success) {
        setError(result.error);
      } else {
        setIsSuccess(true);
        // Automatically redirect to login page after 3 seconds so they don't get stuck
        setTimeout(() => navigate('/login'), 3000);
      }

    } catch (err) {
      setError('Registration protocol failed. Please check your connection.');
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
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl mb-4 shadow-inner">
              <Shield size={40} className="text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-100 uppercase tracking-widest">
              Citizen <span className="text-emerald-500">Registry</span>
            </h1>
            <p className="text-xs font-mono text-zinc-500 mt-2 uppercase tracking-widest">
              Establish System Access
            </p>
          </div>

          {/* Success State */}
          {isSuccess ? (
            <div className="text-center space-y-4 py-8 animate-in fade-in zoom-in duration-300">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-950/50 border border-emerald-900/50 mb-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <Shield size={32} className="text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-zinc-100 uppercase tracking-wide">Identity Verified</h2>
              <p className="text-sm font-mono text-zinc-400">Your credentials have been securely logged.</p>
              <Link 
                to="/login" 
                className="inline-block mt-4 px-6 py-2 bg-zinc-900 border border-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-800 hover:text-emerald-400 transition-colors font-mono text-sm uppercase tracking-wider"
              >
                Proceed to Login
              </Link>
            </div>
          ) : (
            <>
              {/* Error Message Display */}
              {error && (
                <div className="mb-6 p-3 bg-red-950/30 border border-red-900/50 rounded-lg flex items-center gap-2">
                  <span className="text-xs font-mono text-red-400 uppercase tracking-wider">{error}</span>
                </div>
              )}

              {/* Registration Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-2 uppercase tracking-wider">
                    Full Legal Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User size={16} className="text-zinc-600" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-3 py-3 text-zinc-200 placeholder-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none"
                      placeholder="Jane Doe"
                    />
                  </div>
                </div>

                {/* Email */}
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
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-3 py-3 text-zinc-200 placeholder-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none"
                      placeholder="citizen@smartcity.gov"
                    />
                  </div>
                </div>

                {/* Password Fields in a Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-zinc-400 mb-2 uppercase tracking-wider">
                      Passcode
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Key size={16} className="text-zinc-600" />
                      </div>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-3 py-3 text-zinc-200 placeholder-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-zinc-400 mb-2 uppercase tracking-wider">
                      Confirm Passcode
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Key size={16} className="text-zinc-600" />
                      </div>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-3 py-3 text-zinc-200 placeholder-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-bold font-mono uppercase tracking-widest py-3.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-3 shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_25px_rgba(16,185,129,0.3)]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Encrypting...
                      </>
                    ) : (
                      'Register Identity'
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

export default Register;