import React, { useState, useCallback, useEffect } from "react";
import { MapPin, Locate, Search, X, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { toast } from "sonner";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix Leaflet default marker icon path issue with webpack/vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom orange pin icon
const customPinIcon = L.divIcon({
  className: "",
  html: `<div style="width:34px;height:46px;display:flex;flex-direction:column;align-items:center;">
    <div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#f97316,#ea580c);border:3px solid white;box-shadow:0 4px 12px rgba(249,115,22,0.55);display:flex;align-items:center;justify-content:center;">
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
    </div>
    <div style="width:3px;height:12px;background:#f97316;border-radius:2px;"></div>
  </div>`,
  iconSize: [34, 46],
  iconAnchor: [17, 46],
});

// ─── Inner: handles map click events to move pin ───────────────────────────
const ClickHandler: React.FC<{
  onMapClick: (lat: number, lng: number) => void;
}> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// ─── Inner: programmatically fly the map to a position ─────────────────────
const FlyToLocation: React.FC<{ target: [number, number] | null }> = ({ target }) => {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo(target, Math.max(map.getZoom(), 15), { animate: true, duration: 0.8 });
    }
  }, [target?.[0], target?.[1]]);
  return null;
};

// ─── Props ─────────────────────────────────────────────────────────────────
interface MapAddressPickerProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: {
    address: string;
    city: string;
    pincode: string;
    country: string;
    latitude: number;
    longitude: number;
  }) => void;
  initialLat?: number;
  initialLng?: number;
}

// ─── Main Component ────────────────────────────────────────────────────────
export const MapAddressPicker: React.FC<MapAddressPickerProps> = ({
  open,
  onClose,
  onConfirm,
  initialLat,
  initialLng,
}) => {
  const defaultLat = initialLat || 19.076;
  const defaultLng = initialLng || 72.8777;

  const [markerPos, setMarkerPos] = useState<[number, number]>([defaultLat, defaultLng]);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState({
    address: "",
    city: "",
    pincode: "",
    country: "",
    latitude: defaultLat,
    longitude: defaultLng,
  });

  // Reverse geocode lat/lng → address string
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await res.json();
      if (data) {
        const addr = data.address || {};
        setResolvedAddress({
          address: data.display_name || "",
          city: addr.city || addr.town || addr.village || addr.suburb || addr.county || "",
          country: addr.country || "",
          pincode: addr.postcode || "",
          latitude: lat,
          longitude: lng,
        });
      }
    } catch {
      // silently ignore geocoding errors
    }
  }, []);

  // On first open, geocode the initial/default position
  useEffect(() => {
    if (open) {
      reverseGeocode(defaultLat, defaultLng);
    }
  }, [open]);

  // Place pin at a position and geocode
  const placePin = useCallback(
    (lat: number, lng: number) => {
      setMarkerPos([lat, lng]);
      reverseGeocode(lat, lng);
    },
    [reverseGeocode]
  );

  // "Locate Me" — get user's GPS position
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setIsLocating(false);
        placePin(latitude, longitude);
        setFlyTarget([latitude, longitude]);
      },
      () => {
        setIsLocating(false);
        toast.error("Location permission denied. Please enable GPS permissions.");
      },
      { enableHighAccuracy: true }
    );
  };

  // Search by text query
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const results = await res.json();
      setIsSearching(false);
      if (results && results.length > 0) {
        const lat = parseFloat(results[0].lat);
        const lng = parseFloat(results[0].lon);
        placePin(lat, lng);
        setFlyTarget([lat, lng]);
      } else {
        toast.error("No locations found for your search query.");
      }
    } catch {
      setIsSearching(false);
      toast.error("Search failed. Please try again.");
    }
  };

  const handleConfirm = () => {
    if (!resolvedAddress.address) {
      toast.error("Please select a location on the map first.");
      return;
    }
    onConfirm(resolvedAddress);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[85vh] border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-orange-500 to-orange-600 text-white shrink-0">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            <h3 className="font-bold text-lg">Pin Your Exact Delivery Location</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row gap-3 bg-slate-50 dark:bg-slate-900/40 shrink-0">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search for your street, building, or area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rounded-xl border-2 dark:bg-slate-700"
              />
            </div>
            <Button
              type="submit"
              disabled={isSearching}
              className="bg-orange-500 hover:bg-orange-600 rounded-xl"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
            </Button>
          </form>

          <Button
            type="button"
            variant="outline"
            onClick={handleLocateMe}
            disabled={isLocating}
            className="rounded-xl border-2 flex items-center justify-center gap-2 dark:border-slate-600"
          >
            {isLocating ? (
              <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
            ) : (
              <Locate className="w-4 h-4 text-orange-500" />
            )}
            Locate Me
          </Button>
        </div>

        {/* ── React-Leaflet Map ── */}
        {/* flex-1 + min-h-0 so the map fills the remaining space */}
        <div className="flex-1" style={{ minHeight: 0 }}>
          <MapContainer
            center={markerPos}
            zoom={15}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
            touchZoom={true}
            dragging={true}
            doubleClickZoom={true}
            zoomControl={true}
            attributionControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Draggable delivery pin */}
            <Marker
              position={markerPos}
              draggable={true}
              icon={customPinIcon}
              eventHandlers={{
                dragend(e) {
                  const pos = (e.target as L.Marker).getLatLng();
                  placePin(pos.lat, pos.lng);
                },
              }}
            />

            {/* Click anywhere on map to move pin */}
            <ClickHandler onMapClick={placePin} />

            {/* Fly to location after search / locate me */}
            <FlyToLocation target={flyTarget} />
          </MapContainer>
        </div>

        {/* Address Preview + Action Buttons */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-700 space-y-4 bg-slate-50 dark:bg-slate-900/40 shrink-0">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Pin Location Address
            </h4>
            {resolvedAddress.address ? (
              <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold leading-relaxed line-clamp-2">
                {resolvedAddress.address}
              </p>
            ) : (
              <p className="text-sm text-slate-400 italic">
                Select a point on the map above to resolve the address…
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-xl py-3 border-2 border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Confirm Delivery Location
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};
