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
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

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
  });

  const { cart } = useCartStore();
  const { restaurant, getRestaurant } = useRestaurantStore();
  const { createCheckoutSession, loading } = useOrderStore();

  const changeEventHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInput({ ...input, [name]: value });
  };

  const checkoutHandler = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      let restaurantId = restaurant?._id;
      if (!restaurantId) {
        await getRestaurant();
        const updatedRestaurant = useRestaurantStore.getState().restaurant;
        if (!updatedRestaurant?._id) {
          toast.error("Restaurant not found. Please try again.");
          return;
        }
        restaurantId = updatedRestaurant._id;
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

  useEffect(() => {
    if (!restaurant) {
      getRestaurant();
    }
  }, []);

  const formFields = [
    {
      name: "name",
      label: "Full Name",
      icon: User,
      type: "text",
      disabled: false,
    },
    {
      name: "email",
      label: "Email",
      icon: Mail,
      type: "email",
      disabled: true,
    },
    {
      name: "contact",
      label: "Contact",
      icon: Phone,
      type: "text",
      disabled: false,
    },
    {
      name: "address",
      label: "Address",
      icon: MapPin,
      type: "text",
      disabled: false,
    },
    {
      name: "city",
      label: "City",
      icon: MapPin,
      type: "text",
      disabled: false,
    },
    {
      name: "country",
      label: "Country",
      icon: Globe,
      type: "text",
      disabled: false,
    },
  ];

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="p-0 max-w-2xl mx-auto bg-white dark:bg-slate-900 border-0 shadow-2xl rounded-2xl overflow-hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
              className="relative"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-8 text-white">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-center"
                >
                  <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-90" />
                  <DialogTitle className="text-2xl font-bold mb-2">
                    Review Your Order
                  </DialogTitle>
                  <DialogDescription className="text-orange-100">
                    Confirm your delivery details before proceeding to payment
                  </DialogDescription>
                </motion.div>
              </div>

              {/* Form */}
              <div className="p-8">
                <form onSubmit={checkoutHandler} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {formFields.map((field, index) => {
                      const Icon = field.icon;
                      return (
                        <motion.div
                          key={field.name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + index * 0.05 }}
                          className="space-y-2"
                        >
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <Icon className="w-4 h-4 text-orange-500" />
                            {field.label}
                          </Label>
                          <div className="relative">
                            <Input
                              type={field.type}
                              name={field.name}
                              value={input[field.name as keyof typeof input]}
                              onChange={changeEventHandler}
                              disabled={field.disabled}
                              className={`pl-4 pr-4 py-3 rounded-xl border-2 transition-all duration-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-800 ${
                                field.disabled
                                  ? "bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-60"
                                  : "bg-white dark:bg-slate-800 hover:border-orange-300"
                              }`}
                              placeholder={`Enter your ${field.label.toLowerCase()}`}
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  <DialogFooter className="pt-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="w-full"
                    >
                      {loading ? (
                        <Button
                          disabled
                          className="w-full bg-orange-500 hover:bg-orange-500 text-white py-4 rounded-xl text-lg font-semibold"
                        >
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Processing...
                        </Button>
                      ) : (
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                          >
                            <CreditCard className="w-5 h-5 mr-2" />
                            Continue To Payment
                          </Button>
                        </motion.div>
                      )}
                    </motion.div>
                  </DialogFooter>
                </form>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default CheckoutConfirmPage;
