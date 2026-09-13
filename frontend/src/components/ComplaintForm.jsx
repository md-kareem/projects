import React, { useState } from 'react';
import { UploadCloud, MapPin, AlertCircle, Loader2, Sparkles, Bot } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import MapComponent from './MapComponent'; 

const ComplaintForm = ({ onSubmit }) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
  });

  const [position, setPosition] = useState(null);
  const [imageFile, setImageFile] = useState(null); 
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files[0] || e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file); 
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAutoDetect = () => {
    setIsAnalyzing(true);
    
    setTimeout(() => {
      // Combine title and description, convert to lowercase for matching
      const text = `${formData.title} ${formData.description}`.toLowerCase();

      // Expanded & Weighted Keyword Dictionary
      const keywordMap = {
        "Electrical & Lighting": [
          "streetlight", "street light", "flickering", "dark", "light", 
          "bulb", "power", "electricity", "wire", "pole", "outage"
        ],
        "Water & Sanitation": [
          "water", "leak", "pipe", "drain", "sewage", "garbage", 
          "trash", "flood", "overflow", "smell"
        ],
        "Roads & Infrastructure": [
          "pothole", "pavement", "bridge", "crack", "asphalt", 
          "road", "sidewalk" // Note: Generic words placed last
        ],
        "Public Safety": [
          "hazard", "danger", "police", "crime", "suspicious", "accident"
        ]
      };

      let bestCategory = "General";
      let highestMatchCount = 0;

      // Scan the text against all categories and count the matches
      for (const [category, keywords] of Object.entries(keywordMap)) {
        let matchCount = 0;
        
        keywords.forEach(keyword => {
          if (text.includes(keyword)) {
            // Give extra weight to highly specific keywords
            if (["streetlight", "flickering", "pothole", "leak"].includes(keyword)) {
              matchCount += 3; 
            } else {
              matchCount += 1;
            }
          }
        });

        // The category with the most keyword hits wins
        if (matchCount > highestMatchCount) {
          highestMatchCount = matchCount;
          bestCategory = category;
        }
      }

      setFormData(prev => ({ ...prev, category: bestCategory }));
      setIsAnalyzing(false);
    }, 800); // Simulated AI processing delay
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.title || !formData.category || !formData.description) {
      setError('System Alert: Title, Category, and Description are mandatory fields.');
      return;
    }

    if (!position) {
      setError('System Alert: Incident GPS coordinates are mandatory. Please click on the map.');
      return;
    }

    setIsSubmitting(true);

    try {
      // FIX: Removed the rogue AI override check. 
      // The system now strictly uses the category selected by the user/Auto-Detect.
      const finalCategory = formData.category;

      let finalImageUrl = null;

      if (imageFile) {
        console.log("Initiating Cloudinary upload sequence...");
        const cloudData = new FormData();
        cloudData.append("file", imageFile);
        cloudData.append("upload_preset", "smartcity_connectAI");
        cloudData.append("cloud_name", "njtyl4tg");

        const cloudResponse = await fetch("https://api.cloudinary.com/v1_1/njtyl4tg/image/upload", {
          method: "POST",
          body: cloudData
        });

        if (!cloudResponse.ok) throw new Error("Cloud storage upload failed.");
        const cloudResult = await cloudResponse.json();
        finalImageUrl = cloudResult.secure_url;
      }

      const token = localStorage.getItem('token');
      const payload = {
        title: formData.title,
        description: formData.description,
        category: finalCategory, 
        location_lat: position.lat,
        location_lng: position.lng,
        address: `GPS: ${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`, 
        image_url: finalImageUrl 
      };

      const response = await fetch('http://localhost:8000/complaints/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to submit to central database.");
      }

      const savedComplaint = await response.json();
      
      if (onSubmit) {
        onSubmit(savedComplaint);
      }

      setFormData({ title: '', category: '', description: '' });
      setPosition(null);
      setImageFile(null);
      setImagePreview(null);
      
    } catch (err) {
      console.error("Submission Error:", err);
      setError(err.message || 'Transmission failed. Ensure Secure Access Token is valid.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="vault-card p-6 md:p-8 border border-zinc-800/80 shadow-[0_0_40px_rgba(0,0,0,0.5)] rounded-xl relative bg-zinc-950/80 backdrop-blur-xl animate-in slide-in-from-bottom-8 fade-in duration-500 group">
      
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
      
      <div className="flex items-center gap-4 mb-8 border-b border-zinc-800/80 pb-5">
        <div className="p-2.5 bg-amber-950/40 border border-amber-900/50 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.1)]">
          <AlertCircle className="text-amber-500" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 uppercase tracking-widest text-shadow-sm">
            File a Report
          </h2>
          <p className="text-xs font-mono text-amber-500/80 uppercase tracking-widest mt-1">
            SECURE ENCRYPTED LOGGING INITIATED
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-950/30 border-l-4 border-red-500 rounded-r-lg flex items-center gap-3 animate-in slide-in-from-top-2 fade-in">
          <AlertCircle className="text-red-500 shrink-0" size={18} />
          <span className="text-xs font-mono text-red-400 uppercase tracking-wider leading-relaxed">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-7">
        
        <div className="space-y-2 group/input">
          <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest flex items-center gap-2 transition-colors group-focus-within/input:text-amber-500">
            Detailed Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="3"
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-zinc-200 placeholder-zinc-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:bg-zinc-900 outline-none transition-all resize-none font-sans shadow-inner"
            placeholder="Describe the issue in detail. (e.g., There is a massive pothole in the right lane causing traffic slowdowns...)"
          ></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 group/input">
            <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest transition-colors group-focus-within/input:text-amber-500">Issue Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-3.5 text-zinc-200 placeholder-zinc-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:bg-zinc-900 outline-none transition-all font-sans shadow-inner"
              placeholder="e.g., Broken Streetlight on 5th Ave"
            />
          </div>
          
          <div className="space-y-2 group/input relative">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest transition-colors group-focus-within/input:text-amber-500">Category</label>
              
              <button 
                type="button"
                onClick={handleAutoDetect}
                disabled={isAnalyzing}
                className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-900/50 hover:bg-emerald-900/60 hover:text-emerald-300 transition-all disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Sparkles size={12} className="text-emerald-400" />
                )}
                {isAnalyzing ? 'Analyzing...' : 'Auto-Detect'}
              </button>
            </div>
            
            <div className="relative">
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-3.5 text-zinc-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:bg-zinc-900 outline-none transition-all appearance-none font-sans shadow-inner cursor-pointer"
              >
                <option value="" className="bg-zinc-900 text-zinc-500">Select Issue Category...</option>
                <option value="Roads & Infrastructure" className="bg-zinc-900">Roads & Infrastructure</option>
                <option value="Water & Sanitation" className="bg-zinc-900">Water & Sanitation</option>
                <option value="Electrical & Lighting" className="bg-zinc-900">Electrical & Lighting</option>
                <option value="Vandalism & Safety" className="bg-zinc-900">Vandalism & Safety</option>
                <option value="Environment & Parks" className="bg-zinc-900">Environment & Parks</option>
                <option value="Other / Unclassified" className="bg-zinc-900">Other / Unclassified</option>
              </select>
              
              {formData.category && !isAnalyzing && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none animate-in zoom-in">
                  <Bot size={16} className="text-emerald-500 opacity-50" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest flex items-center justify-between">
              <span>Incident Location</span>
              <span className="text-amber-500 bg-amber-950/30 px-2 py-0.5 rounded border border-amber-900/50 flex items-center gap-1"><MapPin size={10}/> Click Map to Pin</span>
            </label>
            
            <div className="h-[280px] rounded-lg overflow-hidden border border-zinc-800 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all shadow-inner">
              <MapComponent 
                isPicker={true} 
                complaintLocation={position || { lat: 12.9716, lng: 77.5946 }} 
                onLocationSelect={setPosition} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">Attach Evidence (Optional)</label>
            <div 
              className="h-[280px] border-2 border-dashed border-zinc-700/80 rounded-lg bg-zinc-900/30 hover:bg-zinc-900/80 hover:border-amber-500/50 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group shadow-inner"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleImageDrop}
              onClick={() => document.getElementById('file-upload').click()}
            >
              {imagePreview ? (
                <div className="absolute inset-0">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover opacity-70 group-hover:opacity-40 transition-opacity duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-zinc-950/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <span className="bg-zinc-950/90 text-amber-400 px-5 py-2.5 rounded-lg border border-amber-900/50 font-mono text-xs uppercase tracking-widest shadow-xl backdrop-blur-sm transform translate-y-2 group-hover:translate-y-0 transition-transform">
                      Click to Replace
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-14 h-14 bg-zinc-950 border border-zinc-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-amber-500/30 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] transition-all duration-500">
                    <UploadCloud className="text-amber-500" size={26} />
                  </div>
                  <p className="text-sm text-zinc-300 font-bold mb-1 tracking-wide">Secure Upload</p>
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Click or drag image here</p>
                </>
              )}
              <input 
                id="file-upload" 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleImageDrop}
              />
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full relative overflow-hidden bg-zinc-100 hover:bg-white text-zinc-950 font-bold font-mono text-sm uppercase tracking-widest py-5 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed group/btn"
          >
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-zinc-400/30 to-transparent group-hover/btn:animate-[shimmer_1.5s_infinite]"></div>
            
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin text-zinc-600" />
                <span className="text-zinc-600">Transmitting to Command...</span>
              </>
            ) : (
              'Submit Official Report'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ComplaintForm;