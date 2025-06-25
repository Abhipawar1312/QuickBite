import { IndianRupee } from "lucide-react";
import { Separator } from "./ui/separator";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { useOrderStore } from "@/store/useOrderStore";
import { CartItem } from "@/types/cartType";
import { useEffect } from "react";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  preparing: "bg-blue-100 text-blue-800",
  outfordelivery: "bg-orange-100 text-orange-800",
  delivered: "bg-gray-100 text-gray-800",
};

const Success = () => {
  const { orders, getOrderDetails } = useOrderStore();

  useEffect(() => {
    getOrderDetails();
  }, []);

  if (orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <h1 className="text-3xl font-bold">No orders found</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen  py-16 px-4">
      {/* Page title: white, centered */}
      <h1 className="text-4xl font-extrabold text-center  mb-12">
        Your Orders
      </h1>

      <div className="max-w-3xl mx-auto space-y-8">
        {orders.map((order: any) => {
          const { status, cartItems, totalAmount } = order;

          return (
            <div
              key={order._id}
              className="
                bg-white/10         /* frosted glass effect */
                backdrop-blur-sm
                rounded-2xl
                p-6
                shadow-xl
                hover:shadow-2xl
                transition-shadow
              "
            >
              {/* Centered Status */}
              <div className="text-center mb-6">
                <span className=" mr-2">Status:</span>
                <span
                  className={`px-4 py-1 rounded-full text-sm font-semibold capitalize ${
                    STATUS_STYLES[status] || STATUS_STYLES.pending
                  }`}
                >
                  {status}
                </span>
              </div>

              <Separator className="border-white/20" />

              {/* Line items */}
              <div className="space-y-4 mt-6">
                {cartItems.map((item: CartItem, idx: number) => {
                  const lineTotal = item.price * item.quantity;
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between"
                    >
                      {/* Left side: image + name + qty */}
                      <div className="flex items-center space-x-4">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div>
                          <p className=" font-medium">{item.name}</p>
                          <p className=" text-sm">Qty: {item.quantity}</p>
                        </div>
                      </div>

                      {/* Right side: prices, right-aligned */}
                      <div className="flex flex-col items-end space-y-1">
                        <p className=" text-sm">Unit Price</p>
                        <p className="flex items-center  font-semibold">
                          <IndianRupee className="w-4 h-4 mr-1" />
                          {item.price}
                        </p>
                        <p className="flex items-center  text-sm">
                          <span className="mr-1">Total:</span>
                          <IndianRupee className="w-4 h-4 mr-1" />
                          {lineTotal}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Separator className="border-white/20 mt-6" />

              {/* Order total */}
              <div className="flex justify-between items-center mt-6">
                <p className=" font-semibold">Order Total</p>
                <p className="flex items-center  text-2xl font-bold">
                  <IndianRupee className="w-6 h-6 mr-1" />
                  {totalAmount}
                </p>
              </div>
            </div>
          );
        })}

        {/* Continue Shopping button */}
        <Link to="/cart">
          <Button className="w-full py-4 bg-sky-500 hover:bg-sky-600 rounded-full text-lg font-semibold">
            Continue Shopping
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Success;
