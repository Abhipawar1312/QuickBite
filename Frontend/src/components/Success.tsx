import { IndianRupee } from "lucide-react";
import { Separator } from "./ui/separator";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { useOrderStore } from "@/store/useOrderStore";
import { CartItem } from "@/types/cartType";
import { useEffect } from "react";
import { motion } from "framer-motion";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  preparing: "bg-blue-100 text-blue-800",
  outfordelivery: "bg-orange-100 text-orange-800",
  delivered: "bg-gray-100 text-gray-800",
};

const Success = () => {
  const { orders, getOrderDetails } = useOrderStore();

  useEffect(() => {
    getOrderDetails();
  }, []);

  if (orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#111]">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          No orders found
        </h1>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50 dark:bg-[#111] py-16 px-4"
    >
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-4xl font-extrabold text-center text-gray-900 dark:text-white mb-12"
      >
        Your Orders
      </motion.h1>

      <div className="max-w-3xl mx-auto space-y-10">
        {orders.map((order: any) => {
          const { status, cartItems, totalAmount } = order;

          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              key={order._id}
              className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-lg border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-shadow"
            >
              <div className="text-center mb-6">
                <span className="mr-2 text-gray-700 dark:text-gray-300 font-medium">
                  Status:
                </span>
                <span
                  className={`px-4 py-1 rounded-full text-sm font-semibold capitalize ${
                    STATUS_STYLES[status] || STATUS_STYLES.pending
                  }`}
                >
                  {status}
                </span>
              </div>

              <Separator className="border-gray-200 dark:border-white/20" />

              <div className="space-y-6 mt-6">
                {cartItems.map((item: CartItem, idx: number) => {
                  const lineTotal = item.price * item.quantity;

                  return (
                    <div
                      key={idx}
                      className="flex justify-between items-center"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div>
                          <p className="text-base font-medium text-gray-900 dark:text-white">
                            {item.name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Qty: {item.quantity}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-gray-500">Unit Price</p>
                        <p className="flex items-center justify-end text-sm font-semibold text-gray-800 dark:text-white">
                          <IndianRupee className="w-4 h-4 mr-1" />
                          {item.price}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-end">
                          <span className="mr-1">Total:</span>
                          <IndianRupee className="w-4 h-4 mr-1" />
                          {lineTotal}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Separator className="border-gray-200 dark:border-white/20 mt-6" />

              <div className="flex justify-between items-center mt-6">
                <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Order Total
                </p>
                <p className="flex items-center text-2xl font-bold text-gray-900 dark:text-white">
                  <IndianRupee className="w-5 h-5 mr-1" />
                  {totalAmount}
                </p>
              </div>
            </motion.div>
          );
        })}

        <Link to="/cart">
          <Button className="w-full py-4 bg-sky-500 hover:bg-sky-600 rounded-full text-lg font-semibold">
            Continue Shopping
          </Button>
        </Link>
      </div>
    </motion.div>
  );
};

export default Success;
