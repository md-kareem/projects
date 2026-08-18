import React, { useState } from 'react';
import { UploadCloud, MapPin, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Leaflet Maps for GPS Selection
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const LocationPicker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });
  return position === null ? null : <Marker position={position}></Marker>;
};

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
      let finalImageUrl = null;

      // ==========================================
      // PHASE 8: CLOUDINARY UPLOAD PROTOCOL
      // ==========================================
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
        console.log("Cloud Upload Success! URL:", finalImageUrl);
      }

      // ==========================================
      // BACKEND TRANSMISSION PROTOCOL
      // ==========================================
      const token = localStorage.getItem('token');
      
      // We removed the local severity calculation because your Python backend 
      // is now handling it brilliantly with the Hugging Face AI!

      // THE FIX: Perfecting the payload to match your backend schema exactly
      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        location_lat: position.lat,
        location_lng: position.lng,
        address: `GPS: ${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`, // Gives the dashboard a location string
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
      
      // Pass the fully saved database object back to the parent component
      if (onSubmit) {
        onSubmit(savedComplaint);
      }

      // Reset form
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
    <div className="vault-card p-6 border-zinc-800/80 shadow-2xl relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500/20 via-amber-500/80 to-amber-500/20"></div>
      
      <div className="flex items-center gap-3 mb-6 border-b border-zinc-800 pb-4">
        <div className="p-2 bg-amber-950/30 border border-amber-900/50 rounded-lg">
          <AlertCircle className="text-amber-500" size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-zinc-100 uppercase tracking-widest">
            File a Report
          </h2>
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mt-1">
            ALL SUBMISSIONS ARE SECURELY LOGGED
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-950/30 border border-red-900/50 rounded-lg flex items-center gap-2">
          <span className="text-xs font-mono text-red-400 uppercase tracking-wider">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-xs font-mono text-zinc-400 uppercase tracking-widest">Issue Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 placeholder-zinc-700 focus:border-amber-500 outline-none transition-colors font-sans"
              placeholder="e.g., Broken Streetlight on 5th Ave"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-mono text-zinc-400 uppercase tracking-widest">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 focus:border-amber-500 outline-none transition-colors appearance-none font-sans"
            >
              <option value="" className="bg-zinc-900 text-zinc-500">Select Issue Category...</option>
              <option value="Infrastructure & Roads" className="bg-zinc-900">Infrastructure & Roads</option>
              <option value="Water & Sanitation" className="bg-zinc-900">Water & Sanitation</option>
              <option value="Electricity & Power" className="bg-zinc-900">Electricity & Power</option>
              <option value="Public Safety" className="bg-zinc-900">Public Safety</option>
              <option value="Environment & Parks" className="bg-zinc-900">Environment & Parks</option>
              <option value="Other" className="bg-zinc-900">Other / Unclassified</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-mono text-zinc-400 uppercase tracking-widest">Detailed Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="4"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 placeholder-zinc-700 focus:border-amber-500 outline-none transition-colors resize-none font-sans"
            placeholder="Provide specific details about the issue..."
          ></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-xs font-mono text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              Incident Location <span className="text-amber-500">*Click Map*</span>
            </label>
            <div className="h-[200px] rounded-lg border border-zinc-800 overflow-hidden relative z-0">
              <MapContainer 
                center={[12.9716, 77.5946]} 
                zoom={12} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; CARTO'
                />
                <LocationPicker position={position} setPosition={setPosition} />
              </MapContainer>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-zinc-400 uppercase tracking-widest">Attach Evidence (Optional)</label>
            <div 
              className="h-[200px] border-2 border-dashed border-zinc-700 rounded-lg bg-zinc-950 hover:bg-zinc-900/50 hover:border-amber-500/50 transition-all flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleImageDrop}
              onClick={() => document.getElementById('file-upload').click()}
            >
              {imagePreview ? (
                <div className="absolute inset-0">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover opacity-60" />
                  <div className="absolute inset-0 bg-zinc-950/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-zinc-900/80 text-zinc-200 px-4 py-2 rounded border border-zinc-700 font-mono text-xs uppercase">Click to Change</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <UploadCloud className="text-amber-500" size={24} />
                  </div>
                  <p className="text-sm text-zinc-300 font-bold mb-1">Click or drag image to upload</p>
                  <p className="text-xs font-mono text-zinc-500">JPEG, PNG, WEBP (Max 5MB)</p>
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

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-zinc-100 hover:bg-white text-zinc-950 font-bold font-mono text-sm uppercase tracking-widest py-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 mt-4 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="animate-spin text-zinc-500" />
              <span className="text-zinc-500">Transmitting to Cloud...</span>
            </>
          ) : (
            'Submit Official Report'
          )}
        </button>
      </form>
    </div>
  );
};

export default ComplaintForm;