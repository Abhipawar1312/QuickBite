// Updated Restaurant component
"use client";

import type React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type RestaurantFormSchema,
  restaurantFromSchema,
} from "@/schema/RestaurantSchema";
import { useRestaurantStore } from "@/store/useRestaurantStore";
import {
  Loader2,
  Store,
  MapPin,
  Globe,
  Clock,
  ChefHat,
  ImageIcon,
} from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { motion } from "framer-motion";

const Restaurant = () => {
  const {
    loading,
    restaurant,
    getRestaurant,
    createRestaurant,
    updateRestaurant,
    clearRestaurantData, // Add this
  } = useRestaurantStore();

  const [input, setInput] = useState<RestaurantFormSchema>({
    restaurantName: "",
    city: "",
    country: "",
    deliveryTime: 0,
    cuisines: [],
    imageFile: undefined,
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
      formData.append("deliveryTime", input.deliveryTime.toString());
      formData.append("cuisines", JSON.stringify(input.cuisines));
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
        deliveryTime: restaurant.deliveryTime || 0,
        cuisines: restaurant.cuisines
          ? restaurant.cuisines.map((cuisine: string) => cuisine)
          : [],
        imageFile: undefined,
      });
    } else {
      // Reset form if no restaurant
      setInput({
        restaurantName: "",
        city: "",
        country: "",
        deliveryTime: 0,
        cuisines: [],
        imageFile: undefined,
      });
    }
  }, [restaurant]);

  const formFields = [
    {
      name: "restaurantName",
      label: "Restaurant Name",
      icon: Store,
      placeholder: "Enter your restaurant name",
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
                    <Input
                      type={field.type || "text"}
                      name={field.name}
                      value={
                        input[field.name as keyof RestaurantFormSchema] as
                        | string
                        | number
                      }
                      onChange={changeEventHandler}
                      placeholder={field.placeholder}
                      className="h-12 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-800 transition-all duration-300"
                    />
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
    </motion.div>
  );
};

export default Restaurant;
