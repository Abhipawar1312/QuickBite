"use client";

import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { motion } from "framer-motion";
import { Navigation, Loader2, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";

// Dynamically import Leaflet to avoid SSR issues
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons (Leaflet webpack issue)
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// ─── Vehicle Icon SVGs ────────────────────────────────────────────────────────
const VEHICLE_SVGS: Record<string, string> = {
  bicycle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
    <circle cx="24" cy="24" r="22" fill="#10b981" stroke="white" stroke-width="3"/>
    <text x="24" y="30" text-anchor="middle" font-size="20" fill="white">🚲</text>
  </svg>`,
  bike: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
    <circle cx="24" cy="24" r="22" fill="#f97316" stroke="white" stroke-width="3"/>
    <text x="24" y="30" text-anchor="middle" font-size="20" fill="white">🛵</text>
  </svg>`,
  scooter: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
    <circle cx="24" cy="24" r="22" fill="#f97316" stroke="white" stroke-width="3"/>
    <text x="24" y="30" text-anchor="middle" font-size="20" fill="white">🛵</text>
  </svg>`,
  motorcycle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
    <circle cx="24" cy="24" r="22" fill="#8b5cf6" stroke="white" stroke-width="3"/>
    <text x="24" y="30" text-anchor="middle" font-size="20" fill="white">🏍️</text>
  </svg>`,
  car: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
    <circle cx="24" cy="24" r="22" fill="#3b82f6" stroke="white" stroke-width="3"/>
    <text x="24" y="30" text-anchor="middle" font-size="20" fill="white">🚗</text>
  </svg>`,
  default: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
    <circle cx="24" cy="24" r="22" fill="#10b981" stroke="white" stroke-width="3"/>
    <text x="24" y="30" text-anchor="middle" font-size="20" fill="white">🛵</text>
  </svg>`,
};

const makeVehicleIcon = (vehicleName?: string) => {
  const key = vehicleName?.toLowerCase() || "default";
  const svgKey = Object.keys(VEHICLE_SVGS).find(k => key.includes(k)) ?? "default";
  const svg = VEHICLE_SVGS[svgKey];
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
};

const makeRestaurantIcon = () =>
  L.divIcon({
    html: `<div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#f97316,#ea580c);border:3px solid white;box-shadow:0 4px 15px rgba(249,115,22,0.6);display:flex;align-items:center;justify-content:center;font-size:20px;">🍽️</div>`,
    className: "",
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });

const makeCustomerIcon = () =>
  L.divIcon({
    html: `<div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#1d4ed8);border:3px solid white;box-shadow:0 4px 15px rgba(59,130,246,0.6);display:flex;align-items:center;justify-content:center;font-size:20px;">📍</div>`,
    className: "",
    iconSize: [44, 44],
    iconAnchor: [22, 44],
  });

// ─── Map auto-fit bounds helper ───────────────────────────────────────────────
const FitBounds: React.FC<{ positions: [number, number][] }> = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 1) {
      map.setView(positions[0], 14);
    } else if (positions.length >= 2) {
      const bounds = L.latLngBounds(positions.map(([lat, lng]) => L.latLng(lat, lng)));
      map.fitBounds(bounds, { padding: [70, 70], maxZoom: 15 });
    }
  }, [positions.map(p => p.join(",")).join("|")]);
  return null;
};

// ─── Custom Zoom Controls ─────────────────────────────────────────────────────
const ZoomControls: React.FC<{ fitPositions: [number, number][] }> = ({ fitPositions }) => {
  const map = useMap();
  const btnStyle: React.CSSProperties = {
    width: "36px", height: "36px", borderRadius: "10px", background: "white",
    border: "2px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", fontSize: "18px", fontWeight: "bold", color: "#f97316",
  };
  const handleFit = () => {
    if (fitPositions.length === 1) map.setView(fitPositions[0], 14);
    else if (fitPositions.length >= 2) {
      const bounds = L.latLngBounds(fitPositions.map(([lat, lng]) => L.latLng(lat, lng)));
      map.fitBounds(bounds, { padding: [70, 70], maxZoom: 15 });
    }
  };
  return (
    <div style={{ position: "absolute", bottom: "80px", right: "12px", zIndex: 1000, display: "flex", flexDirection: "column", gap: "6px" }}>
      <button onClick={() => map.zoomIn()} style={btnStyle} title="Zoom In">+</button>
      <button onClick={() => map.zoomOut()} style={{ ...btnStyle, fontSize: "22px" }} title="Zoom Out">−</button>
      <button onClick={handleFit} style={{ ...btnStyle, fontSize: "14px", color: "#334155" }} title="Fit All Markers">🎯</button>
    </div>
  );
};

