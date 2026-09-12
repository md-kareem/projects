import React, { useState } from 'react';
import { Shield, User, Mail, Key, Phone, MapPin, Globe, AlertCircle, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const { register } = useAuth(); 
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneCode: '+91',
    phoneNumber: '',
    country: 'India',
    state: '',
    city: '',
    area: '',
    houseNo: ''
  });
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Password Visibility States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Determines if the regional fields should be unlocked
  const isIndia = formData.country.trim().toLowerCase() === 'india';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Frontend Validation
    if (!formData.fullName || !formData.email || !formData.password) {
      setError('System Alert: All identification fields are required.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('System Alert: Security passcodes do not match.');
      return;
    }

    if (formData.password.length < 8) {
      setError('System Alert: Passcode must be at least 8 characters long.');
      return;
    }

    // 2. Real API Call to FastAPI
    setIsLoading(true);
    try {
      const result = await register({
        full_name: formData.fullName, 
        email: formData.email,
        password: formData.password,
        role: "Citizen",
        // We send these to the backend. (Make sure your Pydantic schema accepts them!)
        phone: `${formData.phoneCode}${formData.phoneNumber}`,
        country: formData.country,
        state: isIndia ? formData.state : null,
        city: isIndia ? formData.city : null,
        area: isIndia ? formData.area : null,
        house_no: isIndia ? formData.houseNo : null
      });

      if (!result.success) {
        setError(result.error);
      } else {
        setIsSuccess(true);
        // Automatically redirect to login page after 3 seconds
        setTimeout(() => navigate('/login'), 3000);
      }

    } catch (err) {
      setError('Registration protocol failed. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 relative overflow-hidden py-12">
      
      {/* Background Aesthetic Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-900/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-zinc-800/20 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-2xl z-10">
        <div className="vault-card p-8 border-zinc-800/80 shadow-2xl bg-zinc-950/80 backdrop-blur-sm rounded-xl">
          
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl mb-4 shadow-inner">
              <Shield size={40} className="text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-100 uppercase tracking-widest">
              Citizen/Resident <span className="text-emerald-500">Registry</span>
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
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Identity Module */}
                <div className="space-y-4 p-4 border border-zinc-800/50 rounded-lg bg-zinc-900/20">
                  <h2 className="text-xs font-mono text-emerald-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <User size={14} /> Identity Profile
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-mono text-zinc-500 mb-1 uppercase tracking-wider">Full Legal Name</label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-zinc-200 placeholder-zinc-700 focus:border-emerald-500 outline-none transition-all text-sm"
                        placeholder="Jane Doe" 
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-mono text-zinc-500 mb-1 uppercase tracking-wider">Contact Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-zinc-200 placeholder-zinc-700 focus:border-emerald-500 outline-none transition-all text-sm"
                        placeholder="ID@domain.com" 
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 mb-1 uppercase tracking-wider">Secure Passcode</label>
                      <div className="relative group">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-3 pr-10 py-2.5 text-zinc-200 placeholder-zinc-700 focus:border-emerald-500 outline-none transition-all text-sm"
                          placeholder="••••••••" 
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-600 hover:text-emerald-400 transition-colors"
                          aria-label="Toggle password visibility"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 mb-1 uppercase tracking-wider">Confirm Passcode</label>
                      <div className="relative group">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-3 pr-10 py-2.5 text-zinc-200 placeholder-zinc-700 focus:border-emerald-500 outline-none transition-all text-sm"
                          placeholder="••••••••" 
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-600 hover:text-emerald-400 transition-colors"
                          aria-label="Toggle confirm password visibility"
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Module */}
                <div className="space-y-4 p-4 border border-zinc-800/50 rounded-lg bg-zinc-900/20">
                  <h2 className="text-xs font-mono text-emerald-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Phone size={14} /> Contact Node
                  </h2>
                  
                  <div>
                    <label className="block text-[10px] font-mono text-zinc-500 mb-1 uppercase tracking-wider">Phone Number</label>
                    <div className="flex gap-2">
                      <select
                        name="phoneCode"
                        value={formData.phoneCode}
                        onChange={handleChange}
                        className="w-24 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-2.5 text-zinc-200 focus:border-emerald-500 outline-none text-sm appearance-none text-center font-mono cursor-pointer"
                      >
                        <option value="+91">+91 (IN)</option>
                        <option value="+1">+1 (US)</option>
                        <option value="+44">+44 (UK)</option>
                        <option value="+84">+84 (VN)</option>
                        <option value="+971">+971 (AE)</option>
                      </select>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-zinc-200 placeholder-zinc-700 focus:border-emerald-500 outline-none transition-all text-sm font-mono"
                        placeholder="9876543210" 
                      />
                    </div>
                  </div>
                </div>

                {/* Location Module */}
                <div className="space-y-4 p-4 border border-zinc-800/50 rounded-lg bg-zinc-900/20">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xs font-mono text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                      <MapPin size={14} /> Geographic Location
                    </h2>
                    {!isIndia && (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-amber-500 uppercase tracking-widest bg-amber-950/30 px-2 py-1 rounded border border-amber-900/50">
                        <AlertCircle size={10} /> Local Routing Disabled
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-mono text-zinc-500 mb-1 uppercase tracking-wider items-center gap-1">
                        <Globe size={12} /> Country
                      </label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-zinc-200 placeholder-zinc-700 focus:border-emerald-500 outline-none transition-all text-sm font-bold"
                        placeholder="Enter Country" 
                      />
                    </div>

                    <div className={!isIndia ? "opacity-40 pointer-events-none grayscale transition-all" : "transition-all"}>
                      <label className="block text-[10px] font-mono text-zinc-500 mb-1 uppercase tracking-wider">State</label>
                      <input
                        type="text"
                        name="state"
                        disabled={!isIndia}
                        value={formData.state}
                        onChange={handleChange}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-zinc-200 placeholder-zinc-700 focus:border-emerald-500 outline-none transition-all text-sm disabled:bg-zinc-900"
                        placeholder="Karnataka" 
                      />
                    </div>

                    <div className={!isIndia ? "opacity-40 pointer-events-none grayscale transition-all" : "transition-all"}>
                      <label className="block text-[10px] font-mono text-zinc-500 mb-1 uppercase tracking-wider">City</label>
                      <input
                        type="text"
                        name="city"
                        disabled={!isIndia}
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-zinc-200 placeholder-zinc-700 focus:border-emerald-500 outline-none transition-all text-sm disabled:bg-zinc-900"
                        placeholder="Bengaluru" 
                      />
                    </div>

                    <div className={!isIndia ? "opacity-40 pointer-events-none grayscale transition-all" : "transition-all"}>
                      <label className="block text-[10px] font-mono text-zinc-500 mb-1 uppercase tracking-wider">Area / Locality</label>
                      <input
                        type="text"
                        name="area"
                        disabled={!isIndia}
                        value={formData.area}
                        onChange={handleChange}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-zinc-200 placeholder-zinc-700 focus:border-emerald-500 outline-none transition-all text-sm disabled:bg-zinc-900"
                        placeholder="Koramangala" 
                      />
                    </div>

                    <div className={!isIndia ? "opacity-40 pointer-events-none grayscale transition-all" : "transition-all"}>
                      <label className="block text-[10px] font-mono text-zinc-500 mb-1 uppercase tracking-wider">House / Apt No.</label>
                      <input
                        type="text"
                        name="houseNo"
                        disabled={!isIndia}
                        value={formData.houseNo}
                        onChange={handleChange}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-zinc-200 placeholder-zinc-700 focus:border-emerald-500 outline-none transition-all text-sm disabled:bg-zinc-900"
                        placeholder="Apt 4B" 
                      />
                    </div>
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