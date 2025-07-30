"use client";

import type React from "react";

import {
  Loader2,
  LocateIcon,
  Mail,
  MapPin,
  MapPinnedIcon,
  Camera,
  User,
  Save,
  Edit3,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { type FormEvent, useRef, useState } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { useUserStore } from "@/store/useUserStore";
import { motion, AnimatePresence } from "framer-motion";

const Profile = () => {
  const { user, updateProfile } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const imageRef = useRef<HTMLInputElement | null>(null);
  const [profileData, setProfileData] = useState({
    fullname: user?.fullname || "",
    email: user?.email || "",
    address: user?.address || "",
    city: user?.city || "",
    country: user?.country || "",
    profilePicture: user?.profilePicture || "",
  });
  const [selectedProfilePicture, setSelectedProfilePicture] = useState<string>(
    user?.profilePicture || ""
  );

  const changeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };

  const updateProfileHandler = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await updateProfile(profileData);
      setIsLoading(false);
      setIsEditing(false);
    } catch (error) {
      setIsLoading(false);
    }
  };

  const fileChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setSelectedProfilePicture(result);
        setProfileData((prevData) => ({
          ...prevData,
          profilePicture: result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const formFields = [
    {
      label: "Full Name",
      icon: User,
      name: "fullname",
      disabled: false,
      type: "text",
    },
    {
      label: "Email",
      icon: Mail,
      name: "email",
      disabled: true,
      type: "email",
    },
    {
      label: "Address",
      icon: LocateIcon,
      name: "address",
      disabled: false,
      type: "text",
    },
    {
      label: "City",
      icon: MapPin,
      name: "city",
      disabled: false,
      type: "text",
    },
    {
      label: "Country",
      icon: MapPinnedIcon,
      name: "country",
      disabled: false,
      type: "text",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-6 sm:py-8 md:py-12 px-4 flex items-center justify-center"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="w-full max-w-4xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Mobile-Optimized Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 sm:p-6 md:p-8 text-white relative overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative z-10"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                  Your Profile
                </h1>
                <p className="text-orange-100 text-sm sm:text-base">
                  Manage your account information
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(!isEditing)}
                className="self-start sm:self-center p-2.5 sm:p-3 bg-white/20 rounded-full hover:bg-white/30 transition-colors duration-300"
              >
                <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>
            </div>
          </motion.div>

          {/* Mobile-Optimized Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4 w-20 h-20 sm:w-32 sm:h-32 bg-white rounded-full" />
            <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 w-16 h-16 sm:w-24 sm:h-24 bg-white rounded-full" />
          </div>
        </div>

        <form onSubmit={updateProfileHandler} className="p-4 sm:p-6 md:p-8">
          {/* Mobile-Optimized Profile Picture Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col items-center mb-8 sm:mb-10"
          >
            <div className="relative group">
              <motion.div whileHover={{ scale: 1.05 }} className="relative">
                <Avatar className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 border-4 border-white shadow-xl">
                  <AvatarImage
                    src={selectedProfilePicture || "/placeholder.svg"}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xl sm:text-2xl font-bold">
                    {user?.fullname
                      ? user.fullname
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                      : "NA"}
                  </AvatarFallback>
                </Avatar>

                <AnimatePresence>
                  {isEditing && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center cursor-pointer"
                      onClick={() => imageRef.current?.click()}
                    >
                      <Camera className="w-8 h-8 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <Input
                ref={imageRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={fileChangeHandler}
              />
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center mt-4"
            >
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {user?.fullname || "User Name"}
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                {user?.email}
              </p>
            </motion.div>
          </motion.div>

          {/* Form Fields */}
          <div className="grid md:grid-cols-2 gap-6">
            {formFields.map((field, index) => {
              const Icon = field.icon;
              return (
                <motion.div
                  key={field.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="space-y-2"
                >
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <div className="p-1 bg-orange-100 dark:bg-orange-900/30 rounded">
                      <Icon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    {field.label}
                  </Label>
                  <div className="relative">
                    <Input
                      name={field.name}
                      type={field.type}
                      disabled={field.disabled || !isEditing}
                      placeholder={`Enter your ${field.label.toLowerCase()}`}
                      value={
                        profileData[field.name as keyof typeof profileData]
                      }
                      onChange={changeHandler}
                      className={`pl-4 pr-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                        field.disabled || !isEditing
                          ? "bg-slate-100 dark:bg-slate-700 cursor-not-allowed opacity-60"
                          : "bg-white dark:bg-slate-800 hover:border-orange-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-800"
                      }`}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <AnimatePresence>
            {isEditing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="flex gap-4 justify-center mt-10"
              >
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300"
                  >
                    Cancel
                  </Button>
                </motion.div>

                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-5 w-5" />
                        Update Profile
                      </>
                    )}
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default Profile;
