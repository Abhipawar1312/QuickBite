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
  Home,
  Briefcase,
  Building,
  Clock,
  FileText,
  Calendar,
  Sparkles,
} from "lucide-react";
import { useUserStore, SavedAddress } from "@/store/useUserStore";
import type { CheckoutSessionRequest } from "@/types/orderType";
import { useCartStore } from "@/store/useCartStore";
import { useRestaurantStore } from "@/store/useRestaurantStore";
import { useOrderStore } from "@/store/useOrderStore";
import { MapAddressPicker } from "./MapAddressPicker";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "./ui/badge";

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
  const {
    cart,
    tipAmount,
    couponCode,
    discountAmount,
    deliveryInstructions,
    scheduledDeliveryTime,
    setDeliveryInstructions,
    setScheduledDeliveryTime,
  } = useCartStore();
  const { singleRestaurant } = useRestaurantStore();
  const { createCheckoutSession, loading } = useOrderStore();

  const [input, setInput] = useState({
    name: user?.fullname || "",
    email: user?.email || "",
    contact: user?.contact?.toString() || "",
    address: user?.address || "",
    city: user?.city || "",
    country: user?.country || "India",
    pincode: user?.pincode || "",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });

  const getAvailableSlots = () => {
    const slots: string[] = [];
    const now = new Date();
    const currentHour = now.getHours();

    // Upcoming 1-hour slots strictly for Today only (up to 11:00 PM)
    const startFromHour = Math.max(currentHour + 1, 9);
    for (let h = startFromHour; h <= 22; h += 1) {
      const startPeriod = h >= 12 ? "PM" : "AM";
      const startH = h > 12 ? h - 12 : h === 0 ? 12 : h;
      const endH = (h + 1) > 12 ? (h + 1) - 12 : (h + 1) === 12 ? 12 : (h + 1);
      const endPeriod = (h + 1) >= 12 && (h + 1) < 24 ? "PM" : "AM";
      slots.push(`Today, ${startH}:00 ${startPeriod} - ${endH}:00 ${endPeriod}`);
    }

    return slots;
  };

  const availableSlots = getAvailableSlots();
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [instructionsText, setInstructionsText] = useState<string>(deliveryInstructions || "");
  const [isScheduled, setIsScheduled] = useState<boolean>(false);
  const [scheduledSlot, setScheduledSlot] = useState<string>(availableSlots[0] || "Today, 8:00 PM - 9:00 PM");

  const [showMapPicker, setShowMapPicker] = useState(false);
  const [isLocating, setIsLocating] = useState(false);



  useEffect(() => {
    if (user) {
      setInput((prev) => ({
        ...prev,
        name: user.fullname || prev.name,
        email: user.email || prev.email,
        contact: user.contact ? user.contact.toString() : prev.contact,
        address: user.address || prev.address,
        city: user.city || prev.city,
        country: user.country || prev.country,
        pincode: user.pincode || prev.pincode,
      }));
    }
  }, [
    user?.fullname,
    user?.email,
    user?.contact,
    user?.address,
    user?.city,
    user?.country,
    user?.pincode,
  ]);



  const handleSelectSavedAddress = (addr: SavedAddress) => {
    setSelectedAddressId(addr._id || null);
    setInput((prev) => ({
      ...prev,
      address: addr.address,
      city: addr.city,
      pincode: addr.pincode || prev.pincode,
      latitude: addr.latitude,
      longitude: addr.longitude,
    }));
    if (addr.deliveryInstructions) {
      setInstructionsText(addr.deliveryInstructions);
    }
    toast.success(`Selected "${addr.label}" address`);
  };

  const handleMapConfirm = (data: {
    address: string;
    city: string;
    pincode: string;
    country: string;
    latitude: number;
    longitude: number;
  }) => {
    setSelectedAddressId(null);
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

  const changeEventHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInput({ ...input, [name]: value });
  };

  const handleInstructionChip = (text: string) => {
    setInstructionsText((prev) => (prev ? `${prev}, ${text}` : text));
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
            const countryText = data.address?.country || "India";

            setSelectedAddressId(null);
            setInput((prev) => ({
              ...prev,
              address: addressText,
              city: cityText,
              country: countryText,
              pincode: postcodeText,
              latitude,
              longitude,
            }));
            toast.success("Live location and address loaded!");
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

      setDeliveryInstructions(instructionsText);
      if (isScheduled) {
        setScheduledDeliveryTime(scheduledSlot);
      }

      const checkoutData: CheckoutSessionRequest = {
        cartItems: cart.map((cartItem) => ({
          menuId: cartItem._id,
          name: cartItem.name,
          image: cartItem.image,
          price: cartItem.price.toString(),
          quantity: cartItem.quantity.toString(),
          selectedAddOns: cartItem.selectedAddOns || [],
        })),
        deliveryDetails: input,
        restaurantId,
        tipAmount,
        couponCode,
        discountAmount,
        deliveryInstructions: instructionsText,
        scheduledDeliveryTime: isScheduled ? scheduledSlot : undefined,
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
    { name: "contact", label: "Phone (10 digits)", icon: Phone, type: "text", disabled: false },
    { name: "address", label: "Delivery Address", icon: MapPin, type: "text", disabled: false },
    { name: "city", label: "City", icon: MapPin, type: "text", disabled: false },
    { name: "country", label: "Country", icon: Globe, type: "text", disabled: false },
    { name: "pincode", label: "Pincode (6 digits)", icon: MapPin, type: "text", disabled: false },
  ];

  // Dynamic fee calculation for summary
  const foodTotal = cart.reduce((sum, item) => {
    const addOnsCost = (item.selectedAddOns || []).reduce(
      (acc, curr) => acc + Number(curr.price || 0) * (Number(curr.quantity) || 1),
      0
    );
    return sum + (item.price + addOnsCost) * item.quantity;
  }, 0);


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
  const finalDiscount = Math.min(discountAmount, foodTotal);
  const totalAmount = Math.max(0, foodTotal - finalDiscount) + deliveryFee + platformFee + tipAmount;

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (showMapPicker) return;
        setOpen(val);
      }}
    >
      <DialogContent

              className="p-0 max-w-2xl mx-auto bg-white dark:bg-slate-900 border-0 shadow-2xl rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
              onInteractOutside={(e) => {
                if (showMapPicker) e.preventDefault();
              }}
              onEscapeKeyDown={(e) => {
                if (showMapPicker) e.preventDefault();
              }}
            >
              <div className="relative">
                {/* Header */}

                <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-5 text-white">
                  <div className="text-center">
                    <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-90" />
                    <DialogTitle className="text-xl font-bold mb-1">
                      Confirm Delivery & Checkout
                    </DialogTitle>
                    <DialogDescription className="text-orange-100 text-xs">
                      Verify your delivery address, instructions, and order breakdown
                    </DialogDescription>
                  </div>
                </div>

                {/* Form */}
                <div className="p-5 sm:p-6 space-y-4">
                  <form onSubmit={checkoutHandler} className="space-y-4">
                    {/* Saved Addresses Selector (Address Book) */}
                    {user?.savedAddresses && user.savedAddresses.length > 0 && (
                      <div>
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                          Select Saved Address
                        </Label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {user.savedAddresses.map((addr) => {
                            const isSelected = selectedAddressId === addr._id;
                            const Icon = addr.label?.toLowerCase() === "work" ? Briefcase : addr.label?.toLowerCase() === "home" ? Home : Building;


                            return (
                              <div
                                key={addr._id}
                                onClick={() => handleSelectSavedAddress(addr)}
                                className={`p-3 rounded-xl border cursor-pointer transition-all ${isSelected
                                    ? "bg-orange-50 dark:bg-orange-950/40 border-orange-500 shadow-sm ring-1 ring-orange-500"
                                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                                  }`}
                              >
                                <div className="flex items-center gap-1.5 mb-1">
                                  <Icon className="w-3.5 h-3.5 text-orange-500" />
                                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                                    {addr.label}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                                  {addr.address}, {addr.city}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Location quick action */}
                    <div className="flex justify-between items-center bg-orange-50 dark:bg-orange-950/20 p-3 rounded-xl border border-orange-100 dark:border-orange-900/30">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-orange-500" />
                        <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                          Autofill with current GPS location?
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
                          "Use Current Location"
                        )}
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {formFields.map((field) => {
                        const Icon = field.icon;
                        return (
                          <div key={field.name} className="space-y-1">
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
                                className={`pl-3 ${field.name === "address" ? "pr-10" : "pr-3"} py-2 text-xs sm:text-sm rounded-xl border transition-all ${field.disabled
                                    ? "bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-60"
                                    : "bg-white dark:bg-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                                  }`}
                                placeholder={`Enter your ${field.label.toLowerCase()}`}
                              />
                              {field.name === "address" && !field.disabled && (
                                <button
                                  type="button"
                                  onClick={() => setShowMapPicker(true)}
                                  className="absolute right-2 p-1 rounded-lg bg-orange-100 hover:bg-orange-200 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400"
                                  title="Pin location on map"
                                >
                                  <MapPin className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Delivery Instructions */}
                    <div className="space-y-1.5 pt-1">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-orange-500" />
                        Delivery Instructions (Optional)
                      </Label>
                      <Input
                        type="text"
                        placeholder="e.g. Leave with security, don't ring the bell, 3rd floor"
                        value={instructionsText}
                        onChange={(e) => setInstructionsText(e.target.value)}
                        className="text-xs rounded-xl"
                      />
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {["Leave at door", "Don't ring bell", "Call on arrival", "Drop with guard"].map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => handleInstructionChip(chip)}
                            className="text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md hover:bg-orange-100 hover:text-orange-600 border border-slate-200 dark:border-slate-700 transition-colors"
                          >
                            + {chip}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Order Delivery Preference Option */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-orange-500" />
                          Delivery Preference
                        </Label>
                        {isScheduled && (
                          <Badge className="text-[10px] bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-300 border-0 font-bold">
                            Scheduled
                          </Badge>
                        )}
                      </div>

                      {/* 2 Choice Tabs: Instant vs Schedule */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setIsScheduled(false)}
                          className={`p-2.5 rounded-xl border text-left transition-all ${!isScheduled
                              ? "bg-orange-500 text-white border-orange-600 shadow-md shadow-orange-500/20 ring-1 ring-orange-500"
                              : "bg-white dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-orange-300"
                            }`}
                        >
                          <div className="flex items-center gap-1.5 text-xs font-bold">
                            <span>⚡ Instant Delivery</span>
                          </div>
                          <p className={`text-[10px] mt-0.5 ${!isScheduled ? "text-orange-100" : "text-slate-500 dark:text-slate-400"}`}>
                            ~30-40 mins standard
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (availableSlots.length === 0) {
                              toast.info("No more advance delivery slots remaining for today. Please proceed with Instant Delivery!");
                              return;
                            }
                            setIsScheduled(true);
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all ${isScheduled
                              ? "bg-orange-500 text-white border-orange-600 shadow-md shadow-orange-500/20 ring-1 ring-orange-500"
                              : "bg-white dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-orange-300"
                            }`}
                        >
                          <div className="flex items-center gap-1.5 text-xs font-bold">
                            <span>🕒 Schedule Slot</span>
                          </div>
                          <p className={`text-[10px] mt-0.5 ${isScheduled ? "text-orange-100" : "text-slate-500 dark:text-slate-400"}`}>
                            Today's time window
                          </p>
                        </button>

                      </div>

                      {/* Slot Selector (visible only when Schedule is selected) */}
                      {isScheduled && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="pt-1.5 space-y-2 border-t border-slate-200 dark:border-slate-700/60"
                        >
                          <div className="flex items-center justify-between">
                            <Label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                              Choose Delivery Window:
                            </Label>
                            <button
                              type="button"
                              onClick={() => setIsScheduled(false)}
                              className="text-[10px] font-bold text-orange-600 dark:text-orange-400 hover:underline"
                            >
                              Reset to Instant
                            </button>
                          </div>
                          <select
                            value={scheduledSlot}
                            onChange={(e) => setScheduledSlot(e.target.value)}
                            className="w-full h-9 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs px-3 font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                          >
                            {availableSlots.map((slot) => (
                              <option key={slot} value={slot}>
                                {slot}
                              </option>
                            ))}
                          </select>
                          <p className="text-[10px] text-orange-600 dark:text-orange-400 font-medium">
                            📅 Order will be prepared & delivered during: <span className="font-bold">{scheduledSlot}</span>
                          </p>
                        </motion.div>
                      )}
                    </div>


                    {/* Bill Breakdown Summary */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 space-y-1.5 border border-slate-100 dark:border-slate-800">
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-1">
                        Final Order Amount
                      </h4>
                      <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                        <span>Items Total ({cart.length} items)</span>
                        <span>₹{foodTotal}</span>
                      </div>
                      {couponCode && finalDiscount > 0 && (
                        <div className="flex justify-between text-xs text-green-600 dark:text-green-400 font-semibold">
                          <span>Coupon Discount ({couponCode})</span>
                          <span>- ₹{finalDiscount}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                        <span>Delivery Fee ({distanceKM} km)</span>
                        <span>{deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                        <span>Platform Fee</span>
                        <span>₹{platformFee}</span>
                      </div>
                      {tipAmount > 0 && (
                        <div className="flex justify-between text-xs text-orange-600 dark:text-orange-400 font-semibold">
                          <span>Rider Tip</span>
                          <span>+ ₹{tipAmount}</span>
                        </div>
                      )}
                      <div className="border-t border-slate-200 dark:border-slate-700 my-1 pt-1.5 flex justify-between font-bold text-sm text-slate-900 dark:text-white">
                        <span>Total to Pay</span>
                        <span className="text-orange-600 dark:text-orange-400 font-extrabold text-base">
                          ₹{totalAmount}
                        </span>
                      </div>
                    </div>

                    {/* Secure Delivery Handover PIN Note */}
                    <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-orange-50/80 dark:bg-orange-950/30 rounded-xl border border-orange-200/70 dark:border-orange-800/40 text-xs text-orange-800 dark:text-orange-300">
                      <span className="text-base">🔐</span>
                      <span>A 4-digit <strong>Delivery Handover PIN</strong> will be provided on your order tracking screen to share with your delivery partner.</span>
                    </div>

                    <DialogFooter className="pt-2">
                      {loading ? (
                        <Button
                          disabled
                          className="w-full bg-orange-500 text-white py-3 rounded-xl text-sm font-semibold"
                        >
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing Order...
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 rounded-xl text-sm font-bold shadow-lg hover:shadow-orange-500/20 transition-all"
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Proceed To Payment (₹{totalAmount})
                        </Button>
                      )}
                    </DialogFooter>

                  </form>
                </div>
              </div>

              <MapAddressPicker

                open={showMapPicker}
                onClose={() => setShowMapPicker(false)}
                onConfirm={handleMapConfirm}
                initialLat={input.latitude}
                initialLng={input.longitude}
              />
            </DialogContent>
          </Dialog>
  );
};

export default CheckoutConfirmPage;
