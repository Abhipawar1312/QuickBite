"use client";

import { IndianRupee, CheckCircle, Package, Truck, Clock, Bike, Star, Loader2, MessageCircle } from "lucide-react";
import { Separator } from "./ui/separator";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useOrderStore } from "@/store/useOrderStore";
import { useCartStore } from "@/store/useCartStore";
import { useUserStore } from "@/store/useUserStore";
import type { CartItem } from "@/types/cartType";
import { useEffect, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { LiveTrackingMap } from "./LiveTrackingMap";
import { ChatPanel } from "./ChatPanel";
import { io } from "socket.io-client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { useReviewStore } from "@/store/useReviewStore";
import { toast } from "sonner";


const STATUS_STYLES: Record<string, { bg: string; text: string; icon: any }> = {
  pending: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-800 dark:text-yellow-300",
    icon: Clock,
  },
  confirmed: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-800 dark:text-green-300",
    icon: CheckCircle,
  },
  preparing: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-800 dark:text-blue-300",
    icon: Package,
  },
  ready_for_riders: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-800 dark:text-purple-300",
    icon: Bike,
  },
  outfordelivery: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-800 dark:text-orange-300",
    icon: Truck,
  },
  delivered: {
    bg: "bg-gray-100 dark:bg-gray-900/30",
    text: "text-gray-800 dark:text-gray-300",
    icon: CheckCircle,
  },
};

// Replace the existing variants with properly typed ones
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

const orderVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
    },
  },
};

