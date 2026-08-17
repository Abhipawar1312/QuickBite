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
  Bike,
  Shield,
  Phone,
  Home,
  Briefcase,
  Building,
  Plus,
  Trash2,
  FileText,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { type FormEvent, useRef, useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { useUserStore } from "@/store/useUserStore";
import { useRiderStore } from "@/store/useRiderStore";
import { MapAddressPicker } from "./MapAddressPicker";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { toast } from "sonner";

const Profile = () => {
  const { user, updateProfile, addSavedAddress, deleteSavedAddress } = useUserStore();
  const { riderProfile, getRiderProfile } = useRiderStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [selectedProfilePicture, setSelectedProfilePicture] = useState<string>(user?.profilePicture || "");
  const imageRef = useRef<HTMLInputElement | null>(null);

  // Add Address Modal state
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: "Home",
    address: "",
    city: "",
    pincode: "",
    deliveryInstructions: "",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });
  const [addressSaving, setAddressSaving] = useState(false);

  const [profileData, setProfileData] = useState({
    fullname: user?.fullname || "",
    email: user?.email || "",
    contact: user?.contact?.toString() || "",
    address: user?.address || "",
    city: user?.city || "",
    country: user?.country || "",
    pincode: user?.pincode || "",
    profilePicture: user?.profilePicture || "",
    vehicleName: "",
    licenseNumber: "",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });

  useEffect(() => {
    if (user?.role === "rider") {
      getRiderProfile();
    }
  }, [user?.role, getRiderProfile]);

  useEffect(() => {
    if (user && !isEditing) {
      setProfileData((prev) => ({
        ...prev,
        fullname: user.fullname || "",
        email: user.email || "",
        contact: user.contact?.toString() || "",
        address: user.address || "",
        city: user.city || "",
        country: user.country || "",
        pincode: user.pincode || "",
      }));
      setSelectedProfilePicture(user.profilePicture || "");
    }
  }, [user, isEditing]);


  useEffect(() => {
    if (riderProfile) {
      setProfileData((prev) => ({
        ...prev,
        vehicleName: riderProfile.vehicleName || "",
        licenseNumber: riderProfile.licenseNumber || "",
        contact: riderProfile.contact || prev.contact || "",
        latitude: riderProfile.location?.coordinates?.[1],
        longitude: riderProfile.location?.coordinates?.[0],
      }));
    }
  }, [riderProfile]);

  const changeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };

  const updateProfileHandler = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await updateProfile(profileData);
      if (user?.role === "rider") {
        await getRiderProfile();
      }
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

  const handleAddAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.address.trim() || !newAddress.city.trim()) {
      toast.error("Address and city are required");
      return;
    }
    setAddressSaving(true);
    await addSavedAddress(newAddress);
    setAddressSaving(false);
    setAddressModalOpen(false);
    setNewAddress({
      label: "Home",
      address: "",
      city: "",
      pincode: "",
      deliveryInstructions: "",
      latitude: undefined,
      longitude: undefined,
    });
  };

  const handleDeleteAddress = async (addressId: string) => {
    await deleteSavedAddress(addressId);
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
      label: "Contact Number",
      icon: Phone,
      name: "contact",
      disabled: false,
      type: "text",
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
    {
      label: "Pincode (6 digits)",
      icon: MapPin,
      name: "pincode",
      disabled: false,
      type: "text",
    },
  ];

  if (user?.role === "rider") {
    formFields.push(
      {
        label: "Vehicle Name / Type",
        icon: Bike,
        name: "vehicleName",
        disabled: false,
        type: "text",
      },
      {
        label: "Driver License Number",
        icon: Shield,
        name: "licenseNumber",
        disabled: false,
        type: "text",
      }
    );
  }

  const handleMapConfirm = (data: {
    address: string;
    city: string;
    pincode: string;
    country: string;
    latitude: number;
    longitude: number;
  }) => {
    setProfileData((prev) => ({
      ...prev,
      address: data.address,
      city: data.city,
      pincode: data.pincode || prev.pincode,
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
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-6 sm:py-8 md:py-12 px-4 flex flex-col items-center justify-center space-y-6"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="w-full max-w-4xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
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
                  Manage your personal details and preferences
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

          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4 w-20 h-20 sm:w-32 sm:h-32 bg-white rounded-full" />
            <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 w-16 h-16 sm:w-24 sm:h-24 bg-white rounded-full" />
          </div>
        </div>

        <form onSubmit={updateProfileHandler} className="p-4 sm:p-6 md:p-8">
          {/* Profile Picture */}
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
                  <div className="relative flex items-center">
                    <Input
                      name={field.name}
                      type={field.type}
                      disabled={field.disabled || !isEditing}
                      placeholder={`Enter your ${field.label.toLowerCase()}`}
                      value={
                        profileData[field.name as keyof typeof profileData] || ""
                      }
                      onChange={changeHandler}
                      className={`pl-4 ${field.name === "address" ? "pr-12" : "pr-4"} py-3 rounded-xl border-2 transition-all duration-300 w-full ${
                        field.disabled || !isEditing
                          ? "bg-slate-100 dark:bg-slate-700 cursor-not-allowed opacity-60"
                          : "bg-white dark:bg-slate-800 hover:border-orange-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-800"
                      }`}
                    />
                    {field.name === "address" && isEditing && (
                      <button
                        type="button"
                        onClick={() => setShowMapPicker(true)}
                        className="absolute right-3 p-1.5 rounded-lg bg-orange-100 hover:bg-orange-200 dark:bg-orange-950/40 dark:hover:bg-orange-900/60 text-orange-600 dark:text-orange-400 transition-colors duration-200"
                        title="Pin location on map"
                      >
                        <MapPin className="w-4 h-4" />
                      </button>
                    )}
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

      {/* Saved Delivery Addresses Section (Address Book) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-4xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-500" />
              Saved Delivery Addresses
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage your delivery locations for fast 1-click checkout
            </p>
          </div>
          <Button
            onClick={() => setAddressModalOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs sm:text-sm px-4 py-2 flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" />
            Add New Address
          </Button>
        </div>

        {(!user?.savedAddresses || user.savedAddresses.length === 0) ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <Building className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm font-medium">No saved addresses yet.</p>
            <p className="text-xs text-slate-400 mt-0.5">Add your Home, Work, or Favorite location for swift checkout.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {user.savedAddresses.map((addr) => {
              const Icon = addr.label?.toLowerCase() === "work" ? Briefcase : addr.label?.toLowerCase() === "home" ? Home : Building;

              return (
                <div
                  key={addr._id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 flex items-start justify-between gap-3 shadow-sm hover:border-orange-300 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-950/40 text-orange-600">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {addr.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 font-medium">
                      {addr.address}
                    </p>
                    <p className="text-xs text-slate-500">
                      {addr.city} {addr.pincode ? `• ${addr.pincode}` : ""}
                    </p>
                    {addr.deliveryInstructions && (
                      <p className="text-[11px] text-orange-600 dark:text-orange-400 mt-1 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {addr.deliveryInstructions}
                      </p>
                    )}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => addr._id && handleDeleteAddress(addr._id)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl h-8 w-8"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Add New Address Dialog */}
      <Dialog open={addressModalOpen} onOpenChange={setAddressModalOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-500" />
              Save New Delivery Address
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Save your address for seamless 1-click orders
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddAddressSubmit} className="space-y-4 pt-2">
            {/* Label selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Address Type</Label>
              <div className="flex gap-2">
                {["Home", "Work", "Other"].map((lbl) => (
                  <button
                    key={lbl}
                    type="button"
                    onClick={() => setNewAddress((prev) => ({ ...prev, label: lbl }))}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                      newAddress.label === lbl
                        ? "bg-orange-500 text-white border-orange-600"
                        : "bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600"
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Address Line</Label>
              <Input
                type="text"
                placeholder="House / Flat / Road, Area"
                value={newAddress.address}
                onChange={(e) => setNewAddress((prev) => ({ ...prev, address: e.target.value }))}
                className="text-xs rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">City</Label>
                <Input
                  type="text"
                  placeholder="e.g. Mumbai, Pune"
                  value={newAddress.city}
                  onChange={(e) => setNewAddress((prev) => ({ ...prev, city: e.target.value }))}
                  className="text-xs rounded-xl"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Pincode</Label>
                <Input
                  type="text"
                  placeholder="6 digits"
                  maxLength={6}
                  value={newAddress.pincode}
                  onChange={(e) => setNewAddress((prev) => ({ ...prev, pincode: e.target.value }))}
                  className="text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Delivery Instructions (Optional)</Label>
              <Input
                type="text"
                placeholder="e.g. Ring bell, leave at guard desk"
                value={newAddress.deliveryInstructions}
                onChange={(e) => setNewAddress((prev) => ({ ...prev, deliveryInstructions: e.target.value }))}
                className="text-xs rounded-xl"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddressModalOpen(false)}
                className="flex-1 rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addressSaving}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs"
              >
                {addressSaving ? "Saving..." : "Save Address"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <MapAddressPicker
        open={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onConfirm={handleMapConfirm}
        initialLat={profileData.latitude}
        initialLng={profileData.longitude}
      />
    </motion.div>
  );
};

export default Profile;

