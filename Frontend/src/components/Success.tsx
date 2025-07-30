"use client";

import { IndianRupee, CheckCircle, Package, Truck, Clock } from "lucide-react";
import { Separator } from "./ui/separator";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { useOrderStore } from "@/store/useOrderStore";
import type { CartItem } from "@/types/cartType";
import { useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

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
  const { orders, getOrderDetails } = useOrderStore();

  useEffect(() => {
    getOrderDetails();
  }, []);

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
              Start Shopping
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
                          {status}
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
    </motion.div>
  );
};

export default Success;
