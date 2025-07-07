import { Link } from "react-router-dom";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "./ui/menubar";

import { Button } from "./ui/button";
import {
  HandPlatter,
  Loader2,
  Menu,
  PackageCheck,
  ShoppingCart,
  SquareMenu,
  User,
  UtensilsCrossed,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

import { Separator } from "./ui/separator";
import { useUserStore } from "@/store/useUserStore";
import { useCartStore } from "@/store/useCartStore";
import DarkMode from "./Darkmode";
import Icon from "../assets/Icon.png";

const Navbar = () => {
  const { user, loading, logout } = useUserStore();
  const { cart } = useCartStore();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between h-14">
        <Link to="/" className="flex items-center gap-2">
          <img
            src={Icon}
            alt="QuickBite Logo"
            className="h-10 w-10 object-contain"
          />
          <h1 className="font-bold md:font-extrabold text-2xl">QuickBite</h1>
        </Link>

        <div className="hidden md:flex items-center gap-10">
          <div className="hidden md:flex items-center gap-6">
            <Link to="/">Home</Link>
            <Link to="/profile">Profile</Link>
            <Link to="/order/status">Order</Link>

            {user?.admin && (
              <Menubar>
                <MenubarMenu>
                  <MenubarTrigger>Dashboard</MenubarTrigger>
                  <MenubarContent>
                    <Link to="/admin/restaurant">
                      <MenubarItem>Restaurant</MenubarItem>
                    </Link>
                    <Link to="/admin/menu">
                      <MenubarItem>Menu</MenubarItem>
                    </Link>
                    <Link to="/admin/orders">
                      <MenubarItem>Orders</MenubarItem>
                    </Link>
                  </MenubarContent>
                </MenubarMenu>
              </Menubar>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div>
              {/* <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    Light
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    Dark
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu> */}
              <DarkMode />
            </div>
            <Link to="/cart" className="relative cursor-pointer">
              <ShoppingCart />
              {cart.length > 0 && (
                <Button
                  size={"icon"}
                  className="absolute -inset-y-3 left-2 text-xs rounded-full w-4 h-4 bg-red-500 hover:bg-red-500"
                >
                  {cart.length}
                </Button>
              )}
            </Link>
            <div>
              <Avatar>
                <AvatarImage src={user?.profilePicture} alt="profilephoto" />
                <AvatarFallback>
                  {" "}
                  {user?.fullname
                    ? user.fullname
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                    : "NA"}
                </AvatarFallback>
              </Avatar>
            </div>
            <div>
              {loading ? (
                <Button className="bg-sky-blue hover:bg-sky-blue">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </Button>
              ) : (
                <Button
                  onClick={logout}
                  className="bg-sky-blue hover:bg-sky-blue"
                >
                  Logout
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="md:hidden lg:hidden">
          {/* Mobile responsive  */}
          <MobileNavbar />
        </div>
      </div>
    </div>
  );
};

export default Navbar;

const MobileNavbar = () => {
  const { user, logout, loading } = useUserStore();
  const { cart } = useCartStore();

  return (
    <Sheet>
      <div className="flex items-center justify-between gap-3">
        <DarkMode />
        <SheetTrigger asChild>
          <Button
            size={"icon"}
            className="rounded-full bg-gray-200 text-black hover:bg-gray-200"
            variant="outline"
          >
            <Menu size={"18"} />
          </Button>
        </SheetTrigger>
      </div>
      <SheetContent className="flex flex-col">
        <SheetHeader className="flex flex-row items-center justify-between mt-2">
          <img
            src={Icon}
            alt="QuickBite Logo"
            className="h-10 w-10 object-contain"
          />
          <SheetTitle>QuickBite</SheetTitle>
        </SheetHeader>

        <Separator className="my-2" />

        <SheetDescription className="flex-1 flex flex-col gap-2">
          <SheetClose asChild>
            <Link
              to="/profile"
              className="flex items-center gap-4 hover:bg-gray-200 px-3 py-2 rounded-lg cursor-pointer hover:text-gray-900 font-medium"
            >
              <User />
              <span>Profile</span>
            </Link>
          </SheetClose>

          <SheetClose asChild>
            <Link
              to="/order/status"
              className="flex items-center gap-4 hover:bg-gray-200 px-3 py-2 rounded-lg cursor-pointer hover:text-gray-900 font-medium"
            >
              <HandPlatter />
              <span>Order</span>
            </Link>
          </SheetClose>

          <SheetClose asChild>
            <Link
              to="/cart"
              className="flex items-center gap-4 hover:bg-gray-200 px-3 py-2 rounded-lg cursor-pointer hover:text-gray-900 font-medium"
            >
              <ShoppingCart />
              <span>Cart ({cart.length})</span>
            </Link>
          </SheetClose>

          {user?.admin && (
            <>
              <SheetClose asChild>
                <Link
                  to="/admin/menu"
                  className="flex items-center gap-4 hover:bg-gray-200 px-3 py-2 rounded-lg cursor-pointer hover:text-gray-900 font-medium"
                >
                  <SquareMenu />
                  <span>Menu</span>
                </Link>
              </SheetClose>

              <SheetClose asChild>
                <Link
                  to="/admin/restaurant"
                  className="flex items-center gap-4 hover:bg-gray-200 px-3 py-2 rounded-lg cursor-pointer hover:text-gray-900 font-medium"
                >
                  <UtensilsCrossed />
                  <span>Restaurant</span>
                </Link>
              </SheetClose>

              <SheetClose asChild>
                <Link
                  to="/admin/orders"
                  className="flex items-center gap-4 hover:bg-gray-200 px-3 py-2 rounded-lg cursor-pointer hover:text-gray-900 font-medium"
                >
                  <PackageCheck />
                  <span>Restaurant Orders</span>
                </Link>
              </SheetClose>
            </>
          )}
        </SheetDescription>

        <SheetFooter className="flex flex-col gap-4">
          <div className="flex flex-row items-center gap-2">
            <Avatar>
              <AvatarImage src={user?.profilePicture} />
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
            <h1 className="font-bold">{user?.fullname}</h1>
          </div>

          <SheetClose asChild>
            {loading ? (
              <Button className="bg-sky-blue hover:bg-sky-blue">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait
              </Button>
            ) : (
              <Button
                onClick={logout}
                className="bg-sky-blue hover:bg-sky-blue"
              >
                Logout
              </Button>
            )}
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
