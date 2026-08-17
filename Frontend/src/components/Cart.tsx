import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag, Heart, Check, Sparkles, X, Gift, SlidersHorizontal, Edit3 } from "lucide-react";
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
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CheckoutConfirmPage from "./CheckoutConfirmPage";

import { useCartStore } from "@/store/useCartStore";
import { useRestaurantStore } from "@/store/useRestaurantStore";
import { useCouponStore } from "@/store/useCouponStore";
import type { CartItem } from "@/types/cartType";
import type { MenuAddOn } from "@/types/restaurantType";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Checkbox } from "./ui/checkbox";
import { toast } from "sonner";
import { SmartRecommendations } from "./SmartRecommendations";


const Cart = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState<boolean>(false);

  const [couponInput, setCouponInput] = useState<string>("");
  const [showCouponsDrawer, setShowCouponsDrawer] = useState<boolean>(false);
  const [customTipInput, setCustomTipInput] = useState<string>("");
  const [showCustomTip, setShowCustomTip] = useState<boolean>(false);

  // Add-on customization modal state
  const [customizingItem, setCustomizingItem] = useState<{
    item: CartItem;
    itemKey: string;
    availableAddOns: MenuAddOn[];
  } | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<MenuAddOn[]>([]);

  const {
    cart,
    restaurantId,
    restaurantName,
    tipAmount,
    couponCode,
    discountAmount,
    incrementQuantity,
    decrementQuantity,
    clearCart,
    removeFromTheCart,
    removeAddOnFromCartItem,
    updateCartItemAddOns,
    setTipAmount,
    setCoupon,
    clearCoupon,
  } = useCartStore();



  const { singleRestaurant } = useRestaurantStore();
  const { activeCoupons, getActiveCoupons, applyCoupon } = useCouponStore();

  useEffect(() => {
    getActiveCoupons();
  }, [getActiveCoupons]);

  const foodSubtotal = cart.reduce((acc, ele) => {
    const addOnsCost = (ele.selectedAddOns || []).reduce(
      (sum, a) => sum + Number(a.price || 0) * (Number(a.quantity) || 1),
      0
    );
    return acc + (ele.price + addOnsCost) * ele.quantity;
  }, 0);

  const finalDiscount = Math.min(discountAmount, foodSubtotal);
  const discountedSubtotal = Math.max(0, foodSubtotal - finalDiscount);
  const deliveryFee = 25;
  const platformFee = 5;
  const grandTotal = discountedSubtotal + deliveryFee + platformFee + tipAmount;

  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || couponInput).trim();
    if (!code) {
      toast.error("Please enter a coupon code");
      return;
    }

    const res = await applyCoupon(code, foodSubtotal);
    if (res.success && res.discountAmount !== undefined) {
      setCoupon(code.toUpperCase(), res.discountAmount);
      setCouponInput("");
      setShowCouponsDrawer(false);
    }
  };

  const handleTipSelect = (amount: number) => {
    setShowCustomTip(false);
    setCustomTipInput("");
    if (tipAmount === amount) {
      setTipAmount(0); // Toggle off
    } else {
      setTipAmount(amount);
      toast.success(`₹${amount} tip added for your delivery partner! 🛵`);
    }
  };

  const handleCustomTipSubmit = () => {
    const val = Number(customTipInput);
    if (isNaN(val) || val <= 0) {
      toast.error("Please enter a valid tip amount");
      return;
    }
    setTipAmount(val);
    setShowCustomTip(false);
    setCustomTipInput("");
    toast.success(`₹${val} tip added for your delivery partner! 🛵`);
  };

  const handleOpenCustomizeModal = (
    item: CartItem,
    itemKey: string,
    availableAddOns: MenuAddOn[]
  ) => {
    setCustomizingItem({ item, itemKey, availableAddOns });
    setSelectedAddOns(item.selectedAddOns || []);
  };

  const incrementAddOnInModal = (addon: MenuAddOn) => {
    setSelectedAddOns((prev) => {
      const existing = prev.find((a) => a.name === addon.name);
      if (existing) {
        return prev.map((a) =>
          a.name === addon.name ? { ...a, quantity: (a.quantity || 1) + 1 } : a
        );
      } else {
        return [...prev, { ...addon, quantity: 1 }];
      }
    });
  };

  const decrementAddOnInModal = (addon: MenuAddOn) => {
    setSelectedAddOns((prev) => {
      const existing = prev.find((a) => a.name === addon.name);
      if (!existing) return prev;
      if ((existing.quantity || 1) <= 1) {
        return prev.filter((a) => a.name !== addon.name);
      } else {
        return prev.map((a) =>
          a.name === addon.name ? { ...a, quantity: (a.quantity || 1) - 1 } : a
        );
      }
    });
  };

  const handleSaveAddOns = () => {
    if (!customizingItem) return;
    updateCartItemAddOns(customizingItem.itemKey, selectedAddOns);
    toast.success(`Updated add-ons for ${customizingItem.item.name}!`);
    setCustomizingItem(null);
  };



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
          Looks like you haven't added any dishes to your cart yet. Explore our restaurant menus!
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Button
            onClick={() => navigate("/search/all")}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base"
          >
            Explore Restaurants
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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-6 sm:mb-8"
      >
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-2">
          Your Order Cart
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
          {restaurantName ? `Ordering from ${restaurantName}` : "Review items before checkout"}
        </p>
      </motion.div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left Column: Cart Items Table / Cards */}
        <div className="lg:col-span-2 space-y-4">
          {singleRestaurant && singleRestaurant.isOpen === false && (
            <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 p-4 rounded-r-xl animate-pulse">
              <div className="flex items-center gap-3">
                <span className="text-red-500 font-bold">⚠️ Warning:</span>
                <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                  This restaurant is currently closed. You cannot place orders right now.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center bg-white dark:bg-slate-800 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} Items in Cart
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCart}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs font-semibold px-2.5 h-8"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Clear Cart
            </Button>
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                <TableRow className="border-slate-200 dark:border-slate-700">
                  <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Item</TableHead>
                  <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Price</TableHead>
                  <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Quantity</TableHead>
                  <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Total</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">Remove</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {cart.map((item: CartItem, index) => {
                    const itemKey = item.cartItemId || item._id;
                    const addOnsCost = (item.selectedAddOns || []).reduce(
                      (sum, a) => sum + Number(a.price || 0) * (Number(a.quantity) || 1),
                      0
                    );
                    const itemPrice = item.price + addOnsCost;
                    const availableAddOns =
                      singleRestaurant?.menus?.find((m) => m._id === item._id)?.addOns ||
                      item.addOns ||
                      item.selectedAddOns ||
                      [];

                    return (
                      <motion.tr
                        key={itemKey}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        custom={index}
                        className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-14 h-14 rounded-xl border border-slate-200 dark:border-slate-700">
                              <AvatarImage src={item?.image || "/placeholder.svg"} alt={item?.name} className="object-cover" />
                              <AvatarFallback className="bg-orange-100 text-orange-600 font-bold">
                                {item?.name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${item.isVeg !== false ? "bg-green-500" : "bg-red-500"}`} />
                                <span className="font-bold text-slate-900 dark:text-white text-sm">{item?.name}</span>
                              </div>

                              {/* Selected Add-ons with quick remove tags */}
                              {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                  {item.selectedAddOns.map((addOn) => (
                                    <span
                                      key={addOn.name}
                                      className="inline-flex items-center gap-1 text-[11px] font-semibold bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-md border border-orange-200 dark:border-orange-800 shadow-2xs"
                                    >
                                      <span>+{(addOn.quantity && addOn.quantity > 1) ? `${addOn.quantity}x ` : ""}{addOn.name} (₹{addOn.price * (addOn.quantity || 1)})</span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeAddOnFromCartItem(itemKey, addOn.name);
                                          toast.info(`Removed "${addOn.name}" from ${item.name}`);
                                        }}
                                        className="w-3.5 h-3.5 rounded-full hover:bg-orange-200 dark:hover:bg-orange-800 text-orange-700 dark:text-orange-300 flex items-center justify-center transition-colors ml-0.5 cursor-pointer"
                                        title={`Remove ${addOn.name}`}
                                      >
                                        <X className="w-2.5 h-2.5" />
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Add / Edit Add-ons Trigger */}
                              {availableAddOns.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenCustomizeModal(item, itemKey, availableAddOns)}
                                  className="text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 underline flex items-center gap-1 mt-1 cursor-pointer"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>{item.selectedAddOns && item.selectedAddOns.length > 0 ? "Edit / Add More Add-ons" : "+ Add Add-ons / Customize"}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-700 dark:text-slate-300 font-medium text-sm">
                          ₹{itemPrice}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-full p-1 w-fit">
                            <Button
                              onClick={() => decrementQuantity(itemKey)}
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-6 text-center font-bold text-slate-900 dark:text-white text-xs">
                              {item.quantity}
                            </span>
                            <Button
                              onClick={() => incrementQuantity(itemKey)}
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 rounded-full bg-orange-500 hover:bg-orange-600 text-white"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-slate-900 dark:text-white text-sm">
                          ₹{itemPrice * item.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="destructive"
                            className="bg-red-500 hover:bg-red-600 text-white rounded-full px-3 py-1 text-xs"
                            onClick={() => removeFromTheCart(itemKey)}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card Layout */}
          <div className="block sm:hidden space-y-3">
            <AnimatePresence>
              {cart.map((item: CartItem, index) => {
                const itemKey = item.cartItemId || item._id;
                const addOnsCost = (item.selectedAddOns || []).reduce(
                  (sum, a) => sum + Number(a.price || 0) * (Number(a.quantity) || 1),
                  0
                );
                const itemPrice = item.price + addOnsCost;
                const availableAddOns =
                  singleRestaurant?.menus?.find((m) => m._id === item._id)?.addOns ||
                  item.addOns ||
                  item.selectedAddOns ||
                  [];

                return (
                  <motion.div
                    key={itemKey}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    custom={index}
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-4 border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="w-16 h-16 rounded-xl border border-slate-200 dark:border-slate-700">
                        <AvatarImage src={item?.image || "/placeholder.svg"} alt={item?.name} className="object-cover" />
                        <AvatarFallback className="bg-orange-100 text-orange-600 font-bold">
                          {item?.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${item.isVeg !== false ? "bg-green-500" : "bg-red-500"}`} />
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">{item?.name}</h4>
                        </div>

                        {/* Selected Add-ons with quick remove tags */}
                        {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            {item.selectedAddOns.map((addOn) => (
                              <span
                                key={addOn.name}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-md border border-orange-200 dark:border-orange-800 shadow-2xs"
                              >
                                <span>+{(addOn.quantity && addOn.quantity > 1) ? `${addOn.quantity}x ` : ""}{addOn.name} (₹{addOn.price * (addOn.quantity || 1)})</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeAddOnFromCartItem(itemKey, addOn.name);
                                    toast.info(`Removed "${addOn.name}" from ${item.name}`);
                                  }}
                                  className="w-3.5 h-3.5 rounded-full hover:bg-orange-200 dark:hover:bg-orange-800 text-orange-700 dark:text-orange-300 flex items-center justify-center transition-colors ml-0.5 cursor-pointer"
                                  title={`Remove ${addOn.name}`}
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}


                        {/* Add / Edit Add-ons Trigger */}
                        {availableAddOns.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleOpenCustomizeModal(item, itemKey, availableAddOns)}
                            className="text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 underline flex items-center gap-1 mt-1 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>{item.selectedAddOns && item.selectedAddOns.length > 0 ? "Edit / Add More Add-ons" : "+ Add Add-ons / Customize"}</span>
                          </button>
                        )}

                        <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                          ₹{itemPrice * item.quantity}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-full p-1">
                        <Button
                          onClick={() => decrementQuantity(itemKey)}
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-6 text-center font-bold text-slate-900 dark:text-white text-xs">
                          {item.quantity}
                        </span>
                        <Button
                          onClick={() => incrementQuantity(itemKey)}
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 rounded-full bg-orange-500 hover:bg-orange-600 text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="bg-red-500 hover:bg-red-600 text-white rounded-full px-3 py-1 text-xs"
                        onClick={() => removeFromTheCart(itemKey)}
                      >
                        Remove
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>


          {/* Smart AI Recommendations: Frequently Paired with items in cart */}
          {restaurantId && cart.length > 0 && (
            <SmartRecommendations
              variant="paired"
              restaurantId={restaurantId}
              menuId={cart[0]?._id}
              excludeIds={cart.map((item) => item._id)}
              title="🔥 Complete Your Meal (Frequently Paired)"
              className="my-6"
            />
          )}


          {/* Delivery Partner Tip Card */}

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-red-500 fill-red-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Tip Your Delivery Partner
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              100% of your tip goes directly to your rider to appreciate their hard work & fast delivery.
            </p>

            <div className="flex flex-wrap items-center gap-2">
              {[10, 20, 30, 50].map((amt) => (
                <button
                  key={amt}
                  onClick={() => handleTipSelect(amt)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    tipAmount === amt
                      ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20 scale-105"
                      : "bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-orange-400"
                  }`}
                >
                  ₹{amt}
                </button>
              ))}

              <button
                onClick={() => setShowCustomTip(!showCustomTip)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  showCustomTip || (tipAmount > 0 && ![10, 20, 30, 50].includes(tipAmount))
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600"
                }`}
              >
                Custom {tipAmount > 0 && ![10, 20, 30, 50].includes(tipAmount) ? `(₹${tipAmount})` : ""}
              </button>

              {tipAmount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTipAmount(0)}
                  className="text-red-500 hover:text-red-600 text-xs h-8 px-2"
                >
                  Remove Tip
                </Button>
              )}
            </div>

            {showCustomTip && (
              <div className="flex items-center gap-2 mt-3 max-w-xs">
                <Input
                  type="number"
                  placeholder="Enter tip (₹)"
                  value={customTipInput}
                  onChange={(e) => setCustomTipInput(e.target.value)}
                  className="text-xs h-9 rounded-xl"
                />
                <Button
                  onClick={handleCustomTipSubmit}
                  className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-9 rounded-xl font-bold"
                >
                  Add
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Coupons & Bill Summary */}
        <div className="space-y-4">
          {/* Promo Coupon Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Apply Promo Code
                </h3>
              </div>
              {activeCoupons.filter((c) => !c.isUsed).length > 0 && (
                <button
                  onClick={() => setShowCouponsDrawer(!showCouponsDrawer)}
                  className="text-xs text-orange-600 dark:text-orange-400 font-bold hover:underline"
                >
                  {showCouponsDrawer ? "Hide Offers" : "View Offers"}
                </button>
              )}
            </div>


            {couponCode ? (
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 border border-green-500/50 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                  <div>
                    <span className="text-xs font-bold text-green-700 dark:text-green-300">
                      {couponCode} Applied!
                    </span>
                    <p className="text-[11px] text-green-600 dark:text-green-400">
                      You are saving ₹{finalDiscount}
                    </p>
                  </div>
                </div>
                <button
                  onClick={clearCoupon}
                  className="p-1 rounded-full hover:bg-green-200 dark:hover:bg-green-900 text-green-700 dark:text-green-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Enter code (e.g. QUICK50)"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  className="uppercase text-xs font-bold tracking-wider h-10 rounded-xl"
                />
                <Button
                  onClick={() => handleApplyCoupon()}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs h-10 rounded-xl px-4"
                >
                  Apply
                </Button>
              </div>
            )}

            {/* Active Coupons Drawer List */}
            {showCouponsDrawer && activeCoupons.filter((c) => !c.isUsed).length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2.5 max-h-56 overflow-y-auto">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Available Coupons
                </span>
                {activeCoupons
                  .filter((c) => !c.isUsed)
                  .map((c) => (
                    <div
                      key={c._id}
                      className="p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 hover:border-orange-300 dark:hover:border-orange-700"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 text-[10px] font-extrabold px-1.5 py-0.5">
                            {c.code}
                          </Badge>
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {c.discountType === "percentage" ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {c.description || `Min. order ₹${c.minOrderValue}`}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleApplyCoupon(c.code)}
                        className="h-7 text-xs bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg px-2.5"
                      >
                        Apply
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </div>


          {/* Bill Breakdown Summary Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
              Bill Summary
            </h3>

            <div className="flex justify-between text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              <span>Item Subtotal</span>
              <span className="font-semibold text-slate-900 dark:text-white">₹{foodSubtotal}</span>
            </div>

            {couponCode && finalDiscount > 0 && (
              <div className="flex justify-between text-xs sm:text-sm text-green-600 dark:text-green-400 font-semibold">
                <span>Coupon Discount ({couponCode})</span>
                <span>- ₹{finalDiscount}</span>
              </div>
            )}

            <div className="flex justify-between text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              <span>Delivery Fee</span>
              <span className="font-semibold text-slate-900 dark:text-white">₹{deliveryFee}</span>
            </div>

            <div className="flex justify-between text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              <span>Platform Fee</span>
              <span className="font-semibold text-slate-900 dark:text-white">₹{platformFee}</span>
            </div>

            {tipAmount > 0 && (
              <div className="flex justify-between text-xs sm:text-sm text-orange-600 dark:text-orange-400 font-semibold">
                <span>Rider Tip</span>
                <span>+ ₹{tipAmount}</span>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center font-bold text-base sm:text-lg text-slate-900 dark:text-white">
              <span>To Pay</span>
              <span className="text-xl font-extrabold text-orange-600 dark:text-orange-400">
                ₹{grandTotal}
              </span>
            </div>

            <Button
              onClick={() => setOpen(true)}
              disabled={singleRestaurant?.isOpen === false}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3.5 rounded-xl text-base font-bold shadow-lg hover:shadow-orange-500/20 transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {singleRestaurant?.isOpen === false ? "Restaurant Closed" : `Checkout • ₹${grandTotal}`}
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>

        <CheckoutConfirmPage open={open} setOpen={setOpen} />


        {/* In-Cart Add-on Customization Modal */}
        <Dialog open={!!customizingItem} onOpenChange={(isOpen) => !isOpen && setCustomizingItem(null)}>
          <DialogContent className="sm:max-w-md bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                <SlidersHorizontal className="w-4 h-4 text-orange-500" />
                <span>Customize Add-ons for {customizingItem?.item.name}</span>
              </DialogTitle>
            </DialogHeader>

            <div className="py-3 space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select or deselect add-ons to update this item in your cart:
              </p>

              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {customizingItem?.availableAddOns.map((addon) => {
                  const selected = selectedAddOns.find((a) => a.name === addon.name);
                  const qty = selected?.quantity || 0;
                  const isSelected = qty > 0;

                  return (
                    <div
                      key={addon.name}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        isSelected
                          ? "bg-orange-50/80 dark:bg-orange-950/30 border-orange-500 shadow-xs"
                          : "bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">
                          {addon.name}
                        </span>
                        <span className="text-xs text-orange-600 dark:text-orange-400 font-bold">
                          +₹{addon.price} each {qty > 1 ? `(₹${addon.price * qty} total)` : ""}
                        </span>
                      </div>

                      {isSelected ? (
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-orange-300 dark:border-orange-700 rounded-full p-1 shadow-xs">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => decrementAddOnInModal(addon)}
                            className="h-6 w-6 rounded-full hover:bg-orange-100 dark:hover:bg-slate-700 text-orange-600"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-5 text-center font-extrabold text-xs text-slate-900 dark:text-white">
                            {qty}
                          </span>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => incrementAddOnInModal(addon)}
                            className="h-6 w-6 rounded-full bg-orange-500 hover:bg-orange-600 text-white"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => incrementAddOnInModal(addon)}
                          className="h-8 text-xs font-bold bg-white dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-300 dark:border-orange-600 rounded-lg px-3"
                        >
                          <Plus className="w-3 h-3 mr-1" /> Add
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Item Price (with add-ons):</span>
                <span className="text-xl font-extrabold text-orange-600 dark:text-orange-400">
                  ₹{((customizingItem?.item.price || 0) + selectedAddOns.reduce((sum, a) => sum + Number(a.price || 0) * (Number(a.quantity) || 1), 0))}
                </span>
              </div>

            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setCustomizingItem(null)}
                className="rounded-xl border-slate-300 dark:border-slate-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveAddOns}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl"
              >
                Save & Update Cart
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </motion.div>
  );
};


export default Cart;
