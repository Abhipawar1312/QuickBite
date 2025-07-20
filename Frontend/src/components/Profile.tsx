import {
  Loader2,
  LocateIcon,
  Mail,
  MapPin,
  MapPinnedIcon,
  Plus,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { FormEvent, useRef, useState } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { useUserStore } from "@/store/useUserStore";
import { motion } from "framer-motion";

const Profile = () => {
  const { user, updateProfile } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50 dark:bg-[#111] py-12 px-4 flex items-center justify-center"
    >
      <form
        onSubmit={updateProfileHandler}
        className="w-full max-w-4xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-8"
      >
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-10"
        >
          Your Profile
        </motion.h1>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10">
          <div className="relative">
            <Avatar className="w-24 h-24 md:w-28 md:h-28">
              <AvatarImage src={selectedProfilePicture} />
              <AvatarFallback>
                {user?.fullname
                  ? user.fullname
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                  : "NA"}
              </AvatarFallback>
            </Avatar>
            <Input
              ref={imageRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={fileChangeHandler}
            />
            <div
              onClick={() => imageRef.current?.click()}
              className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full opacity-0 hover:opacity-100 transition cursor-pointer"
            >
              <Plus className="text-white w-6 h-6" />
            </div>
          </div>

          <div className="flex-1 w-full">
            <Label className="text-sm text-gray-600 dark:text-gray-300">
              Full Name
            </Label>
            <Input
              type="text"
              name="fullname"
              placeholder="Enter Your Full Name"
              value={profileData.fullname}
              onChange={changeHandler}
              className="mt-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-gray-700"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-10">
          {[
            {
              label: "Email",
              icon: <Mail size={16} />,
              name: "email",
              disabled: true,
            },
            {
              label: "Address",
              icon: <LocateIcon size={16} />,
              name: "address",
            },
            { label: "City", icon: <MapPin size={16} />, name: "city" },
            {
              label: "Country",
              icon: <MapPinnedIcon size={16} />,
              name: "country",
            },
          ].map(({ label, icon, name, disabled }) => (
            <div key={name}>
              <Label className="text-sm flex items-center gap-2 text-gray-600 dark:text-gray-300">
                {icon} {label}
              </Label>
              <Input
                name={name}
                disabled={disabled}
                placeholder={`Enter your ${label.toLowerCase()}`}
                value={profileData[name as keyof typeof profileData]}
                onChange={changeHandler}
                className="mt-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-gray-700"
              />
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-3 rounded-md"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait
              </>
            ) : (
              "Update Profile"
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default Profile;
