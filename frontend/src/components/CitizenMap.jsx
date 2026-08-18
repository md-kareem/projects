import React, { useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Navigation, Crosshair, MapPin } from 'lucide-react';
import L from 'leaflet';

// Standard red pin for the citizen's issue
const alertIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// A helper component to handle clicking on the map to move the pin
const MapClickHandler = ({ setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });
  return null;
};

const CitizenMap = ({ onLocationSelect }) => {
  const [isLocating, setIsLocating] = useState(false);
  // Defaulting to Bengaluru (can be anywhere!)
  const [position, setPosition] = useState({ lat: 12.9716, lng: 77.5946 }); 
  const [hasLocation, setHasLocation] = useState(false);
  const mapRef = useRef(null);

  // Use the browser's REAL GPS!
  const handleGetRealLocation = () => {
    setIsLocating(true);
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (loc) => {
          const newPos = { lat: loc.coords.latitude, lng: loc.coords.longitude };
          setPosition(newPos);
          setHasLocation(true);
          setIsLocating(false);
          
          // Move the map camera to the new location
          if (mapRef.current) {
            mapRef.current.flyTo(newPos, 16);
          }

          // Send the real coordinates back to the Citizen form to be saved!
          if (onLocationSelect) {
            onLocationSelect(`${newPos.lat.toFixed(4)}, ${newPos.lng.toFixed(4)}`);
          }
        },
        (error) => {
          console.error("GPS Error:", error);
          alert("Could not get your location. Please click on the map to place the pin.");
          setIsLocating(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      alert("GPS is not supported by your browser.");
      setIsLocating(false);
    }
  };

  // When the user drags the pin manually
  const handleMarkerDragEnd = (e) => {
    const marker = e.target;
    const newPos = marker.getLatLng();
    setPosition(newPos);
    setHasLocation(true);
    
    if (onLocationSelect) {
      onLocationSelect(`${newPos.lat.toFixed(4)}, ${newPos.lng.toFixed(4)}`);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-mono text-zinc-400 uppercase tracking-wider">
          Incident Location
        </label>
        {hasLocation && (
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/30 px-2 py-1 rounded border border-emerald-900/50 flex items-center gap-1">
            <MapPin size={12} />
            GPS SECURED
          </span>
        )}
      </div>

      <div className="relative w-full h-64 bg-zinc-900 border-2 border-zinc-800 rounded-xl overflow-hidden z-0">
        
        <MapContainer 
          center={position} 
          zoom={12} 
          ref={mapRef}
          style={{ height: '100%', width: '100%', background: '#09090b' }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapClickHandler setPosition={(pos) => {
             setPosition(pos);
             setHasLocation(true);
             if (onLocationSelect) onLocationSelect(`${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`);
          }} />

          <Marker 
            position={position} 
            icon={alertIcon}
            draggable={true}
            eventHandlers={{
              dragend: handleMarkerDragEnd,
            }}
          >
            <Popup>Drag me to the exact issue location!</Popup>
          </Marker>
        </MapContainer>

        {/* The Real GPS Button */}
        <button
          type="button"
          onClick={handleGetRealLocation}
          disabled={isLocating}
          className="absolute bottom-3 right-3 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 p-2.5 rounded-lg border border-zinc-700 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all duration-200 flex items-center justify-center z-[1000] disabled:opacity-50"
          title="Use my real GPS location"
        >
          {isLocating ? (
            <Crosshair size={18} className="animate-spin text-emerald-500" />
          ) : (
            <Navigation size={18} className="text-emerald-400 hover:text-emerald-300" />
          )}
        </button>
      </div>
      
      <p className="text-xs text-zinc-500 mt-2 font-mono">
        Click the GPS button or drag the pin to set the exact location.
      </p>
    </div>
  );
};

export default CitizenMap;