const Success = () => {
  const { orders, getOrderDetails, updateLocalOrderStatus, markOrderAsReviewed } = useOrderStore();
  const { clearCart, setCart } = useCartStore();
  const { createReview, loading: reviewSubmitting } = useReviewStore();
  const { user } = useUserStore();
  const navigate = useNavigate();

  const handleReorder = (order: any) => {
    const itemsToSet = order.cartItems.map((item: any) => ({
      _id: item.menuId,
      name: item.name,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
      description: ""
    }));
    setCart(itemsToSet);
    toast.success("Previous order items loaded into cart!");
    navigate("/cart");
  };

  const [reviewOpen, setReviewOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState("");

  const [chatOpen, setChatOpen] = useState(false);
  const [chatOrderId, setChatOrderId] = useState<string | null>(null);

  const handleOpenChat = (orderId: string) => {
    setChatOrderId(orderId);
    setChatOpen(true);
  };

  const handleOpenReviewModal = (orderId: string) => {
    setSelectedOrderId(orderId);
    setRating(5);
    setComment("");
    setReviewOpen(true);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) return;
    if (!comment.trim()) {
      toast.error("Please enter a comment");
      return;
    }
    const res = await createReview(selectedOrderId, rating, comment);
    if (res.success) {
      markOrderAsReviewed(selectedOrderId);
      setReviewOpen(false);
      setSelectedOrderId(null);
    }
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const isSuccess = queryParams.get("success") === "true";
    getOrderDetails(isSuccess);
    if (isSuccess) {
      clearCart();
    }
  }, []);

  // Web socket listeners for real-time status updates
  useEffect(() => {
    if (orders.length === 0) return;

    const socket = io("http://localhost:8000");

    // Join order rooms
    orders.forEach((order) => {
      console.log(`Joining success tracking room: order_${order._id}`);
      socket.emit("join_order", order._id);
    });

    socket.on("order_status_updated", (updatedOrder: any) => {
      console.log("Customer Success received status update via socket:", updatedOrder);
      updateLocalOrderStatus(updatedOrder);
    });

    return () => {
      socket.disconnect();
    };
  }, [orders.length, updateLocalOrderStatus]);

  if (orders.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-32 h-32 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-8"
        >
          <Package className="w-16 h-16 text-orange-500" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-3xl font-bold text-slate-900 dark:text-white mb-4"
        >
          No orders found
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-slate-600 dark:text-slate-400 text-center mb-8"
        >
          You haven't placed any orders yet. Start exploring our delicious menu!
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Link to="/">
            <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
              Start Ordering Food
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-16 px-4"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
          Your Orders
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Track your delicious orders and their delivery status
        </p>
      </motion.div>

      <div className="max-w-4xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          <AnimatePresence>
            {orders.map((order: any, orderIndex) => {
              const { status, cartItems, totalAmount } = order;
              const statusConfig =
                STATUS_STYLES[status] || STATUS_STYLES.pending;
              const StatusIcon = statusConfig.icon;

              return (
                <motion.div
                  key={order._id}
                  variants={orderVariants}
                  layout
                  className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 overflow-hidden group"
                >
                  {/* Order Header */}
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white relative overflow-hidden">
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold">
                            Order #{order._id.slice(-6)}
                          </h3>
                          <p className="text-orange-100">
                            Placed on {new Date().toLocaleDateString()}
                          </p>
                        </div>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className={`flex items-center gap-2 px-4 py-2 rounded-full ${statusConfig.bg} ${statusConfig.text} font-semibold capitalize shadow-lg`}
                        >
                          <StatusIcon className="w-4 h-4" />
                          {status.replace(/_/g, " ")}
                        </motion.div>
                      </div>
                    </div>

                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-4 right-4 w-24 h-24 bg-white rounded-full" />
                      <div className="absolute bottom-4 left-4 w-16 h-16 bg-white rounded-full" />
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-6">
                    <div className="space-y-4">
                      {cartItems.map((item: CartItem, idx: number) => {
                        const lineTotal = item.price * item.quantity;
                        return (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                              delay: orderIndex * 0.1 + idx * 0.05,
                            }}
                            className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-300 group/item"
                          >
                            <div className="flex items-center gap-4">
                              <motion.div
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                className="relative"
                              >
                                <img
                                  src={item.image || "/placeholder.svg"}
                                  alt={item.name}
                                  className="w-16 h-16 rounded-xl object-cover shadow-lg"
                                />
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                  {item.quantity}
                                </div>
                              </motion.div>
                              <div>
                                <h4 className="font-semibold text-slate-900 dark:text-white group-hover/item:text-orange-600 dark:group-hover/item:text-orange-400 transition-colors duration-300">
                                  {item.name}
                                </h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                  Quantity: {item.quantity}
                                </p>
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Unit Price
                              </p>
                              <p className="flex items-center justify-end text-sm font-medium text-slate-700 dark:text-slate-300">
                                <IndianRupee className="w-3 h-3 mr-1" />
                                {item.price}
                              </p>
                              <p className="flex items-center justify-end text-lg font-bold text-slate-900 dark:text-white">
                                <IndianRupee className="w-4 h-4 mr-1" />
                                {lineTotal}
                              </p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    <Separator className="my-6 bg-slate-200 dark:bg-slate-600" />

                    {/* Order Total */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="flex justify-between items-center p-4 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-2xl border border-orange-200 dark:border-orange-800"
                    >
                      <p className="text-xl font-bold text-slate-900 dark:text-white">
                        Order Total
                      </p>
                      <p className="flex items-center text-2xl font-bold text-orange-600 dark:text-orange-400">
                        <IndianRupee className="w-6 h-6 mr-1" />
                        {totalAmount}
                      </p>
                    </motion.div>

                    {/* Rider Details & Chat Button */}
                    {order.rider && (status === "confirmed" || status === "preparing" || status === "ready_for_riders" || status === "outfordelivery") && (
                      <div className="mt-4 flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center font-bold text-orange-600">
                            🛵
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Rider: {order.rider?.fullname || "Assigned Partner"}</p>
                            <p className="text-[10px] text-slate-500">Vehicle: {order.riderVehicle || "Delivery Fleet"}</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleOpenChat(order._id)}
                          className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl px-4 py-2 text-xs flex items-center gap-1.5 shadow"
                        >
                          <MessageCircle className="w-4 h-4 fill-white text-white" />
                          Chat with Rider
                        </Button>
                      </div>
                    )}

                    {/* Live Tracking Map Widget */}
                    {(status === "confirmed" || status === "preparing" || status === "ready_for_riders" || status === "outfordelivery") && (
                      <div className="mt-6">
                        <LiveTrackingMap
                          orderId={order._id}
                          restaurantCoords={order.restaurant?.location?.coordinates}
                          customerCoords={
                            order.deliveryDetails?.longitude && order.deliveryDetails?.latitude
                              ? [Number(order.deliveryDetails.longitude), Number(order.deliveryDetails.latitude)]
                              : undefined
                          }
                          restaurantName={order.restaurant?.restaurantName}
                          customerName={order.deliveryDetails?.name || "You"}
                          orderStatus={status}
                          hasRider={!!order.rider}
                          riderVehicle={(order as any).riderVehicle}
                        />
                      </div>
                    )}

                    {/* Write a Review Button */}
                    {status === "delivered" && (
                      <div className="mt-6 flex justify-end items-center gap-3">
                        {order.isReviewed ? (
                          <span className="text-sm font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-4 py-2 rounded-full flex items-center gap-1.5 animate-pulse">
                            <CheckCircle className="w-4 h-4" />
                            Reviewed. Thank you!
                          </span>
                        ) : (
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              onClick={() => handleOpenReviewModal(order._id)}
                              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold rounded-xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                              <Star className="w-5 h-5 mr-2 fill-yellow-300 text-yellow-300 animate-pulse" />
                              Rate & Review Order
                            </Button>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>

                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* Continue Shopping Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-12"
        >
          <Link to="/">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group">
                Continue Shopping
                <motion.div
                  className="ml-2"
                  animate={{ x: [0, 4, 0] }}
                  transition={{
                    duration: 1.5,
                    repeat: Number.POSITIVE_INFINITY,
                  }}
                >
                  →
                </motion.div>
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </div>

      {/* Review & Rating Dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-800 border-0 shadow-2xl rounded-2xl">
          <DialogHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Star className="w-8 h-8 text-white fill-white animate-pulse" />
            </div>
            <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white">
              Rate Your Order
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">
              Share your delicious experience to help others order best food!
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleReviewSubmit} className="space-y-6">
            {/* Star Rating Selector */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                How was the taste and delivery?
              </span>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((starIndex) => {
                  const isGold = starIndex <= (hoverRating || rating);
                  return (
                    <motion.button
                      key={starIndex}
                      type="button"
                      whileHover={{ scale: 1.25, rotate: 10 }}
                      whileTap={{ scale: 0.9 }}
                      onMouseEnter={() => setHoverRating(starIndex)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(starIndex)}
                      className="p-1 focus:outline-none transition-colors duration-200"
                    >
                      <Star
                        className={`w-10 h-10 ${
                          isGold
                            ? "fill-yellow-400 text-yellow-400 drop-shadow-md"
                            : "fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700"
                        }`}
                      />
                    </motion.button>
                  );
                })}
              </div>
              <span className="text-lg font-bold text-orange-500 capitalize animate-bounce">
                {rating === 1 && "Terrible 😡"}
                {rating === 2 && "Bad 😟"}
                {rating === 3 && "Average 😐"}
                {rating === 4 && "Very Good 🙂"}
                {rating === 5 && "Excellent! 😍"}
              </span>
            </div>

            {/* Comment Area */}
            <div className="space-y-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Write a comment
              </span>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Delicious taste, prompt delivery, great service!"
                className="w-full min-h-[100px] p-4 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-800 text-slate-900 dark:text-white transition-all duration-300 resize-none outline-none text-sm leading-relaxed"
                required
              />
            </div>

            <DialogFooter className="pt-2">
              {reviewSubmitting ? (
                <Button
                  disabled
                  type="button"
                  className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold flex items-center justify-center"
                >
                  <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                  Submitting review...
                </Button>
              ) : (
                <div className="flex w-full gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setReviewOpen(false)}
                    className="flex-1 h-12 rounded-xl border-2 border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300 font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Submit Review
                  </Button>
                </div>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {chatOrderId && (
        <ChatPanel
          orderId={chatOrderId}
          open={chatOpen}
          onOpenChange={setChatOpen}
          currentUserId={user?._id || ""}
        />
      )}
    </motion.div>
  );
};

export default Success;