// ─── Smooth moving marker helper ─────────────────────────────────────────────
const SmoothMarker: React.FC<{
  position: [number, number];
  icon: L.DivIcon;
  popup?: string;
}> = ({ position, icon, popup }) => {
  const markerRef = useRef<L.Marker>(null);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng(position);
    }
  }, [position[0], position[1]]);

  return (
    <Marker ref={markerRef} position={position} icon={icon}>
      {popup && <Popup>{popup}</Popup>}
    </Marker>
  );
};

// ─── Distance Calculator ──────────────────────────────────────────────────────
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return Number(distance.toFixed(1));
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface LiveTrackingMapProps {
  orderId: string;
  restaurantCoords?: [number, number]; // [lng, lat]
  customerCoords?: [number, number];   // [lng, lat]
  restaurantName?: string;
  customerName?: string;
  orderStatus?: string;
  hasRider?: boolean;
  riderVehicle?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  orderId,
  restaurantCoords = [72.978088, 19.21833],
  customerCoords,
  restaurantName = "Restaurant",
  customerName = "You",
  orderStatus = "preparing",
  hasRider = false,
  riderVehicle,
}) => {
  const [riderPos, setRiderPos] = useState<[number, number] | null>(null);
  const [waitingRider, setWaitingRider] = useState(true);

  // Convert [lng, lat] → [lat, lng] for Leaflet
  const restLatLng: [number, number] = [restaurantCoords[1], restaurantCoords[0]];
  // Safely parse — values from order.deliveryDetails may come back as strings from the backend
  const custLatLng: [number, number] | null = customerCoords
    ? [Number(customerCoords[1]), Number(customerCoords[0])]
    : null;

  // Socket: listen for real-time rider position
  useEffect(() => {
    if (!orderId) return;
    const socket = io("http://localhost:8000");
    socket.emit("join_order", orderId);

    socket.on("rider_location_updated", (data: { lat: number; lng: number }) => {
      setRiderPos([data.lat, data.lng]);
      setWaitingRider(false);
    });

    return () => { socket.disconnect(); };
  }, [orderId]);

  // Dynamic ETA & Distance Logic
  const getEtaAndDistance = () => {
    if (orderStatus === "delivered") {
      return { eta: "Delivered", dist: "" };
    }
    if (orderStatus === "Cancelled") {
      return { eta: "Cancelled", dist: "" };
    }

    // Out for delivery (rider has order, traveling to customer)
    if (orderStatus === "outfordelivery" && riderPos && custLatLng) {
      const distance = calculateDistance(riderPos[0], riderPos[1], custLatLng[0], custLatLng[1]);
      // Estimate 3 minutes per kilometer + 2 mins buffer
      const minutes = Math.max(2, Math.ceil(distance * 3) + 2);
      return {
        eta: `Arriving in ~${minutes} mins`,
        dist: `${distance} KM away`
      };
    }

    // Ready for riders / accepted (rider traveling to restaurant, or waiting for pickup)
    if ((orderStatus === "ready_for_riders" || orderStatus === "preparing" || orderStatus === "confirmed") && riderPos) {
      const distanceToRest = calculateDistance(riderPos[0], riderPos[1], restLatLng[0], restLatLng[1]);
      const pickupMins = Math.max(2, Math.ceil(distanceToRest * 3) + 2);
      
      let deliveryDistance = 2.5; // fallback
      if (custLatLng) {
        deliveryDistance = calculateDistance(restLatLng[0], restLatLng[1], custLatLng[0], custLatLng[1]);
      }
      const deliveryMins = Math.ceil(deliveryDistance * 3) + 2;
      const totalMins = pickupMins + deliveryMins + (orderStatus === "preparing" ? 15 : 5);

      return {
        eta: `Estimated delivery: ~${totalMins} mins`,
        dist: `Rider is ${distanceToRest} KM from restaurant`
      };
    }

    // Default static fallback when no rider is sharing location yet
    let fallbackDistance = 2.5;
    if (custLatLng) {
      fallbackDistance = calculateDistance(restLatLng[0], restLatLng[1], custLatLng[0], custLatLng[1]);
    }
    const prepBuffer = orderStatus === "preparing" ? 25 : 15;
    const totalFallbackMins = Math.ceil(fallbackDistance * 3) + prepBuffer;

    return {
      eta: `Estimated delivery: ~${totalFallbackMins} mins`,
      dist: `Prep + Delivery (${fallbackDistance} KM)`
    };
  };

  const { eta: etaText, dist: distanceText } = getEtaAndDistance();

  const vehicleIcon = makeVehicleIcon(riderVehicle);
  const restaurantIcon = makeRestaurantIcon();
  const customerIcon = makeCustomerIcon();

  // Map center: midpoint between restaurant and customer (best overview), else rider or restaurant
  const mapCenter: [number, number] = custLatLng
    ? [(restLatLng[0] + custLatLng[0]) / 2, (restLatLng[1] + custLatLng[1]) / 2]
    : riderPos ?? restLatLng;

  // Live route: restaurant → rider → customer
  const routePoints: [number, number][] = [
    restLatLng,
    ...(riderPos ? [riderPos] : []),
    ...(custLatLng ? [custLatLng] : []),
  ];

  // Bounds for auto-fit
  const fitPositions: [number, number][] = [
    restLatLng,
    ...(riderPos ? [riderPos] : []),
    ...(custLatLng ? [custLatLng] : []),
  ];

  const getStatusBadge = () => {
    if (orderStatus === "delivered") return { label: "Delivered ✓", cls: "bg-green-500 text-white" };
    if (orderStatus === "outfordelivery") return { label: "🚀 Out for Delivery", cls: "bg-orange-500 text-white animate-pulse" };
    if (orderStatus === "ready_for_riders") return { label: hasRider ? "Rider Accepted" : "🕐 Finding Rider", cls: "bg-purple-500 text-white" };
    return { label: "Preparing", cls: "bg-blue-500 text-white" };
  };

  const statusBadge = getStatusBadge();

  const getVehicleLabel = () => {
    if (!riderVehicle) return "";
    const v = riderVehicle.toLowerCase();
    if (v.includes("bicycle")) return "🚲 Bicycle";
    if (v.includes("motorcycle") || v.includes("bike")) return "🏍️ Motorcycle";
    if (v.includes("scooter")) return "🛵 Scooter";
    if (v.includes("car")) return "🚗 Car";
    return `🛵 ${riderVehicle}`;
  };

  return (
    <Card className="border-0 shadow-2xl bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-700">
      {/* Header */}
      <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 p-5 flex flex-row justify-between items-center">
        <div>
          <CardTitle className="text-lg font-extrabold text-white flex items-center gap-2">
            <Navigation className="w-5 h-5 text-orange-400 animate-pulse" />
            Live Delivery Tracking
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs mt-1">
            Real-time map powered by OpenStreetMap
          </CardDescription>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge className={`text-xs px-3 py-1 rounded-full font-bold ${statusBadge.cls}`}>
            {statusBadge.label}
          </Badge>
          {riderVehicle && (
            <span className="text-[10px] text-slate-300 font-semibold">{getVehicleLabel()}</span>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0 relative">
        {/* Map Legend */}
        <div className="flex flex-wrap items-center gap-4 px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1.5"><span className="text-base">🍽️</span><span className="font-semibold">{restaurantName || "Restaurant"}</span></span>
          {custLatLng && <span className="flex items-center gap-1.5"><span className="text-base">📍</span><span className="font-semibold">{customerName}</span></span>}
          {riderPos && <span className="flex items-center gap-1.5"><span className="text-base">🛵</span><span className="font-semibold">Rider (Live)</span></span>}
        </div>

        {/* Real Leaflet Map */}
        <div className="relative w-full h-[400px]">
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: "100%", width: "100%", borderRadius: "0 0 24px 24px" }}
            zoomControl={false}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Auto-fit bounds when positions change */}
            <FitBounds positions={fitPositions} />

            {/* Custom Zoom Controls */}
            <ZoomControls fitPositions={fitPositions} />

            {/* Restaurant marker */}
            <Marker position={restLatLng} icon={restaurantIcon}>
              <Popup>
                <div style={{ fontWeight: "bold", fontSize: "13px" }}>{restaurantName} 🍽️</div>
                <div style={{ fontSize: "11px", color: "#888" }}>Restaurant location</div>
              </Popup>
            </Marker>

            {/* Customer marker — always shown when coords are available */}
            {custLatLng && (
              <Marker position={custLatLng} icon={customerIcon}>
                <Popup>
                  <div style={{ fontWeight: "bold", fontSize: "13px" }}>{customerName} 📍</div>
                  <div style={{ fontSize: "11px", color: "#888" }}>Your delivery address</div>
                </Popup>
              </Marker>
            )}

            {/* Static dashed path: restaurant → customer (always visible) */}
            {custLatLng && (
              <Polyline
                positions={[restLatLng, custLatLng]}
                pathOptions={{ color: "#94a3b8", weight: 3, opacity: 0.55, dashArray: "6 6" }}
              />
            )}

            {/* Live rider route overlay */}
            {riderPos && routePoints.length >= 2 && (
              <Polyline
                positions={routePoints}
                pathOptions={{ color: "#f97316", weight: 4.5, opacity: 0.9, dashArray: "9 7" }}
              />
            )}

            {/* Moving vehicle marker */}
            {riderPos && (
              <SmoothMarker
                position={riderPos}
                icon={vehicleIcon}
                popup={`Rider is here ${getVehicleLabel()}`}
              />
            )}
          </MapContainer>

          {/* Floating ETA overlay */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 left-4 right-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl border border-white/20 dark:border-slate-800 z-[1000] flex justify-between items-center gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-950/40 rounded-xl flex items-center justify-center text-xl shrink-0">
                ⏰
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Estimated Delivery</p>
                <h4 className="text-sm font-extrabold text-slate-800 dark:text-white">
                  {etaText}
                </h4>
              </div>
            </div>
            {distanceText && (
              <div className="text-right shrink-0">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Details</p>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{distanceText}</p>
              </div>
            )}
          </motion.div>

          {/* Waiting overlay */}
          {waitingRider && hasRider && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute bottom-4 left-4 right-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 flex items-center gap-3 z-[1000]"
            >
              <Loader2 className="w-4 h-4 animate-spin text-orange-500 shrink-0" />
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                Waiting for rider to share live location…
              </p>
            </motion.div>
          )}

          {!hasRider && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute bottom-4 left-4 right-14 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 flex items-center gap-3 z-[1000]"
            >
              <Package className="w-4 h-4 text-blue-500 shrink-0" />
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                {orderStatus === "preparing"
                  ? "Your food is being prepared 🍳"
                  : "Waiting for a rider to accept your order…"}
              </p>
            </motion.div>
          )}
        </div>

        {/* Live Status Footer */}
        {riderPos && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-t border-green-100 dark:border-green-900/50 flex justify-between items-center"
          >
            <div>
              <p className="text-[10px] text-green-600 dark:text-green-400 font-bold uppercase tracking-wider">Live Tracking</p>
              <p className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-ping inline-block" />
                Rider is on the move!
              </p>
            </div>
            {riderVehicle && (
              <div className="text-right">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Vehicle</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{getVehicleLabel()}</p>
              </div>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};
