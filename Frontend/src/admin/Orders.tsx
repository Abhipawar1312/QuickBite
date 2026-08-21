"use client";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRestaurantStore } from "@/store/useRestaurantStore";
import { useUserStore } from "@/store/useUserStore";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";
import { BASE_URL } from "@/config/api";

import {
  Package,
  MapPin,
  IndianRupee,
  Clock,
  CheckCircle,
  Truck,
  User,
  Bike,
  XCircle,
  ChefHat,
} from "lucide-react";


const STATUS_CONFIG = {
  pending: {
    color: "bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
    icon: Clock,
  },
  confirmed: {
    color: "bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800",
    icon: CheckCircle,
  },
  preparing: {
    color: "bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    icon: Package,
  },
  ready_for_riders: {
    color: "bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    icon: Bike,
  },
  outfordelivery: {
    color: "bg-orange-100 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800",
    icon: Truck,
  },
  delivered: {
    color: "bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
    icon: CheckCircle,
  },
  cancelled: {
    color: "bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800",
    icon: XCircle,
  },
};



const Orders = () => {
  const { user } = useUserStore();
  const { restaurantOrder, getRestaurantOrders, updateRestaurantOrder, updateLocalRestaurantOrder, addLocalRestaurantOrder } =
    useRestaurantStore();

  const [disabledRetries, setDisabledRetries] = useState<Record<string, number>>({});

  const handleStatusChange = async (id: string, status: string) => {
    await updateRestaurantOrder(id, status);
  };

  const handleRetryBroadcast = async (id: string) => {
    setDisabledRetries((prev) => ({ ...prev, [id]: 10 }));
    const interval = setInterval(() => {
      setDisabledRetries((prev) => {
        const val = prev[id] || 0;
        if (val <= 1) {
          clearInterval(interval);
          const next = { ...prev };
          delete next[id];
          return next;
        }
        return { ...prev, [id]: val - 1 };
      });
    }, 1000);
    await updateRestaurantOrder(id, "ready_for_riders");
  };

  useEffect(() => {
    getRestaurantOrders();
  }, []);

  // Web socket listeners for real-time status updates from riders
  useEffect(() => {
    if (!user) return;

    const socket = io(BASE_URL, {
      query: { userId: user._id }
    });


    socket.on("order_status_updated", (updatedOrder: any) => {
      console.log("Restaurant Orders received status update via socket:", updatedOrder);
      updateLocalRestaurantOrder(updatedOrder);
    });

    socket.on("new_restaurant_order", (newOrder: any) => {
      console.log("Restaurant Orders received new order via socket:", newOrder);
      addLocalRestaurantOrder(newOrder);
    });

    return () => {
      socket.disconnect();
    };
  }, [user, updateLocalRestaurantOrder]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8 px-4"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-4">
            Orders Overview
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Manage and track all your restaurant orders
          </p>
        </motion.div>

        {/* Orders List */}
        <div className="space-y-6">
          <AnimatePresence>
            {[...restaurantOrder]
              .sort((a, b) => {
                const timeA = new Date(a.createdAt || 0).getTime();
                const timeB = new Date(b.createdAt || 0).getTime();
                if (timeA && timeB && timeA !== timeB) return timeB - timeA;
                return (b._id || "").localeCompare(a._id || "");
              })
              .map((order, index) => {
                const normalizedStatus = (order.status || "").toLowerCase() as keyof typeof STATUS_CONFIG;

              const statusConfig =
                STATUS_CONFIG[normalizedStatus] ||
                STATUS_CONFIG.pending;
              const StatusIcon = statusConfig.icon;

              return (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 hover:shadow-2xl transition-all duration-300 group"
                >
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                    {/* Order Details */}
                    <div className="flex-1 space-y-4">
                      {/* Customer Info */}
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h2 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                            {order.deliveryDetails.name}
                          </h2>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Order #{order._id.slice(-6)}
                          </p>
                        </div>
                      </div>

                      {/* Address */}
                      <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl">
                        <MapPin className="w-5 h-5 text-slate-500 dark:text-slate-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                            Delivery Address
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            {order.deliveryDetails.address},{" "}
                            {order.deliveryDetails.city}
                          </p>
                          {order.restaurantNote && (
                            <div className="mt-2.5 flex items-start gap-2.5 bg-orange-50 dark:bg-orange-950/40 p-2.5 rounded-xl border border-orange-200 dark:border-orange-800/60 text-xs text-orange-950 dark:text-orange-200 font-medium">
                              <ChefHat className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                              <div>
                                <strong className="text-orange-700 dark:text-orange-400 font-bold">Kitchen Instructions:</strong> {order.restaurantNote}
                              </div>
                            </div>
                          )}
                          {order.deliveryInstructions && (
                            <div className="mt-2.5 flex items-start gap-2 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-300 font-medium">
                              <span>📝</span>
                              <span><strong>Delivery Note:</strong> {order.deliveryInstructions}</span>
                            </div>
                          )}
                        </div>
                      </div>



                      {/* Financial Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
                          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                            <IndianRupee className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                              Total Amount
                            </p>
                            <p className="text-lg font-bold text-green-700 dark:text-green-300">
                              ₹{order.totalAmount}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Package className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                              Total Items
                            </p>
                            <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                              {order.cartItems.reduce(
                                (total: number, item: any) =>
                                  total + item.quantity,
                                0
                              )}{" "}
                              items
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status Section */}
                    <div className="w-full lg:w-80 space-y-4">
                      {/* Current Status Badge */}
                      <div className="flex items-center justify-center lg:justify-start">
                        <div
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border font-semibold text-sm ${statusConfig.color}`}
                        >
                          <StatusIcon className="w-4 h-4" />
                          <span className="capitalize">{normalizedStatus.replace(/_/g, " ")}</span>
                        </div>
                      </div>

                      {/* Status Selector */}
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Update Order Status
                        </Label>
                        <Select
                          onValueChange={(newStatus) =>
                            handleStatusChange(order._id, newStatus)
                          }
                          value={normalizedStatus}
                        >
                          <SelectTrigger className="h-12 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-300">
                            <SelectValue placeholder="Select Status" />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl">
                            <SelectGroup>
                              {[
                                "Pending",
                                "Confirmed",
                                "Preparing",
                                "Ready_For_Riders",
                                "OutForDelivery",
                                "Delivered",
                                "Cancelled",
                              ].map((status: string, index: number) => {

                                const statusKey =
                                  status.toLowerCase() as keyof typeof STATUS_CONFIG;
                                const StatusIcon =
                                  STATUS_CONFIG[statusKey]?.icon || Clock;

                                return (
                                  <SelectItem
                                    key={index}
                                    value={status.toLowerCase()}
                                    className="hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors duration-200"
                                  >
                                    <div className="flex items-center gap-2">
                                      <StatusIcon className="w-4 h-4" />
                                      {status.replace(/_/g, " ")}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>

                      {order.status === "ready_for_riders" && !order.rider && (
                        <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 mt-3 text-center space-y-3">
                          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-purple-700 dark:text-purple-400">
                            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping shrink-0" />
                            Waiting for riders to accept...
                          </div>
                          <Button
                            size="sm"
                            disabled={disabledRetries[order._id] > 0}
                            onClick={() => handleRetryBroadcast(order._id)}
                            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-semibold text-xs py-2 rounded-lg shadow transition-all duration-300"
                          >
                            {disabledRetries[order._id] > 0
                              ? `Retry in ${disabledRetries[order._id]}s`
                              : "Retry Ready for Riders"}
                          </Button>
                        </div>
                      )}

                      {order.rider && (
                        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mt-3 text-xs text-slate-600 dark:text-slate-400 space-y-2">
                          <div className="flex justify-between font-semibold text-slate-800 dark:text-slate-200">
                            <span>Assigned Rider:</span>
                            <span className="text-green-700 dark:text-green-400">{order.rider.fullname}</span>
                          </div>
                          {order.rider.contact && (
                            <div className="flex justify-between">
                              <span>Rider Contact:</span>
                              <span className="font-mono font-medium text-slate-900 dark:text-white">{order.rider.contact}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>Delivery Status:</span>
                            <span className="capitalize font-medium text-slate-900 dark:text-white">
                              {order.riderStatus === "reached_restaurant"
                                ? "Driving to Customer"
                                : order.riderStatus?.replace(/_/g, " ") || "Accepted"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Empty State */}
          {restaurantOrder.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700"
            >
              <div className="w-24 h-24 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-12 h-12 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                No orders yet
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Orders will appear here once customers start placing them
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Orders;
