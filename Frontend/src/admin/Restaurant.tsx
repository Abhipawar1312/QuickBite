// Updated Restaurant component
"use client";

import type React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type RestaurantFormSchema,
  restaurantFromSchema,
} from "@/schema/RestaurantSchema";
import { isRestaurantCurrentlyOpen, formatTimeTo12Hr } from "@/lib/operatingHours";

import { useRestaurantStore } from "@/store/useRestaurantStore";

import { MapAddressPicker } from "@/components/MapAddressPicker";
import {
  Loader2,
  Store,
  MapPin,
  Globe,
  Clock,
  ChefHat,
  ImageIcon,
  Phone,
  Power,
  AlertTriangle,
} from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { motion } from "framer-motion";

const TIME_OPTIONS = [
  { value: "00:00", label: "12:00 AM (Midnight)" },
  { value: "00:30", label: "12:30 AM" },
  { value: "01:00", label: "01:00 AM" },
  { value: "01:30", label: "01:30 AM" },
  { value: "02:00", label: "02:00 AM" },
  { value: "02:30", label: "02:30 AM" },
  { value: "03:00", label: "03:00 AM" },
  { value: "03:30", label: "03:30 AM" },
  { value: "04:00", label: "04:00 AM" },
  { value: "04:30", label: "04:30 AM" },
  { value: "05:00", label: "05:00 AM" },
  { value: "05:30", label: "05:30 AM" },
  { value: "06:00", label: "06:00 AM" },
  { value: "06:30", label: "06:30 AM" },
  { value: "07:00", label: "07:00 AM" },
  { value: "07:30", label: "07:30 AM" },
  { value: "08:00", label: "08:00 AM" },
  { value: "08:30", label: "08:30 AM" },
  { value: "09:00", label: "09:00 AM" },
  { value: "09:30", label: "09:30 AM" },
  { value: "10:00", label: "10:00 AM" },
  { value: "10:30", label: "10:30 AM" },
  { value: "11:00", label: "11:00 AM" },
  { value: "11:30", label: "11:30 AM" },
  { value: "12:00", label: "12:00 PM (Noon)" },
  { value: "12:30", label: "12:30 PM" },
  { value: "13:00", label: "01:00 PM" },
  { value: "13:30", label: "01:30 PM" },
  { value: "14:00", label: "02:00 PM" },
  { value: "14:30", label: "02:30 PM" },
  { value: "15:00", label: "03:00 PM" },
  { value: "15:30", label: "03:30 PM" },
  { value: "16:00", label: "04:00 PM" },
  { value: "16:30", label: "04:30 PM" },
  { value: "17:00", label: "05:00 PM" },
  { value: "17:30", label: "05:30 PM" },
  { value: "18:00", label: "06:00 PM" },
  { value: "18:30", label: "06:30 PM" },
  { value: "19:00", label: "07:00 PM" },
  { value: "19:30", label: "07:30 PM" },
  { value: "20:00", label: "08:00 PM" },
  { value: "20:30", label: "08:30 PM" },
  { value: "21:00", label: "09:00 PM" },
  { value: "21:30", label: "09:30 PM" },
  { value: "22:00", label: "10:00 PM" },
  { value: "22:30", label: "10:30 PM" },
  { value: "23:00", label: "11:00 PM" },
  { value: "23:30", label: "11:30 PM" },
];

