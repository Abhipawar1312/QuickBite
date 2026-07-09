import React, { useEffect, useState, useRef } from "react";
import { useUserStore } from "@/store/useUserStore";
import { useRiderStore, RiderProfile } from "@/store/useRiderStore";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";
import { LiveTrackingMap } from "./LiveTrackingMap";
import { ChatPanel } from "./ChatPanel";
import {
  Bike,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  Power,
  Shield,
  Loader2,
  Bell,
  AlertTriangle,
  FileText,
  User,
  MessageCircle,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { toast } from "sonner";
import { Orders } from "@/types/orderType";

export const RiderDashboard: React.FC = () => {
  const { user } = useUserStore();
  const {
    loading,
    riderProfile,
    incomingOrders,
    activeOrder,
    submitRiderDetails,
    getRiderProfile,
    toggleOnlineStatus,
    acceptOrder,
    updateDeliveryWorkflow,
    addIncomingOrder,
    removeIncomingOrder,
    riderEarnings,
    riderDeliveries,
    getRiderEarnings,
  } = useRiderStore();

  // Registration input state
  const [vehicleName, setVehicleName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [contact, setContact] = useState("");
  const [earningsLogsOpen, setEarningsLogsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // Countdown timer state for the latest incoming order
  const [currentOffer, setCurrentOffer] = useState<Orders | null>(null);
  const [countdown, setCountdown] = useState(10);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load profile details on start
  useEffect(() => {
    getRiderProfile();
  }, [getRiderProfile]);

  useEffect(() => {
    if (riderProfile?.isVerified) {
      getRiderEarnings();
    }
  }, [riderProfile?.isVerified, getRiderEarnings]);

  // Real-time: listen for admin verification so screen switches automatically
  useEffect(() => {
    if (!user) return;

    const socket = io("http://localhost:8000", {
      query: { userId: user._id, role: "rider" },
    });

    socket.on("rider_verified", (data: { message: string; rider: any }) => {
      // Re-fetch profile from backend so Zustand store updates and the view flips automatically
      getRiderProfile();
      toast.success(data.message || "🎉 Your profile has been verified! You can now go online.");
    });

    return () => {
      socket.disconnect();
    };
  }, [user, getRiderProfile]);

  // Web Sockets integration
  useEffect(() => {
    if (!user || user.role !== "rider" || !riderProfile?.isVerified || !riderProfile?.isOnline) {
      setCurrentOffer(null);
      return;
    }

    const socket = io("http://localhost:8000", {
      query: { userId: user._id, role: "rider" },
    });

    socket.on("connect", () => {
      console.log("Rider socket connected successfully.");
    });

    socket.on("new_order_available", (order: Orders) => {
      console.log("Socket received new order offer:", order);
      addIncomingOrder(order);
    });

    socket.on("order_taken", ({ orderId }: { orderId: string }) => {
      removeIncomingOrder(orderId);
      if (currentOffer?._id === orderId) {
        setCurrentOffer(null);
        toast.info("This order has been accepted by another rider.");
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user, riderProfile?.isVerified, riderProfile?.isOnline, currentOffer?._id]);

  // Coordinates transmission for live tracking
  useEffect(() => {
    if (!user || user.role !== "rider" || !activeOrder || !riderProfile?.isOnline) {
      return;
    }

    const socket = io("http://localhost:8000", {
      query: { userId: user._id, role: "rider" },
    });

    socket.emit("join_order", activeOrder._id);

    const updateLocation = () => {
      // Prioritize the pinned location from the profile first (helps with testing/mocking location)
      if (riderProfile?.location?.coordinates && riderProfile.location.coordinates[0] !== 0) {
        const [lng, lat] = riderProfile.location.coordinates;
        console.log(`Transmitting rider profile location: ${lat}, ${lng}`);
        socket.emit("update_rider_location", {
          orderId: activeOrder._id,
          lat,
          lng,
        });
        return;
      }

      // Otherwise fall back to browser GPS
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log(`Transmitting rider live location: ${latitude}, ${longitude}`);
          socket.emit("update_rider_location", {
            orderId: activeOrder._id,
            lat: latitude,
            lng: longitude,
          });
        },
        (error) => console.error("Location watch error:", error),
        { enableHighAccuracy: true }
      );
    };

    // Run immediately and then every 5 seconds
    updateLocation();
    const interval = setInterval(updateLocation, 5000);

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [user, activeOrder, riderProfile?.isOnline, riderProfile?.location?.coordinates?.[0], riderProfile?.location?.coordinates?.[1]]);

  // Handle offer display queue
  useEffect(() => {
    if (incomingOrders.length > 0 && !activeOrder && !currentOffer) {
      const nextOffer = incomingOrders[0];
      setCurrentOffer(nextOffer);
      setCountdown(10);
    }
  }, [incomingOrders, activeOrder, currentOffer]);

  // Offer timer countdown logic
  useEffect(() => {
    if (currentOffer) {
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current!);
            // Timeout offer
            removeIncomingOrder(currentOffer._id);
            setCurrentOffer(null);
            toast.warning("Order offer expired.");
            return 10;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [currentOffer]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleName.trim() || !licenseNumber.trim() || !contact.trim()) {
      toast.error("All registration details are required.");
      return;
    }
    await submitRiderDetails(vehicleName, licenseNumber, contact);
  };

  const handleToggleOnline = async () => {
    const nextState = !riderProfile?.isOnline;
    if (nextState) {
      // Check if rider has completed all profile details
      if (
        !riderProfile?.vehicleName ||
        !riderProfile?.licenseNumber ||
        !user?.contact ||
        !user?.address ||
        !user?.city ||
        !user?.country
      ) {
        toast.error("Please complete all profile details (Vehicle Name, License Number, Contact Number, Address, City, Country) in your Profile tab before going online!");
        return;
      }

      if (!navigator.geolocation) {
        toast.error("Geolocation is not supported by your browser.");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            await toggleOnlineStatus(true, latitude, longitude);
          } catch (error) {
            // Error toast handled inside store
          }
        },
        (error) => {
          console.error(error);
          toast.error("Location permission denied. You must grant location permission to go online.");
        }
      );
    } else {
      await toggleOnlineStatus(false, 0, 0);
    }
  };

  const handleAcceptOffer = async () => {
    if (!currentOffer) return;
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    try {
      await acceptOrder(currentOffer._id);
      setCurrentOffer(null);
    } catch (err) {
      setCurrentOffer(null);
    }
  };

  const handleDeclineOffer = () => {
    if (currentOffer) {
      removeIncomingOrder(currentOffer._id);
      setCurrentOffer(null);
    }
  };

  const handleWorkflowStep = async (status: "reached_restaurant" | "delivered") => {
    if (!activeOrder) return;
    await updateDeliveryWorkflow(activeOrder._id, status);
  };

  // View States
  // 1. Not registered as rider
  if (!riderProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white dark:bg-slate-800 shadow-2xl rounded-3xl p-8 border border-slate-100 dark:border-slate-700"
        >
          <div className="text-center mb-6">
            <Bike className="w-16 h-16 mx-auto text-orange-500 mb-4 animate-bounce" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Register as Delivery Partner</h1>
            <p className="text-sm text-slate-500 mt-2">
              Join the QuickBite fleet and start earning on your own schedule.
            </p>
          </div>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Vehicle Name / Type</Label>
              <Input
                type="text"
                placeholder="e.g. Honda Activa, Hero Splendor"
                value={vehicleName}
                onChange={(e) => setVehicleName(e.target.value)}
                className="rounded-xl border-2 focus:border-orange-500 focus:ring-0 dark:bg-slate-700"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Contact Number</Label>
              <Input
                type="tel"
                placeholder="e.g. +91 98765 43210"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="rounded-xl border-2 focus:border-orange-500 focus:ring-0 dark:bg-slate-700"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Driver License Number</Label>
              <Input
                type="text"
                placeholder="e.g. DL-1420110012345"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="rounded-xl border-2 focus:border-orange-500 focus:ring-0 dark:bg-slate-700 font-mono"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {loading ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : "Submit Details"}
            </Button>
          </form>
        </motion.div>
      </div>
    );
  }

  // 2. Awaiting verification
  if (!riderProfile.isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white dark:bg-slate-800 shadow-2xl rounded-3xl p-8 text-center border border-slate-100 dark:border-slate-700"
        >
          <AlertTriangle className="w-20 h-20 mx-auto text-amber-500 mb-6 animate-pulse" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profile Under Review</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-4 leading-relaxed">
            Thank you for registering as a QuickBite Delivery Partner! Your document profile is currently under review by our administration team.
          </p>
          <div className="bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 text-xs font-semibold p-4 rounded-2xl mt-6 border border-amber-100 dark:border-amber-900/30">
            This verification check usually takes 1 to 2 business hours.
          </div>
        </motion.div>
      </div>
    );
  }

  // 3. Verified Rider Dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Details Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-orange-100 dark:bg-orange-950/40 rounded-full flex items-center justify-center">
              <Bike className="w-8 h-8 text-orange-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {user?.fullname}
                <Badge className="bg-green-500 hover:bg-green-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full">
                  Verified Fleet
                </Badge>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                Vehicle: {riderProfile.vehicleName} | Lic: {riderProfile.licenseNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {riderProfile.isOnline ? "ONLINE" : "OFFLINE"}
            </span>
            <Button
              onClick={handleToggleOnline}
              disabled={loading}
              className={`rounded-full p-3 h-12 w-12 flex items-center justify-center border-0 shadow-lg ${
                riderProfile.isOnline
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-red-500 hover:bg-red-600 text-white"
              }`}
            >
              <Power className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Earnings Stats Cards */}
        {riderProfile.isOnline && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700 flex items-center justify-between"
            >
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Today's Earnings</p>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                  ₹{riderEarnings?.today || 0}
                </h3>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-semibold">
                  {riderEarnings?.tripsToday || 0} delivery runs
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center text-xl font-bold">
                💰
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700 flex items-center justify-between"
            >
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Weekly Earnings</p>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                  ₹{riderEarnings?.week || 0}
                </h3>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-semibold">
                  {riderEarnings?.tripsWeek || 0} delivery runs
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center text-xl font-bold">
                📅
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700 flex items-center justify-between cursor-pointer"
              onClick={() => setEarningsLogsOpen(true)}
            >
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                  Total Earnings
                  <span className="text-[10px] text-orange-500 bg-orange-100 dark:bg-orange-950/40 px-1.5 py-0.5 rounded font-bold">Log</span>
                </p>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                  ₹{riderEarnings?.total || 0}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-semibold hover:text-orange-500 transition-colors">
                  {riderEarnings?.tripsTotal || 0} trips completed →
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 rounded-xl flex items-center justify-center text-xl font-bold">
                🏍️
              </div>
            </motion.div>
          </div>
        )}

        {/* Earnings Trip History Modal */}
        <Dialog open={earningsLogsOpen} onOpenChange={setEarningsLogsOpen}>
          <DialogContent className="max-w-lg bg-white dark:bg-slate-800 border-0 shadow-2xl rounded-2xl">
            <DialogHeader className="border-b border-slate-100 dark:border-slate-700 pb-3">
              <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                🏍️ Trip Delivery History
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Overview of all successfully delivered runs
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2 mt-4">
              {riderDeliveries.length === 0 ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <Bike className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  No deliveries recorded yet.
                </div>
              ) : (
                riderDeliveries.map((delivery: any, idx) => (
                  <div
                    key={delivery._id || idx}
                    className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-700"
                  >
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                        {delivery.restaurant?.restaurantName || "Restaurant"}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Order #{delivery._id?.slice(-6)} • {new Date(delivery.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Distance: {delivery.distanceKM || 2.5} KM
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-extrabold text-green-600 dark:text-green-400">
                        +₹{delivery.deliveryFee || 25}
                      </span>
                      <span className="text-[10px] block text-green-500 font-bold uppercase tracking-wider">
                        Delivered ✓
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Live offers Countdown Alert overlay / modal */}
        <AnimatePresence>
          {currentOffer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-700 p-6 space-y-6"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                  <span className="text-sm font-bold text-orange-500 uppercase tracking-widest flex items-center gap-2">
                    <Bell className="w-4 h-4 animate-swing" />
                    Incoming Delivery Offer
                  </span>
                  <div className="bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold px-3 py-1 rounded-full flex items-center gap-1.5 text-sm animate-pulse">
                    <Clock className="w-4 h-4" />
                    {countdown}s
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                      {currentOffer.restaurant?.restaurantName}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                      <span>{currentOffer.restaurant?.address || currentOffer.restaurant?.city}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Distance to customer:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{currentOffer.distanceKM ?? 2.5} KM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Your Earnings:</span>
                      <span className="font-bold text-green-600 dark:text-green-400">₹{currentOffer.deliveryFee || 25}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 font-semibold">
                      <span>Items to pick:</span>
                      <span>{currentOffer.cartItems?.length || 1} items</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={handleDeclineOffer}
                    variant="outline"
                    className="flex-1 rounded-xl py-3 text-slate-600 border-slate-200 hover:bg-slate-50 dark:text-slate-400 dark:border-slate-700"
                  >
                    Decline
                  </Button>
                  <Button
                    onClick={handleAcceptOffer}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    Accept Offer
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. Offline Banner */}
        {!riderProfile.isOnline && (
          <Card className="border-0 shadow-lg bg-amber-50/50 dark:bg-slate-800/40 border border-dashed border-amber-200 dark:border-slate-700 p-8 text-center rounded-3xl">
            <Clock className="w-16 h-16 mx-auto text-amber-500 mb-4 animate-spin-slow" />
            <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200">Currently Offline</CardTitle>
            <CardDescription className="max-w-md mx-auto mt-2 text-sm text-slate-600 dark:text-slate-400">
              Flip the power switch above to go online. Remember you must be within a **1KM proximity hotspot** of active food restaurants to receive incoming order requests!
            </CardDescription>
          </Card>
        )}

        {/* 2. Active Delivery Tracking Dashboard */}
        {riderProfile.isOnline && activeOrder && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="border-0 shadow-xl bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-700">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-bold tracking-widest uppercase bg-orange-600/50 px-2 py-0.5 rounded">
                      Active Delivery Task
                    </span>
                    <CardTitle className="text-xl font-extrabold mt-1">
                      Order #{activeOrder._id?.substring(18)}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => setChatOpen(true)}
                      className="bg-white/20 hover:bg-white/30 text-white border-0 rounded-xl px-4 py-2 text-xs font-bold flex items-center gap-1.5 shadow"
                    >
                      <MessageCircle className="w-4 h-4 fill-white text-white" />
                      Chat with Customer
                    </Button>
                    <Badge className="bg-white text-orange-600 font-bold px-3 py-1 rounded-full text-xs">
                      ₹{activeOrder.deliveryFee || 25} Delivery Earnings
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Visual Checkpoints timeline */}
                <div className="flex flex-col gap-6 relative pl-6 border-l-2 border-slate-200 dark:border-slate-700">
                  {/* Step 1: Accepted (Pick up) */}
                  <div className="relative">
                    <div className={`absolute -left-[35px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      activeOrder.riderStatus === "accepted" || activeOrder.riderStatus === "reached_restaurant" || activeOrder.riderStatus === "delivered"
                        ? "bg-orange-500 text-white"
                        : "bg-slate-200 text-slate-500 dark:bg-slate-700"
                    }`}>
                      1
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                        Restaurant Food Pickup
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 font-semibold">
                        {activeOrder.restaurant?.restaurantName}
                      </p>
                      <div className="flex flex-col gap-1 mt-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                        <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />{activeOrder.restaurant?.address || activeOrder.restaurant?.city}</span>
                        <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-orange-500 shrink-0" />{activeOrder.restaurant?.contactNumber || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Out for delivery */}
                  <div className="relative">
                    <div className={`absolute -left-[35px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      activeOrder.riderStatus === "reached_restaurant" || activeOrder.riderStatus === "delivered"
                        ? "bg-orange-500 text-white"
                        : "bg-slate-200 text-slate-500 dark:bg-slate-700"
                    }`}>
                      2
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                        Deliver to Customer
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 font-semibold">
                        {activeOrder.deliveryDetails?.name}
                      </p>
                      <div className="flex flex-col gap-1 mt-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                        <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />{activeOrder.deliveryDetails?.address}, {activeOrder.deliveryDetails?.city}</span>
                        <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-orange-500 shrink-0" />{activeOrder.deliveryDetails?.contact || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Real-time Live Tracking Map for Rider */}
                <div className="mt-6 border-t border-slate-100 dark:border-slate-700 pt-6">
                  <LiveTrackingMap
                    orderId={activeOrder._id}
                    restaurantCoords={activeOrder.restaurant?.location?.coordinates}
                    customerCoords={
                      activeOrder.deliveryDetails?.longitude && activeOrder.deliveryDetails?.latitude
                        ? [Number(activeOrder.deliveryDetails.longitude), Number(activeOrder.deliveryDetails.latitude)]
                        : undefined
                    }
                    restaurantName={activeOrder.restaurant?.restaurantName}
                    customerName={activeOrder.deliveryDetails?.name || "Customer"}
                    orderStatus={activeOrder.status}
                    hasRider={true}
                  />
                </div>

                {/* Checklist Workflow Actions */}
                <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                  {activeOrder.riderStatus === "accepted" ? (
                    <Button
                      onClick={() => handleWorkflowStep("reached_restaurant")}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Reached Restaurant
                    </Button>
                  ) : activeOrder.riderStatus === "reached_restaurant" ? (
                    <Button
                      onClick={() => handleWorkflowStep("delivered")}
                      disabled={loading}
                      className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Mark as Delivered
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 3. Waiting for orders screen */}
        {riderProfile.isOnline && !activeOrder && (
          <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 p-10 text-center rounded-3xl border border-slate-100 dark:border-slate-700">
            <Loader2 className="w-12 h-12 mx-auto text-orange-500 mb-4 animate-spin" />
            <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200">Scanning for Orders...</CardTitle>
            <CardDescription className="max-w-md mx-auto mt-2 text-sm text-slate-500 dark:text-slate-400">
              You are online and in an active zone. Keep this screen open; new order alerts will automatically ring with details and a 10s timer as soon as customers checkout!
            </CardDescription>
          </Card>
        )}
        {activeOrder && (
          <ChatPanel
            orderId={activeOrder._id}
            open={chatOpen}
            onOpenChange={setChatOpen}
            currentUserId={user?._id || ""}
          />
        )}
      </div>
    </div>
  );
};
