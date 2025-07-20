import { Minus, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { useState } from "react";
import CheckoutConfirmPage from "./CheckoutConfirmPage";
import { useCartStore } from "@/store/useCartStore";
import { CartItem } from "@/types/cartType";
import { motion } from "framer-motion";

const Cart = () => {
  const [open, setOpen] = useState<boolean>(false);

  const {
    cart,
    incrementQuantity,
    decrementQuantity,
    clearCart,
    removeFromTheCart,
  } = useCartStore();

  const totalAmount = cart.reduce(
    (acc, ele) => acc + ele.price * ele.quantity,
    0
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen py-16 px-4"
    >
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-4xl font-extrabold text-center text-gray-900 dark:text-white mb-12"
      >
        Your Cart
      </motion.h1>

      <div className="flex flex-col max-w-7xl mx-auto">
        <div className="flex justify-end mb-2">
          <Button variant="link" onClick={clearCart} className="text-red-500">
            Clear All
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Table className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow">
            <TableHeader className="bg-gray-100 dark:bg-zinc-900">
              <TableRow>
                <TableHead>Items</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="text-right">Remove</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {cart.map((item: CartItem) => (
                <TableRow
                  key={item._id}
                  className="hover:bg-gray-50 dark:hover:bg-zinc-800"
                >
                  <TableCell>
                    <Avatar>
                      <AvatarImage src={item?.image} alt={item?.name} />
                      <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-semibold">{item?.name}</TableCell>
                  <TableCell>₹{item?.price}</TableCell>
                  <TableCell>
                    <div className="w-fit flex items-center rounded-full border border-gray-300 dark:border-gray-600 shadow-md">
                      <Button
                        onClick={() => decrementQuantity(item._id)}
                        size="icon"
                        variant="ghost"
                        className="rounded-full"
                      >
                        <Minus />
                      </Button>
                      <Button
                        size="icon"
                        className="font-bold border-none"
                        disabled
                        variant="ghost"
                      >
                        {item.quantity}
                      </Button>
                      <Button
                        onClick={() => incrementQuantity(item._id)}
                        size="icon"
                        className="rounded-full bg-sky-blue hover:bg-sky-blue"
                        variant="ghost"
                      >
                        <Plus />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>₹{item.price * item.quantity}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="bg-sky-blue hover:bg-sky-blue"
                      onClick={() => removeFromTheCart(item._id)}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>

            <TableFooter>
              <TableRow className="text-lg font-bold">
                <TableCell colSpan={5}>Total</TableCell>
                <TableCell className="text-right">₹{totalAmount}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-end my-6"
        >
          <Button
            onClick={() => setOpen(true)}
            className="bg-sky-blue hover:bg-sky-blue rounded-full px-6 py-3 text-white text-lg font-semibold"
          >
            Proceed To Checkout
          </Button>
        </motion.div>

        <CheckoutConfirmPage open={open} setOpen={setOpen} />
      </div>
    </motion.div>
  );
};

export default Cart;
