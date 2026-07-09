"use client";

import { Link, useNavigate } from "react-router-dom";
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
  LogOut,
  Home,
  UserCircle,
  Shield,
  Bike,
  Bell,
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
import { useNotificationStore } from "@/store/useNotificationStore";
import { useRestaurantStore } from "@/store/useRestaurantStore";
import { useOrderStore } from "@/store/useOrderStore";
import { useEffect } from "react";
import { io } from "socket.io-client";
import DarkMode from "./Darkmode";
import Icon from "@/assets/Icon.png";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "./ui/badge";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, loading, logout } = useUserStore();
  const { cart } = useCartStore();
  const { unreadCount, addNotification } = useNotificationStore();
  const { addLocalRestaurantOrder, updateLocalRestaurantOrder } = useRestaurantStore();
  const { updateLocalOrderStatus } = useOrderStore();

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Global socket notification listener
  useEffect(() => {
    if (!user) return;

    const socket = io("http://localhost:8000", {
      query: { userId: user._id, role: user.role }
    });

    // 1. New delivery available (Riders)
    socket.on("new_order_available", (order: any) => {
      addNotification({
        title: "New Delivery Available!",
        message: `Order #${order._id.slice(-6)} is available from ${order.restaurant?.restaurantName || "restaurant"}.`,
        type: "new_order",
        link: "/rider/dashboard"
      });
    });

    // 2. New confirmed order (Restaurant Owners) — also push to owner dashboard store
    socket.on("new_restaurant_order", (order: any) => {
      addNotification({
        title: "New Order Confirmed!",
        message: `Order #${order._id.slice(-6)} confirmed by ${order.deliveryDetails?.name}.`,
        type: "new_order",
        link: "/admin/orders"
      });
      // Push directly into restaurant orders store so /admin/orders page updates instantly
      addLocalRestaurantOrder(order);
    });

    // 3. Rider accepted (Customers) — update order status in customer store
    socket.on("rider_accepted", (data: any) => {
      addNotification({
        title: "Rider Assigned!",
        message: data.message || "A delivery partner has accepted your order.",
        type: "rider_accepted",
        link: "/order/status"
      });
    });

    socket.on("rider_reached_restaurant", (data: any) => {
      addNotification({
        title: "Food Picked Up!",
        message: data.message || "Your delivery partner picked up your food!",
        type: "outfordelivery",
        link: "/order/status"
      });
    });

    socket.on("order_delivered_notification", (data: any) => {
      addNotification({
        title: "Order Delivered!",
        message: data.message || "Your order has been delivered! Enjoy your meal!",
        type: "delivered",
        link: "/order/status"
      });
    });

    socket.on("order_cancelled", (data: any) => {
      addNotification({
        title: "Order Cancelled",
        message: data.message || "Your order has been cancelled by the restaurant.",
        type: "cancelled",
        link: "/order/status"
      });
    });

    // 4. Order status updated — update customer order store AND restaurant store in real-time
    socket.on("order_status_updated", (order: any) => {
      const readableStatus = order.status.replace(/_/g, " ");
      addNotification({
        title: "Order Status Updated",
        message: `Order #${order._id.slice(-6)} is now: ${readableStatus}.`,
        type: "status_update",
        link: "/order/status"
      });
      // Update both stores so whichever page is open stays in sync
      updateLocalOrderStatus(order);
      updateLocalRestaurantOrder(order);
    });

    // 5. Rider profile verified by admin
    socket.on("rider_verified", (data: any) => {
      addNotification({
        title: "🎉 Profile Verified!",
        message: data.message || "Your rider profile has been verified. You can now go online and accept deliveries!",
        type: "delivered",
        link: "/rider/dashboard"
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [user, addNotification, addLocalRestaurantOrder, updateLocalOrderStatus, updateLocalRestaurantOrder]);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 shadow-lg"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo Section */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center"
          >
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <motion.img
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                  src={Icon}
                  alt="QuickBite Logo"
                  className="h-12 w-12 object-contain drop-shadow-lg"
                />
                <div className="absolute inset-0 bg-orange-400/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-2xl bg-gradient-to-r from-orange-600 via-orange-500 to-red-500 bg-clip-text text-transparent group-hover:from-orange-500 group-hover:via-red-500 group-hover:to-pink-500 transition-all duration-500">
                  QuickBite
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Delicious delivered
                </p>
              </div>
            </Link>
          </motion.div>

          {/* Desktop Navigation - role-filtered */}
          <div className="hidden lg:flex items-center gap-8">
            <div className="flex items-center gap-2">
              {/* Regular user links: Home, Profile, Orders */}
              {user?.role !== "rider" && (
                <>
                  {[
                    { to: "/", label: "Home", icon: Home },
                    { to: "/profile", label: "Profile", icon: UserCircle },
                    // Orders only for regular customers (not owner, not rider)
                    ...(!user?.admin ? [{ to: "/order/status", label: "Orders", icon: HandPlatter }] : []),
                  ].map((link, index) => {
                    const Icon = link.icon;
                    return (
                      <motion.div
                        key={link.to}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -2 }}
                      >
                        <Link
                          to={link.to}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-300 group font-medium"
                        >
                          <Icon className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                          <span className="text-sm">{link.label}</span>
                        </Link>
                      </motion.div>
                    );
                  })}
                </>
              )}

              {/* Rider: only Profile link */}
              {user?.role === "rider" && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }}>
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-300 group font-medium"
                  >
                    <UserCircle className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-sm">Profile</span>
                  </Link>
                </motion.div>
              )}

              {/* Restaurant Owner Dashboard */}
              {user?.admin && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ y: -2 }}
                >
                  <Menubar>
                    <MenubarMenu>
                      <MenubarTrigger className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300">
                        <SquareMenu className="w-4 h-4 mr-2" />
                        Dashboard
                      </MenubarTrigger>
                      <MenubarContent className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl p-2 min-w-[200px]">
                        <Link to="/admin/restaurant">
                          <MenubarItem className="hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 dark:hover:text-orange-400 transition-colors duration-300 rounded-xl p-3 cursor-pointer">
                            <UtensilsCrossed className="w-4 h-4 mr-3" />
                            Restaurant
                          </MenubarItem>
                        </Link>
                        <Link to="/admin/menu">
                          <MenubarItem className="hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 dark:hover:text-orange-400 transition-colors duration-300 rounded-xl p-3 cursor-pointer">
                            <SquareMenu className="w-4 h-4 mr-3" />
                            Menu
                          </MenubarItem>
                        </Link>
                        <Link to="/admin/orders">
                          <MenubarItem className="hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 dark:hover:text-orange-400 transition-colors duration-300 rounded-xl p-3 cursor-pointer">
                            <PackageCheck className="w-4 h-4 mr-3" />
                            Orders
                          </MenubarItem>
                        </Link>
                      </MenubarContent>
                    </MenubarMenu>
                  </Menubar>
                </motion.div>
              )}

              {/* Platform Admin verification dashboard */}
              {user?.role === "admin" && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ y: -2 }}
                >
                  <Link
                    to="/admin/dashboard"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Shield className="w-4 h-4" />
                    <span className="text-sm">Admin Dashboard</span>
                  </Link>
                </motion.div>
              )}

              {/* Rider Dashboard */}
              {user?.role === "rider" && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ y: -2 }}
                >
                  <Link
                    to="/rider/dashboard"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Bike className="w-4 h-4" />
                    <span className="text-sm">Rider Dashboard</span>
                  </Link>
                </motion.div>
              )}
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Search Button - Desktop Only */}
            {/* <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="hidden md:block"
            >
              <Button
                variant="ghost"
                size="icon"
                className="w-10 h-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-300 group"
              >
                <Search className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-orange-500 transition-colors duration-300" />
              </Button>
            </motion.div> */}

            {/* Notifications - Desktop Only */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="hidden md:block"
            >
              <Link to="/notifications">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-10 h-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-300 group relative"
                >
                  <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-orange-500 transition-colors duration-300" />
                  {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </div>
                  )}
                </Button>
              </Link>
            </motion.div>

            {/* Dark Mode Toggle */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
            >
              <DarkMode />
            </motion.div>

            {/* Cart Button — hidden for restaurant owners and riders */}
            {!user?.admin && user?.role !== "rider" && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to="/cart">
                  <Button
                    variant="ghost"
                    className="relative h-12 px-4 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-300 group border border-transparent hover:border-orange-200 dark:hover:border-orange-800"
                  >
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <ShoppingCart className="w-5 h-5 text-slate-700 dark:text-slate-300 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-300" />
                        <AnimatePresence>
                          {totalItems > 0 && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              className="absolute -top-2 -right-2"
                            >
                              <Badge className="h-5 w-5 p-0 flex items-center justify-center bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
                                {totalItems > 99 ? "99+" : totalItems}
                              </Badge>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <span className="hidden sm:block text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-300">
                        Cart
                      </span>
                    </div>
                  </Button>
                </Link>
              </motion.div>
            )}

            {/* User Avatar */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              whileHover={{ scale: 1.05 }}
              className="hidden md:block"
            >
              <div className="relative group">
                <Avatar className="w-11 h-11 border-2 border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-600 transition-all duration-300 shadow-lg">
                  <AvatarImage
                    src={user?.profilePicture || "/placeholder.svg"}
                    alt="Profile"
                  />
                  <AvatarFallback className="bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 text-orange-600 dark:text-orange-400 font-bold text-sm">
                    {user?.fullname
                      ? user.fullname
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                      : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-orange-400/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </motion.div>

            {/* Logout Button - Desktop */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
              whileTap={{ scale: 0.95 }}
              className="hidden lg:block"
            >
              {loading ? (
                <Button
                  disabled
                  className="bg-orange-500 hover:bg-orange-500 text-white px-4 py-2.5 rounded-xl h-12"
                >
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="text-sm">Wait...</span>
                </Button>
              ) : (
                <Button
                  onClick={logout}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 group h-12"
                >
                  <LogOut className="mr-2 h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="text-sm">Logout</span>
                </Button>
              )}
            </motion.div>

            {/* Mobile Menu */}
            <div className="lg:hidden">
              <MobileNavbar />
            </div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

const MobileNavbar = () => {
  const { user, logout, loading } = useUserStore();
  const { cart } = useCartStore();
  const { unreadCount } = useNotificationStore();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Role-based mobile links
  const mobileLinks = [
    // Always: Profile
    { to: "/profile", label: "Profile", icon: User },
    // Regular users only: Home and Orders
    ...(user?.role !== "rider" && !user?.admin
      ? [
          { to: "/", label: "Home", icon: Home },
          { to: "/order/status", label: "My Orders", icon: HandPlatter },
        ]
      : []),
    // Admin (restaurant owner): Home only (orders accessed from Dashboard)
    ...(user?.admin
      ? [{ to: "/", label: "Home", icon: Home }]
      : []),
  ];

  const adminLinks = [
    { to: "/admin/menu", label: "Menu", icon: SquareMenu },
    { to: "/admin/restaurant", label: "Restaurant", icon: UtensilsCrossed },
    { to: "/admin/orders", label: "Orders", icon: PackageCheck },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            size="icon"
            className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-orange-100 dark:hover:bg-orange-900/30 hover:text-orange-600 dark:hover:text-orange-400 border border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-600 transition-all duration-300 shadow-lg"
            variant="outline"
          >
            <Menu size={20} />
          </Button>
        </motion.div>
      </SheetTrigger>

      <SheetContent className="flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 w-80">
        <SheetHeader className="flex flex-row items-center justify-between mt-2 pb-4">
          <div className="flex items-center gap-3">
            <motion.img
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              src={Icon}
              alt="QuickBite Logo"
              className="h-10 w-10 object-contain"
            />
            <div>
              <SheetTitle className="bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent font-bold text-xl">
                QuickBite
              </SheetTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Delicious delivered
              </p>
            </div>
          </div>
        </SheetHeader>

        <Separator className="my-4 bg-slate-200 dark:bg-slate-700" />

        <SheetDescription className="flex-1 flex flex-col gap-2">
          {/* Notifications Link with Badge */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
          >
            <SheetClose asChild>
              <Link
                to="/notifications"
                className="flex items-center justify-between hover:bg-orange-50 dark:hover:bg-orange-900/20 px-4 py-4 rounded-xl cursor-pointer hover:text-orange-600 dark:hover:text-orange-400 font-medium transition-all duration-300 group border border-transparent hover:border-orange-200 dark:hover:border-orange-800"
              >
                <div className="flex items-center gap-4">
                  <Bell className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                  <span>Notifications</span>
                </div>
                {unreadCount > 0 && (
                  <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white font-bold">
                    {unreadCount}
                  </Badge>
                )}
              </Link>
            </SheetClose>
          </motion.div>

          {/* Cart Link — hidden for restaurant owners and riders */}
          {!user?.admin && user?.role !== "rider" && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <SheetClose asChild>
                <Link
                  to="/cart"
                  className="flex items-center justify-between hover:bg-orange-50 dark:hover:bg-orange-900/20 px-4 py-4 rounded-xl cursor-pointer hover:text-orange-600 dark:hover:text-orange-400 font-medium transition-all duration-300 group border border-transparent hover:border-orange-200 dark:hover:border-orange-800"
                >
                  <div className="flex items-center gap-4">
                    <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                    <span>Cart</span>
                  </div>
                  {totalItems > 0 && (
                    <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white font-bold">
                      {totalItems > 99 ? "99+" : totalItems}
                    </Badge>
                  )}
                </Link>
              </SheetClose>
            </motion.div>
          )}

          {/* Main Navigation */}
          {mobileLinks.map((link, index) => {
            const Icon = link.icon;
            return (
              <motion.div
                key={link.to}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + (index + 1) * 0.1 }}
              >
                <SheetClose asChild>
                  <Link
                    to={link.to}
                    className="flex items-center gap-4 hover:bg-orange-50 dark:hover:bg-orange-900/20 px-4 py-4 rounded-xl cursor-pointer hover:text-orange-600 dark:hover:text-orange-400 font-medium transition-all duration-300 group border border-transparent hover:border-orange-200 dark:hover:border-orange-800"
                  >
                    <Icon className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                    <span>{link.label}</span>
                  </Link>
                </SheetClose>
              </motion.div>
            );
          })}

          {/* Admin Links */}
          {user?.admin && (
            <>
              <Separator className="my-4 bg-slate-200 dark:bg-slate-700" />
              <div className="px-4 py-2">
                <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide flex items-center gap-2">
                  <SquareMenu className="w-4 h-4 text-orange-500" />
                  Owner Panel
                </h3>
              </div>
              {adminLinks.map((link, index) => {
                const Icon = link.icon;
                return (
                  <motion.div
                    key={link.to}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <SheetClose asChild>
                      <Link
                        to={link.to}
                        className="flex items-center gap-4 hover:bg-orange-50 dark:hover:bg-orange-900/20 px-4 py-4 rounded-xl cursor-pointer hover:text-orange-600 dark:hover:text-orange-400 font-medium transition-all duration-300 group border border-transparent hover:border-orange-200 dark:hover:border-orange-800"
                      >
                        <Icon className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                        <span>{link.label}</span>
                      </Link>
                    </SheetClose>
                  </motion.div>
                );
              })}
            </>
          )}

          {/* Super Admin verification links in mobile */}
          {user?.role === "admin" && (
            <>
              <Separator className="my-4 bg-slate-200 dark:bg-slate-700" />
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <SheetClose asChild>
                  <Link
                    to="/admin/dashboard"
                    className="flex items-center gap-4 hover:bg-orange-50 dark:hover:bg-orange-900/20 px-4 py-4 rounded-xl cursor-pointer hover:text-orange-600 dark:hover:text-orange-400 font-medium transition-all duration-300 group border border-transparent hover:border-orange-200 dark:hover:border-orange-800 text-orange-500 font-bold"
                  >
                    <Shield className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                    <span>Admin Dashboard</span>
                  </Link>
                </SheetClose>
              </motion.div>
            </>
          )}

          {/* Rider Dashboard links in mobile */}
          {user?.role === "rider" && (
            <>
              <Separator className="my-4 bg-slate-200 dark:bg-slate-700" />
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <SheetClose asChild>
                  <Link
                    to="/rider/dashboard"
                    className="flex items-center gap-4 hover:bg-orange-50 dark:hover:bg-orange-900/20 px-4 py-4 rounded-xl cursor-pointer hover:text-orange-600 dark:hover:text-orange-400 font-medium transition-all duration-300 group border border-transparent hover:border-orange-200 dark:hover:border-orange-800 text-orange-500 font-bold"
                  >
                    <Bike className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                    <span>Rider Dashboard</span>
                  </Link>
                </SheetClose>
              </motion.div>
            </>
          )}
        </SheetDescription>

        {/* Footer */}
        <SheetFooter className="flex flex-col gap-4 border-t border-slate-200 dark:border-slate-700 pt-6">
          <div className="flex items-center gap-3 px-2">
            <Avatar className="w-12 h-12 border-2 border-orange-200 dark:border-orange-800 shadow-lg">
              <AvatarImage src={user?.profilePicture || "/placeholder.svg"} />
              <AvatarFallback className="bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 text-orange-600 dark:text-orange-400 font-bold">
                {user?.fullname
                  ? user.fullname
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                  : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 dark:text-white">
                {user?.fullname || "User"}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {user?.email}
              </p>
            </div>
          </div>

          <SheetClose asChild>
            <motion.div whileTap={{ scale: 0.95 }}>
              {loading ? (
                <Button
                  disabled
                  className="w-full bg-orange-500 hover:bg-orange-500 text-white py-3 rounded-xl h-12"
                >
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </Button>
              ) : (
                <Button
                  onClick={logout}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group h-12"
                >
                  <LogOut className="mr-2 h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
                  Logout
                </Button>
              )}
            </motion.div>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default Navbar;
