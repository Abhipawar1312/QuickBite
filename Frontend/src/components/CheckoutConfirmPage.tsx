"use client";

import type React from "react";

import {
  type Dispatch,
  type FormEvent,
  type SetStateAction,
  useEffect,
  useState,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Loader2,
  CreditCard,
  MapPin,
  User,
  Mail,
  Phone,
  Globe,
} from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import type { CheckoutSessionRequest } from "@/types/orderType";
import { useCartStore } from "@/store/useCartStore";
import { useRestaurantStore } from "@/store/useRestaurantStore";
import { useOrderStore } from "@/store/useOrderStore";
import { MapAddressPicker } from "./MapAddressPicker";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

const CheckoutConfirmPage = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const { user } = useUserStore();
  const [input, setInput] = useState({
    name: user?.fullname || "",
    email: user?.email || "",
    contact: user?.contact?.toString() || "",
    address: user?.address || "",
    city: user?.city || "",
    country: user?.country || "",
    pincode: "",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });

  const [showMapPicker, setShowMapPicker] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const handleMapConfirm = (data: {
    address: string;
    city: string;
    pincode: string;
    country: string;
    latitude: number;
    longitude: number;
  }) => {
    setInput((prev) => ({
      ...prev,
      address: data.address,
      city: data.city,
      pincode: data.pincode,
      country: data.country,
      latitude: data.latitude,
      longitude: data.longitude,
    }));
  };

  const { cart } = useCartStore();
  const { singleRestaurant } = useRestaurantStore();
  const { createCheckoutSession, loading } = useOrderStore();

  const changeEventHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInput({ ...input, [name]: value });
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          if (data) {
            const addressText = data.display_name || "";
            const cityText =
              data.address?.city ||
              data.address?.town ||
              data.address?.village ||
              data.address?.suburb ||
              "";
            const postcodeText = data.address?.postcode || "";
            const countryText = data.address?.country || "";

            setInput((prev) => ({
              ...prev,
              address: addressText,
              city: cityText,
              country: countryText,
              pincode: postcodeText,
              latitude,
              longitude,
            }));
            toast.success("Location and address successfully loaded!");
          } else {
            toast.error("Failed to retrieve address from coordinates.");
          }
        } catch (error) {
          console.error(error);
          toast.error("Failed to fetch address. Please check your internet connection.");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error(error);
        toast.error("Geolocation access denied or timed out.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const checkoutHandler = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!input.name.trim()) {
      toast.error("Name is required.");
      return;
    }
    if (!/^\d{10}$/.test(input.contact)) {
      toast.error("Contact number must be exactly 10 digits.");
      return;
    }
    if (!input.address.trim()) {
      toast.error("Address is required.");
      return;
    }
    if (!input.city.trim()) {
      toast.error("City is required.");
      return;
    }
    if (!input.country.trim()) {
      toast.error("Country is required.");
      return;
    }
    if (!/^\d{6}$/.test(input.pincode)) {
      toast.error("Pincode must be exactly 6 digits.");
      return;
    }

    try {
      const restaurantId = singleRestaurant?._id;
      if (!restaurantId) {
        toast.error("Restaurant not found. Please select a restaurant first.");
        return;
      }

      const checkoutData: CheckoutSessionRequest = {
        cartItems: cart.map((cartItem) => ({
          menuId: cartItem._id,
          name: cartItem.name,
          image: cartItem.image,
          price: cartItem.price.toString(),
          quantity: cartItem.quantity.toString(),
        })),
        deliveryDetails: input,
        restaurantId,
      };

      await createCheckoutSession(checkoutData);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong while creating checkout session.");
    }
  };

  const formFields = [
    { name: "name", label: "Full Name", icon: User, type: "text", disabled: false },
    { name: "email", label: "Email", icon: Mail, type: "email", disabled: true },
    { name: "contact", label: "Contact Phone (10 digits)", icon: Phone, type: "text", disabled: false },
    { name: "address", label: "Address", icon: MapPin, type: "text", disabled: false },
    { name: "city", label: "City", icon: MapPin, type: "text", disabled: false },
    { name: "country", label: "Country", icon: Globe, type: "text", disabled: false },
    { name: "pincode", label: "Pincode (6 digits)", icon: MapPin, type: "text", disabled: false },
  ];

  // Dynamic fee calculation for summary
  const foodTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  let distanceKM = 2.5;
  const restCoords = singleRestaurant?.location?.coordinates;
  if (
    input.latitude &&
    input.longitude &&
    restCoords &&
    restCoords.length === 2 &&
    restCoords[0] !== 0
  ) {
    distanceKM = calculateDistance(
      input.latitude,
      input.longitude,
      restCoords[1],
      restCoords[0]
    );
  }
  let deliveryFee = 0;
  if (distanceKM > 2 && distanceKM <= 5) {
    deliveryFee = 25;
  } else if (distanceKM > 5) {
    deliveryFee = 25 + Math.round((distanceKM - 5) * 8);
  }
  const platformFee = 5;
  const totalAmount = foodTotal + deliveryFee + platformFee;

  return (
    <>
      {/* Checkout Dialog */}
      <AnimatePresence>
        {open && (
          <Dialog
            open={open}
            onOpenChange={(val) => {
              // Don't close the checkout dialog if the map picker is open
              if (showMapPicker) return;
              setOpen(val);
            }}
          >
            <DialogContent
              className="p-0 max-w-2xl mx-auto bg-white dark:bg-slate-900 border-0 shadow-2xl rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
              onInteractOutside={(e) => {
                // Prevent closing when map picker overlay is clicked
                if (showMapPicker) e.preventDefault();
              }}
              onEscapeKeyDown={(e) => {
                // Prevent ESC from closing checkout when map picker is open
                if (showMapPicker) e.preventDefault();
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
                className="relative"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-center"
                  >
                    <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-90" />
                    <DialogTitle className="text-xl font-bold mb-1">
                      Review Your Order
                    </DialogTitle>
                    <DialogDescription className="text-orange-100 text-xs">
                      Confirm your delivery details before proceeding to payment
                    </DialogDescription>
                  </motion.div>
                </div>

                {/* Form */}
                <div className="p-6">
                  <form onSubmit={checkoutHandler} className="space-y-4">
                    {/* Location quick action */}
                    <div className="flex justify-between items-center bg-orange-50 dark:bg-orange-950/20 p-3 rounded-xl border border-orange-100 dark:border-orange-900/30">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-orange-500" />
                        <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                          Autofill with your live location?
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleUseCurrentLocation}
                        disabled={isLocating}
                        className="bg-white dark:bg-slate-800 text-orange-500 border-orange-200 hover:bg-orange-50 text-xs sm:text-sm h-8 rounded-lg"
                      >
                        {isLocating ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                            Locating...
                          </>
                        ) : (
                          "Use Current Address"
                        )}
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {formFields.map((field, index) => {
                        const Icon = field.icon;
                        return (
                          <motion.div
                            key={field.name}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 + index * 0.03 }}
                            className="space-y-1"
                          >
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                              <Icon className="w-3.5 h-3.5 text-orange-500" />
                              {field.label}
                            </Label>
                            <div className="relative flex items-center">
                              <Input
                                type={field.type}
                                name={field.name}
                                value={input[field.name as keyof typeof input] ?? ""}
                                onChange={changeEventHandler}
                                disabled={field.disabled}
                                className={`pl-3 ${field.name === "address" ? "pr-10" : "pr-3"} py-2 text-sm rounded-xl border-2 transition-all duration-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-800 w-full ${
                                  field.disabled
                                    ? "bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-60"
                                    : "bg-white dark:bg-slate-800 hover:border-orange-300"
                                }`}
                                placeholder={`Enter your ${field.label.toLowerCase()}`}
                              />
                              {field.name === "address" && !field.disabled && (
                                <button
                                  type="button"
                                  onClick={() => setShowMapPicker(true)}
                                  className="absolute right-2.5 p-1 rounded-lg bg-orange-100 hover:bg-orange-200 dark:bg-orange-950/40 dark:hover:bg-orange-900/60 text-orange-600 dark:text-orange-400 transition-colors duration-200"
                                  title="Pin location on map"
                                >
                                  <MapPin className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Summary row */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                      className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-2 border border-slate-100 dark:border-slate-800 mt-2"
                    >
                      <h4 className="font-semibold text-slate-900 dark:text-white text-xs mb-1 uppercase tracking-wider">
                        Order Summary
                      </h4>
                      <div className="flex justify-between text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                        <span>Subtotal ({cart.length} items)</span>
                        <span>₹{foodTotal}</span>
                      </div>
                      <div className="flex justify-between text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                        <span>
                          Delivery Fee{" "}
                          {input.latitude &&
                            input.longitude &&
                            `(${distanceKM} km)`}
                        </span>
                        <span>
                          {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                        <span>Platform Fee</span>
                        <span>₹{platformFee}</span>
                      </div>
                      <div className="border-t border-slate-200 dark:border-slate-700 my-1 pt-1.5 flex justify-between font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                        <span>Total Amount</span>
                        <span className="text-orange-600 dark:text-orange-400">
                          ₹{totalAmount}
                        </span>
                      </div>
                    </motion.div>

                    <DialogFooter className="pt-4">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="w-full"
                      >
                        {loading ? (
                          <Button
                            disabled
                            className="w-full bg-orange-500 hover:bg-orange-500 text-white py-3 rounded-xl text-base font-semibold"
                          >
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </Button>
                        ) : (
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button
                              type="submit"
                              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 rounded-xl text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                              <CreditCard className="w-4 h-4 mr-2" />
                              Continue To Payment
                            </Button>
                          </motion.div>
                        )}
                      </motion.div>
                    </DialogFooter>
                  </form>
                </div>
              </motion.div>

              {/* MapAddressPicker rendered INSIDE the DialogContent so pointer events (dragging/clicking) are not blocked */}
              <MapAddressPicker
                open={showMapPicker}
                onClose={() => setShowMapPicker(false)}
                onConfirm={handleMapConfirm}
                initialLat={input.latitude}
                initialLng={input.longitude}
              />
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  );
};

export default CheckoutConfirmPage;
