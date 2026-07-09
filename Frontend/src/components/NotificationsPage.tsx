import React, { useEffect } from "react";
import { useNotificationStore, AppNotification } from "@/store/useNotificationStore";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Trash2,
  Check,
  Bike,
  Utensils,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";

const getNotificationConfig = (type: string) => {
  switch (type) {
    case "new_order":
      return {
        icon: Utensils,
        bg: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
        iconBg: "bg-blue-100 dark:bg-blue-900/40",
        iconColor: "text-blue-600 dark:text-blue-400",
        badge: "New Order",
        badgeStyle: "bg-blue-500 text-white",
        accent: "border-l-blue-500",
      };
    case "rider_accepted":
      return {
        icon: Bike,
        bg: "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800",
        iconBg: "bg-indigo-100 dark:bg-indigo-900/40",
        iconColor: "text-indigo-600 dark:text-indigo-400",
        badge: "Rider Heading",
        badgeStyle: "bg-indigo-500 text-white",
        accent: "border-l-indigo-500",
      };
    case "outfordelivery":
      return {
        icon: Truck,
        bg: "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800",
        iconBg: "bg-orange-100 dark:bg-orange-900/40",
        iconColor: "text-orange-600 dark:text-orange-400",
        badge: "Out for Delivery",
        badgeStyle: "bg-orange-500 text-white animate-pulse",
        accent: "border-l-orange-500",
      };
    case "delivered":
      return {
        icon: CheckCircle,
        bg: "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800",
        iconBg: "bg-green-100 dark:bg-green-900/40",
        iconColor: "text-green-600 dark:text-green-400",
        badge: "Delivered",
        badgeStyle: "bg-green-500 text-white",
        accent: "border-l-green-500",
      };
    case "cancelled":
      return {
        icon: XCircle,
        bg: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
        iconBg: "bg-red-100 dark:bg-red-900/40",
        iconColor: "text-red-600 dark:text-red-400",
        badge: "Cancelled",
        badgeStyle: "bg-red-500 text-white",
        accent: "border-l-red-500",
      };
    default:
      return {
        icon: Bell,
        bg: "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700",
        iconBg: "bg-slate-100 dark:bg-slate-700/60",
        iconColor: "text-slate-500 dark:text-slate-400",
        badge: "Update",
        badgeStyle: "bg-slate-500 text-white",
        accent: "border-l-slate-400",
      };
  }
};

const formatTime = (isoString: string) => {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return date.toLocaleDateString();
  } catch {
    return "Just now";
  }
};

const formatDate = (isoString: string) => {
  try {
    return new Date(isoString).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric"
    });
  } catch {
    return "";
  }
};

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAllAsRead, clearNotifications } = useNotificationStore();

  useEffect(() => {
    if (unreadCount > 0) {
      markAllAsRead();
    }
  }, [unreadCount, markAllAsRead]);

  const handleNotificationClick = (notif: AppNotification) => {
    if (notif.link) {
      navigate(notif.link);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-[85vh] bg-gradient-to-br from-slate-50 via-slate-100 to-orange-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white/60 dark:border-slate-700"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200 dark:shadow-orange-900/40">
              <Bell className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">Notifications</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
                Real-time updates — click any to go there
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {notifications.length > 0 && (
              <>
                <Button
                  onClick={markAllAsRead}
                  variant="outline"
                  size="sm"
                  className="rounded-xl border border-slate-200 text-slate-600 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-50 text-xs"
                >
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  Mark Read
                </Button>
                <Button
                  onClick={clearNotifications}
                  variant="destructive"
                  size="sm"
                  className="rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Clear All
                </Button>
              </>
            )}
          </div>
        </motion.div>

        {/* Notifications List */}
        <Card className="border-0 shadow-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/60 dark:border-slate-700">
          <CardContent className="p-6 space-y-3">
            <AnimatePresence mode="popLayout">
              {notifications.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-20 space-y-4"
                >
                  <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                    <Bell className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">All caught up!</h3>
                    <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
                      Real-time alerts will appear here when orders, deliveries, or updates happen.
                    </p>
                  </div>
                </motion.div>
              ) : (
                notifications.map((notif: AppNotification, index: number) => {
                  const config = getNotificationConfig(notif.type);
                  const IconComponent = config.icon;
                  const isClickable = !!notif.link;

                  return (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: -20, scale: 0.97 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 30, scale: 0.95 }}
                      transition={{ delay: Math.min(index * 0.04, 0.3), type: "spring", stiffness: 120, damping: 18 }}
                      onClick={() => handleNotificationClick(notif)}
                      className={`
                        relative p-4 rounded-2xl border-l-4 border transition-all duration-300 flex items-start gap-4
                        ${config.bg} ${config.accent}
                        ${isClickable ? "cursor-pointer hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]" : ""}
                      `}
                    >
                      {/* Unread dot */}
                      {!notif.read && (
                        <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse" />
                      )}

                      {/* Icon */}
                      <div className={`p-3 rounded-xl ${config.iconBg} ${config.iconColor} shrink-0 transition-transform duration-300 group-hover:scale-110`}>
                        <IconComponent className="w-5 h-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">{notif.title}</span>
                          <Badge className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${config.badgeStyle}`}>
                            {config.badge}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{notif.message}</p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(notif.timestamp)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(notif.timestamp)}
                          </span>
                          {isClickable && (
                            <span className="ml-auto flex items-center gap-0.5 text-orange-500 font-bold">
                              View <ArrowRight className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default NotificationsPage;
