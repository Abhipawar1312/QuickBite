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

const Profile = () => {
  const { user, updateProfile } = useUserStore();
  const [isLoading, setIsLoading] = useState<boolean>(false);
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
    <form
      onSubmit={updateProfileHandler}
      className="max-w-7xl mx-auto py-16 px-4"
    >
      <h1 className="text-4xl font-extrabold text-center mb-12">
        Your Profile
      </h1>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="relative md:w-28 md:h-28 w-20 h-20">
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
            <Input
              ref={imageRef}
              className="hidden"
              type="file"
              accept="image/*"
              onChange={fileChangeHandler}
            />
            <div
              onClick={() => imageRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 bg-gray-500 bg-opacity-50 rounded-full cursor-pointer"
            >
              <Plus className="text-white w-8 h-8" />
            </div>
          </Avatar>
          <Input
            type="text"
            name="fullname"
            placeholder="Enter Your Full Name"
            value={profileData.fullname}
            onChange={changeHandler}
            className="font-bold text-2xl outline-none border-none focus-visible:ring-transparent"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-4 md:gap-2 gap-3 my-10">
        <div className="flex items-center gap-4 rounded-sm p-2 ">
          <Mail className="text-gray-500" />
          <div className="w-full">
            <Label>Email</Label>
            <Input
              disabled
              name="email"
              placeholder="Enter Your Email"
              value={profileData.email}
              onChange={changeHandler}
              className="w-full bg-transparent focus-visible:ring-0 focus-visible:border-transparent outline-none border-none shadow-lg"
            />
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-sm p-2 ">
          <LocateIcon className="text-gray-500" />
          <div className="w-full">
            <Label>Address</Label>
            <Input
              name="address"
              placeholder="Enter your address"
              value={profileData.address}
              onChange={changeHandler}
              className="w-full bg-transparent focus-visible:ring-0 focus-visible:border-transparent outline-none border-none shadow-lg"
            />
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-sm p-2 ">
          <MapPin className="text-gray-500" />
          <div className="w-full">
            <Label>City</Label>
            <Input
              name="city"
              placeholder="Enter your city"
              value={profileData.city}
              onChange={changeHandler}
              className="w-full bg-transparent focus-visible:ring-0 focus-visible:border-transparent outline-none border-none shadow-lg"
            />
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-sm p-2 ">
          <MapPinnedIcon className="text-gray-500" />
          <div className="w-full">
            <Label>Country</Label>
            <Input
              name="country"
              placeholder="Enter your country"
              value={profileData.country}
              onChange={changeHandler}
              className="w-full bg-transparent focus-visible:ring-0 focus-visible:border-transparent outline-none border-none shadow-lg"
            />
          </div>
        </div>
      </div>

      <div className="text-center">
        {isLoading ? (
          <Button disabled className="bg-sky-blue hover:bg-sky-blue">
            <Loader2 className="mr-2 w-4 h-4 animate-spin" />
            Please wait
          </Button>
        ) : (
          <Button type="submit" className="bg-sky-blue hover:bg-sky-blue">
            Update
          </Button>
        )}
      </div>
    </form>
  );
};

export default Profile;
