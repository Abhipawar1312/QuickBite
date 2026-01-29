"use client";

import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { useState } from "react";
import CheckoutConfirmPage from "./CheckoutConfirmPage";
import { useCartStore } from "@/store/useCartStore";
import type { CartItem } from "@/types/cartType";
import { motion, AnimatePresence } from "framer-motion";

const Cart = () => {
  const [open, setOpen] = useState<boolean>(false);
  const {
    cart,
    incrementQuantity,
    decrementQuantity,
    clearCart,
    removeFromTheCart,
  } = useCartStore();

  const totalAmount = cart.reduce(
    (acc, ele) => acc + ele.price * ele.quantity,
    0
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
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
    exit: {
      opacity: 0,
      x: -100,
      scale: 0.8,
      transition: {
        duration: 0.3,
      },
    },
  };

  if (cart.length === 0) {
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
          className="w-24 h-24 sm:w-32 sm:h-32 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-6 sm:mb-8"
        >
          <ShoppingBag className="w-12 h-12 sm:w-16 sm:h-16 text-orange-500" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 text-center"
        >
          Your cart is empty
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-sm sm:text-base text-slate-600 dark:text-slate-400 text-center mb-6 sm:mb-8 px-4"
        >
          Looks like you haven't added any items to your cart yet
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base">
            Start Shopping
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8 sm:py-12 md:py-16 px-4"
    >
      {/* Mobile-Optimized Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-8 sm:mb-12"
      >
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4">
          Your Cart
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
          Review your items before checkout
        </p>
      </motion.div>

      <div className="max-w-6xl mx-auto">
        {/* Mobile-Optimized Clear All Button */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-end mb-4 sm:mb-6"
        >
          <Button
            data-testid="clear-cart-button"
            variant="ghost"
            onClick={clearCart}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 group text-sm sm:text-base px-3 sm:px-4 py-2"
          >
            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 group-hover:animate-bounce" />
            Clear All
          </Button>
        </motion.div>

        {/* Mobile-Optimized Cart Display */}
        <div className="block sm:hidden">
          {/* Mobile Card Layout */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            <AnimatePresence>
              {cart.map((item: CartItem, index) => (
                <motion.div
                  key={item._id}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  custom={index}
                  className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-4 border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center gap-4">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Avatar className="w-16 h-16 border-2 border-slate-200 dark:border-slate-600">
                        <AvatarImage
                          src={item?.image || "/placeholder.svg"}
                          alt={item?.name}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-semibold">
                          {item?.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </motion.div>

                    <div className="flex-1 min-w-0">
                      <h3 data-testid={`cart-item-name-${item._id}`} className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                        {item?.name}
                      </h3>
                      <p className="text-slate-700 dark:text-slate-300 font-medium text-sm">
                        ₹{item?.price}
                      </p>
                      <p data-testid={`cart-item-total-${item._id}`} className="font-bold text-slate-900 dark:text-white text-lg">
                        ₹{item.price * item.quantity}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-full p-1">
                      <motion.div whileTap={{ scale: 0.95 }}>
                        <Button
                          data-testid={`decrease-quantity-${item._id}`}
                          aria-label="decrease-quantity"
                          onClick={() => decrementQuantity(item._id)}
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                      </motion.div>
                      <span className="w-8 text-center font-bold text-slate-900 dark:text-white text-sm">
                        {item.quantity}
                      </span>
                      <motion.div whileTap={{ scale: 0.95 }}>
                        <Button
                          data-testid={`increase-quantity-${item._id}`}
                          aria-label="increase-quantity"
                          onClick={() => incrementQuantity(item._id)}
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full bg-orange-500 hover:bg-orange-600 text-white transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </motion.div>
                    </div>

                    <motion.div whileTap={{ scale: 0.95 }}>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="bg-red-500 hover:bg-red-600 text-white rounded-full px-3 py-1 transition-all duration-300 hover:shadow-lg text-xs"
                        onClick={() => removeFromTheCart(item._id)}
                      >
                        Remove
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Mobile Total */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-4 mt-6 border border-slate-200 dark:border-slate-700"
          >
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                Total Amount
              </span>
              <span className="text-xl font-bold text-orange-600 dark:text-orange-400">
                ₹{totalAmount}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Desktop Table Layout */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="hidden sm:block bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700"
        >
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
              <TableRow className="border-slate-200 dark:border-slate-700">
                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">
                  Items
                </TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">
                  Title
                </TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">
                  Price
                </TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">
                  Quantity
                </TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">
                  Total
                </TableHead>
                <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">
                  Remove
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {cart.map((item: CartItem, index) => (
                  <motion.tr
                    key={item._id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    custom={index}
                    className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200"
                  >
                    <TableCell>
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Avatar className="w-16 h-16 border-2 border-slate-200 dark:border-slate-600">
                          <AvatarImage
                            src={item?.image || "/placeholder.svg"}
                            alt={item?.name}
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-semibold">
                            {item?.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </motion.div>
                    </TableCell>
                    <TableCell className="font-semibold text-slate-900 dark:text-white">
                      {item?.name}
                    </TableCell>
                    <TableCell className="text-slate-700 dark:text-slate-300 font-medium">
                      ₹{item?.price}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-full p-1 w-fit">
                        <motion.div whileTap={{ scale: 0.95 }}>
                          <Button
                            aria-label="decrease-quantity"
                            onClick={() => decrementQuantity(item._id)}
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        </motion.div>
                        <span className="w-8 text-center font-bold text-slate-900 dark:text-white">
                          {item.quantity}
                        </span>
                        <motion.div whileTap={{ scale: 0.95 }}>
                          <Button
                            aria-label="increase-quantity"
                            onClick={() => incrementQuantity(item._id)}
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-full bg-orange-500 hover:bg-orange-600 text-white transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-slate-900 dark:text-white">
                      ₹{item.price * item.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      <motion.div whileTap={{ scale: 0.95 }}>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="bg-red-500 hover:bg-red-600 text-white rounded-full px-4 transition-all duration-300 hover:shadow-lg"
                          onClick={() => removeFromTheCart(item._id)}
                        >
                          Remove
                        </Button>
                      </motion.div>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
            <TableFooter className="bg-slate-50 dark:bg-slate-900/50">
              <TableRow className="border-slate-200 dark:border-slate-700">
                <TableCell
                  colSpan={5}
                  className="text-lg font-bold text-slate-900 dark:text-white"
                >
                  Total Amount
                </TableCell>
                <TableCell className="text-right text-xl font-bold text-orange-600 dark:text-orange-400">
                  ₹{totalAmount}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </motion.div>

        {/* Mobile-Optimized Checkout Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center mt-6 sm:mt-8"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => setOpen(true)}
              className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              Proceed To Checkout
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </motion.div>
        </motion.div>

        <CheckoutConfirmPage open={open} setOpen={setOpen} />
      </div>
    </motion.div>
  );
};

export default Cart;