const Restaurant = () => {

  const {
    loading,
    restaurant,
    getRestaurant,
    createRestaurant,
    updateRestaurant,
    updateOutletStatus,
    clearRestaurantData,
  } = useRestaurantStore();

  const DEFAULT_RUSH_MESSAGE =
    "The kitchen is experiencing high demand. Orders are temporarily paused — please try again in 15–30 minutes.";

  const [isOpen, setIsOpen] = useState(true);

  const [isKitchenBusy, setIsKitchenBusy] = useState(false);
  const [rushMessage, setRushMessage] = useState(DEFAULT_RUSH_MESSAGE);
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("23:30");



  const [showMapPicker, setShowMapPicker] = useState(false);
  const [input, setInput] = useState<RestaurantFormSchema>({
    restaurantName: "",
    city: "",
    country: "",
    address: "",
    deliveryTime: 0,
    cuisines: [],
    contactNumber: "",
    imageFile: undefined,
    latitude: undefined,
    longitude: undefined,
  });
  const [errors, setErrors] = useState<Partial<RestaurantFormSchema>>({});

  const changeEventHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setInput({ ...input, [name]: type === "number" ? Number(value) : value });
  };

  const submitHandler = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const result = restaurantFromSchema.safeParse(input);
    if (!result.success) {
      const fieldErrors = result.error.formErrors.fieldErrors;
      setErrors(fieldErrors as Partial<RestaurantFormSchema>);
      return;
    }
    try {
      const formData = new FormData();
      formData.append("restaurantName", input.restaurantName);
      formData.append("city", input.city);
      formData.append("country", input.country);
      formData.append("address", input.address);
      formData.append("deliveryTime", input.deliveryTime.toString());
      formData.append("cuisines", JSON.stringify(input.cuisines));
      formData.append("contactNumber", input.contactNumber);
      
      if (input.latitude !== undefined && input.longitude !== undefined) {
        formData.append("latitude", input.latitude.toString());
        formData.append("longitude", input.longitude.toString());
      }

      if (input.imageFile) {
        formData.append("imageFile", input.imageFile);
      }
      
      if (restaurant) {
        await updateRestaurant(formData);
      } else {
        await createRestaurant(formData);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    // Clear any cached data first to ensure fresh data for new admin
    clearRestaurantData();

    const fetchRestaurant = async () => {
      await getRestaurant();
    };

    fetchRestaurant();
  }, []); // Remove restaurant dependency to avoid infinite loop

  // Separate useEffect to update form when restaurant data changes
  useEffect(() => {
    if (restaurant) {
      setInput({
        restaurantName: restaurant.restaurantName || "",
        city: restaurant.city || "",
        country: restaurant.country || "",
        address: restaurant.address || "",
        deliveryTime: restaurant.deliveryTime || 0,
        cuisines: restaurant.cuisines
          ? restaurant.cuisines.map((cuisine: string) => cuisine)
          : [],
        contactNumber: restaurant.contactNumber || "",
        imageFile: undefined,
        latitude: restaurant.location?.coordinates?.[1],
        longitude: restaurant.location?.coordinates?.[0],
      });

      // Handle location coordinates
      const coords = restaurant.location?.coordinates;
      if (coords && coords.length === 2 && coords[0] !== 0 && coords[1] !== 0) {
        setInput((prev) => ({
          ...prev,
          longitude: coords[0],
          latitude: coords[1],
        }));
      }

      setIsOpen(restaurant.isOpen ?? true);
      setIsKitchenBusy(restaurant.isKitchenBusy ?? false);
      const effectiveRushMessage =
        restaurant.rushModeMessage &&
        restaurant.rushModeMessage !== "Experiencing high demand. Orders temporarily paused." &&
        restaurant.rushModeMessage !== "High demand. New orders paused."
          ? restaurant.rushModeMessage
          : DEFAULT_RUSH_MESSAGE;
      setRushMessage(effectiveRushMessage);
      setOpenTime(restaurant.operatingHours?.openTime || "09:00");
      setCloseTime(restaurant.operatingHours?.closeTime || "23:30");

    } else {
      // Reset form if no restaurant
      setInput({
        restaurantName: "",
        city: "",
        country: "",
        address: "",
        deliveryTime: 0,
        cuisines: [],
        contactNumber: "",
        imageFile: undefined,
        latitude: undefined,
        longitude: undefined,
      });
    }
  }, [restaurant]);

  const handleSaveOutletControls = async () => {
    await updateOutletStatus({
      isOpen,
      isKitchenBusy,
      rushModeMessage: rushMessage,
      operatingHours: { openTime, closeTime },
    });
  };

  const formFields = [
    {
      name: "restaurantName",
      label: "Restaurant Name",
      icon: Store,
      placeholder: "Enter your restaurant name",
    },
    {
      name: "contactNumber",
      label: "Contact Number",
      icon: Phone,
      placeholder: "Enter restaurant contact number",
    },
    {
      name: "address",
      label: "Address",
      icon: MapPin,
      placeholder: "Enter restaurant address or pin it below",
    },
    {
      name: "city",
      label: "City",
      icon: MapPin,
      placeholder: "Enter your city name",
    },
    {
      name: "country",
      label: "Country",
      icon: Globe,
      placeholder: "Enter your country name",
    },
    {
      name: "deliveryTime",
      label: "Delivery Time (minutes)",
      icon: Clock,
      placeholder: "Enter delivery time",
      type: "number",
    },
  ];

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
      country: data.country,
      latitude: data.latitude,
      longitude: data.longitude,
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8 px-4"
    >
      {/* Rest of your component remains the same */}
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-12"
        >
          <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Store className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-4">
            {restaurant ? "Update Restaurant" : "Add Restaurant"}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            {restaurant
              ? "Update your restaurant information"
              : "Set up your restaurant profile to get started"}
          </p>
        </motion.div>

        {/* Outlet Live Status & Rush Mode Controls (If restaurant exists) */}
        {restaurant && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl space-y-6"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Power className="w-5 h-5 text-orange-500" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Outlet Status & Operating Hours
                </h3>
              </div>
              {(() => {
                const status = isRestaurantCurrentlyOpen({
                  isOpen,
                  operatingHours: { openTime, closeTime },
                });
                if (!status.isOpen) {
                  return (
                    <Badge className="bg-red-500 text-white font-bold">
                      ● Closed (Operating Hours: {formatTimeTo12Hr(openTime)} – {formatTimeTo12Hr(closeTime)})
                    </Badge>
                  );
                }
                if (isKitchenBusy) {
                  return (
                    <Badge className="bg-amber-500 text-white font-bold">
                      ● Kitchen Busy (Orders Paused)
                    </Badge>
                  );
                }
                return (
                  <Badge className="bg-green-500 text-white font-bold">
                    ● Accepting Orders
                  </Badge>
                );
              })()}

            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Open / Close Switch */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <Label className="font-bold text-sm text-slate-800 dark:text-slate-200">Outlet Open Status</Label>
                  <p className="text-xs text-slate-500 mt-0.5">Toggle to instantly open or close store for customer orders</p>
                </div>
                <Switch
                  checked={isOpen}
                  onCheckedChange={(val) => setIsOpen(val)}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>

              {/* Kitchen Rush Mode Switch */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <Label className="font-bold text-sm text-slate-800 dark:text-slate-200">Kitchen Rush Mode</Label>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Temporarily pause new orders if kitchen is swamped</p>
                </div>
                <Switch
                  checked={isKitchenBusy}
                  onCheckedChange={(val) => setIsKitchenBusy(val)}
                  className="data-[state=checked]:bg-amber-500"
                />
              </div>
            </div>

            {/* Rush mode pause message */}
            {isKitchenBusy && (
              <div className="space-y-1.5 p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
                <Label className="text-xs font-bold text-amber-900 dark:text-amber-300">Customer Pause Notice</Label>
                <Input
                  value={rushMessage}
                  onChange={(e) => setRushMessage(e.target.value)}
                  placeholder="e.g. Kitchen is experiencing high demand. Orders temporarily paused — please try again in 30 minutes."
                  className="bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-800 rounded-xl"
                />

              </div>
            )}

            {/* Operating Hours schedule with Select dropdowns */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-orange-500" /> Opening Time
                </Label>
                <Select value={openTime} onValueChange={(val) => setOpenTime(val)}>
                  <SelectTrigger className="w-full h-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-xs sm:text-sm">
                    <SelectValue placeholder="Select opening time" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {TIME_OPTIONS.map((time) => (
                      <SelectItem key={time.value} value={time.value} className="text-xs sm:text-sm font-medium">
                        {time.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-orange-500" /> Closing Time
                </Label>
                <Select value={closeTime} onValueChange={(val) => setCloseTime(val)}>
                  <SelectTrigger className="w-full h-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-xs sm:text-sm">
                    <SelectValue placeholder="Select closing time" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {TIME_OPTIONS.map((time) => (
                      <SelectItem key={time.value} value={time.value} className="text-xs sm:text-sm font-medium">
                        {time.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>


            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSaveOutletControls}
                disabled={loading}
                className="rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-md"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Outlet Status & Hours"}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-800 shadow-2xl rounded-3xl p-8 border border-slate-200 dark:border-slate-700"
        >
          <form data-testid="restaurant-form" onSubmit={submitHandler} className="space-y-8">

            {/* Basic Info Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {formFields.map((field, index) => {
                const Icon = field.icon;
                return (
                  <motion.div
                    key={field.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="space-y-2"
                  >
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Icon className="w-4 h-4 text-orange-500" />
                      {field.label}
                    </Label>
                    <div className="relative flex items-center w-full">
                      <Input
                        type={field.type || "text"}
                        name={field.name}
                        value={
                          (input[field.name as keyof RestaurantFormSchema] as
                          | string
                          | number) ?? ""
                        }
                        onChange={changeEventHandler}
                        placeholder={field.placeholder}
                        className={`h-12 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-800 transition-all duration-300 w-full ${
                          field.name === "address" ? "pr-12" : ""
                        }`}
                      />
                      {field.name === "address" && (
                        <button
                          type="button"
                          onClick={() => setShowMapPicker(true)}
                          className="absolute right-3 p-2 rounded-xl bg-orange-100 hover:bg-orange-200 dark:bg-orange-950/40 dark:hover:bg-orange-900/60 text-orange-600 dark:text-orange-400 transition-colors duration-200"
                          title="Pin location on map"
                        >
                          <MapPin className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {errors &&
                      errors[field.name as keyof RestaurantFormSchema] && (
                        <motion.span
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-red-600 font-medium"
                        >
                          {
                            errors[
                            field.name as keyof RestaurantFormSchema
                            ] as string
                          }
                        </motion.span>
                      )}
                  </motion.div>
                );
              })}
            </div>

            {/* Cuisines */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="space-y-2"
            >
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-orange-500" />
                Cuisines
              </Label>
              <Input
                type="text"
                name="cuisines"
                value={input.cuisines}
                onChange={(e) =>
                  setInput({ ...input, cuisines: e.target.value.split(",") })
                }
                placeholder="e.g. Momos, Biryani, Chinese"
                className="h-12 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-800 transition-all duration-300"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Separate multiple cuisines with commas
              </p>
              {errors && (
                <motion.span
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-600 font-medium"
                >
                  {errors.cuisines}
                </motion.span>
              )}
            </motion.div>

            {/* Image Upload */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
              className="space-y-2"
            >
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-orange-500" />
                Upload Restaurant Banner
              </Label>
              <Input
                onChange={(e) =>
                  setInput({
                    ...input,
                    imageFile: e.target.files?.[0] || undefined,
                  })
                }
                type="file"
                accept="image/*"
                name="imageFile"
                className="h-12 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-orange-500 transition-all duration-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
              />
              {errors && (
                <motion.span
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-600 font-medium"
                >
                  {errors.imageFile?.name}
                </motion.span>
              )}
            </motion.div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="pt-6"
            >
              {loading ? (
                <Button
                  disabled
                  className="w-full sm:w-auto h-12 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 rounded-xl font-semibold"
                >
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Please wait
                </Button>
              ) : (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button type="submit" className="w-full sm:w-auto h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                    {restaurant ? "Update Restaurant" : "Add Restaurant"}
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </form>
        </motion.div>
      </div>

      <MapAddressPicker
        open={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onConfirm={handleMapConfirm}
        initialLat={input.latitude}
        initialLng={input.longitude}
      />
    </motion.div>
  );
};

export default Restaurant;
