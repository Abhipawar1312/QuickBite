import {
  Dispatch,
  FormEvent,
  SetStateAction,
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
import { Loader2 } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import { CheckoutSessionRequest } from "@/types/orderType";
import { useCartStore } from "@/store/useCartStore";
import { useRestaurantStore } from "@/store/useRestaurantStore";
import { useOrderStore } from "@/store/useOrderStore";
import { toast } from "sonner";
import { motion } from "framer-motion";

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-6 sm:p-8 rounded-xl max-w-lg mx-auto bg-white dark:bg-zinc-900">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <DialogTitle className="text-xl font-semibold text-center mb-2">
            Review Your Order
          </DialogTitle>
          <DialogDescription className="text-sm text-center text-gray-500 dark:text-gray-400 mb-6">
            Confirm your delivery details before proceeding to payment.
          </DialogDescription>

          <form
            onSubmit={checkoutHandler}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div className="space-y-1">
              <Label className="text-sm">Fullname</Label>
              <Input
                type="text"
                name="name"
                value={input.name}
                onChange={changeEventHandler}
                className="rounded-md"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-sm">Email</Label>
              <Input
                type="email"
                name="email"
                value={input.email}
                disabled
                className="bg-gray-100 dark:bg-zinc-800 cursor-not-allowed rounded-md"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-sm">Contact</Label>
              <Input
                type="text"
                name="contact"
                value={input.contact}
                onChange={changeEventHandler}
                className="rounded-md"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-sm">Address</Label>
              <Input
                type="text"
                name="address"
                value={input.address}
                onChange={changeEventHandler}
                className="rounded-md"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-sm">City</Label>
              <Input
                type="text"
                name="city"
                value={input.city}
                onChange={changeEventHandler}
                className="rounded-md"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-sm">Country</Label>
              <Input
                type="text"
                name="country"
                value={input.country}
                onChange={changeEventHandler}
                className="rounded-md"
              />
            </div>

            <DialogFooter className="col-span-1 sm:col-span-2 mt-4">
              {loading ? (
                <Button
                  disabled
                  className="w-full bg-sky-500 hover:bg-sky-500 text-white"
                >
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="w-full bg-sky-500 hover:bg-sky-600 text-white font-medium text-sm rounded-md py-2"
                >
                  Continue To Payment
                </Button>
              )}
            </DialogFooter>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutConfirmPage;
