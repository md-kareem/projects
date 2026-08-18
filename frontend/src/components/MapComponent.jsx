import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Fix for standard Leaflet marker icons disappearing in React
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// A custom red icon for the Complaint/Incident
const alertIcon = L.icon({
  ...defaultIcon,
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
});

const MapComponent = ({ 
  workerLocation = { lat: 40.7128, lng: -74.0060 }, // Default: NYC
  complaintLocation = { lat: 40.7200, lng: -74.0100 }
}) => {
  const [routeCoords, setRouteCoords] = useState([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(true);

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const apiKey = import.meta.env.VITE_ORS_API_KEY;
        if (!apiKey) {
          console.error("Missing VITE_ORS_API_KEY in .env file");
          return;
        }

        // ⚠️ IMPORTANT: Leaflet uses [Lat, Lng], but ORS requires [Lng, Lat] in the URL!
        const start = `${workerLocation.lng},${workerLocation.lat}`;
        const end = `${complaintLocation.lng},${complaintLocation.lat}`;
        
        // Ping OpenRouteService for the driving directions
        const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${start}&end=${end}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch route from ORS");
        
        const data = await response.json();
        
        // The API returns coordinates as [Lng, Lat]. We must flip them to [Lat, Lng] for Leaflet to draw the line!
        if (data.features && data.features.length > 0) {
          const coordinates = data.features[0].geometry.coordinates;
          const flippedCoords = coordinates.map(coord => [coord[1], coord[0]]);
          setRouteCoords(flippedCoords);
        }
      } catch (error) {
        console.error("Error drawing route:", error);
      } finally {
        setIsLoadingRoute(false);
      }
    };

    fetchRoute();
  }, [workerLocation, complaintLocation]);

  return (
    <div className="w-full h-full min-h-[300px] rounded-lg overflow-hidden border border-zinc-800 relative z-0">
      <MapContainer 
        center={[workerLocation.lat, workerLocation.lng]} 
        zoom={13} 
        style={{ height: '100%', width: '100%', background: '#09090b' }}
      >
        {/* The Free OpenStreetMap Tiles! */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Worker Marker */}
        <Marker position={[workerLocation.lat, workerLocation.lng]} icon={defaultIcon}>
          <Popup>Unit 42-ALPHA (You)</Popup>
        </Marker>

        {/* Complaint Marker */}
        <Marker position={[complaintLocation.lat, complaintLocation.lng]} icon={alertIcon}>
          <Popup>Active Incident Location</Popup>
        </Marker>

        {/* The Glowing Blue Route Line */}
        {routeCoords.length > 0 && (
          <Polyline 
            positions={routeCoords} 
            color="#3b82f6" /* Blue */
            weight={5} 
            opacity={0.8} 
          />
        )}
      </MapContainer>
      
      {isLoadingRoute && (
        <div className="absolute top-2 right-2 bg-zinc-900/90 text-amber-500 px-3 py-1 text-xs font-mono rounded border border-zinc-700 z-[1000]">
          CALCULATING ROUTE...
        </div>
      )}
    </div>
  );
};

export default MapComponent;