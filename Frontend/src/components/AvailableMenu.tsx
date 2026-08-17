"use client";

import { toast } from "sonner";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter } from "./ui/card";
import type { MenuItem, MenuAddOn } from "@/types/restaurantType";

import { useCartStore } from "@/store/useCartStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { Plus, Minus, IndianRupee, Sparkles, Heart, Check, Leaf, SlidersHorizontal, AlertTriangle } from "lucide-react";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Checkbox } from "./ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

interface AvailableMenuProps {
  menus?: MenuItem[];
  restaurantId?: string;
  restaurantName?: string;
  isOutletOpen?: boolean;
  isKitchenBusy?: boolean;
  closedReason?: string;
}

const AvailableMenu = ({
  menus,
  restaurantId,
  restaurantName,
  isOutletOpen = true,
  isKitchenBusy = false,
  closedReason,
}: AvailableMenuProps) => {
  const { cart, restaurantId: currentCartRestId, restaurantName: currentCartRestName, addToCart, clearCart } = useCartStore();

  const { isMenuFavorite, toggleFavoriteMenu } = useFavoritesStore();

  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());

  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [dietaryFilter, setDietaryFilter] = useState<"all" | "veg" | "non-veg">("all");

  // Customization modal state
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<MenuAddOn[]>([]);

  // Cross-restaurant replacement warning state
  const [pendingItemToAdd, setPendingItemToAdd] = useState<{ item: MenuItem; addOns?: MenuAddOn[] } | null>(null);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);

  useEffect(() => {
    if (menus) {
      menus.forEach((menu, index) => {
        setTimeout(() => {
          setVisibleItems((prev) => new Set([...prev, menu._id]));
        }, index * 100);
      });
    }
  }, [menus]);

  // Extract unique categories from menus
  const categories = useMemo(() => {
    const set = new Set<string>();
    menus?.forEach((m) => {
      if (m.category) set.add(m.category);
    });
    return ["All", ...Array.from(set)];
  }, [menus]);

  // Filtered menu items
  const filteredMenus = useMemo(() => {
    return (menus || []).filter((m) => {
      const matchCategory = selectedCategory === "All" || m.category === selectedCategory;
      const isItemVeg = m.isVeg !== false;
      const matchDiet =
        dietaryFilter === "all"
          ? true
          : dietaryFilter === "veg"
            ? isItemVeg
            : !isItemVeg;
      return matchCategory && matchDiet;
    });
  }, [menus, selectedCategory, dietaryFilter]);

  const toggleFavorite = (menuId: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(menuId)) {
        newFavorites.delete(menuId);
      } else {
        newFavorites.add(menuId);
      }
      return newFavorites;
    });
  };

  const handleAddToCartClick = (item: MenuItem) => {
    if (!isOutletOpen) {
      toast.error(closedReason || "This restaurant is currently closed. Orders cannot be added to cart.");
      return;
    }
    if (isKitchenBusy) {
      toast.error("The kitchen is currently in Rush Mode. Orders are temporarily paused.");
      return;
    }
    // If dish has customizable add-ons, open customization dialog
    if (item.addOns && item.addOns.length > 0) {
      setCustomizingItem(item);
      setSelectedAddOns([]);
      return;
    }

    processAddToCart(item, []);
  };


  const processAddToCart = (item: MenuItem, addOns: MenuAddOn[]) => {
    // Check for multi-restaurant conflict
    if ((cart || []).length > 0 && restaurantId && currentCartRestId && currentCartRestId !== restaurantId) {
      setPendingItemToAdd({ item, addOns });
      setIsConflictModalOpen(true);
      return;
    }

    addToCart(item, restaurantId, restaurantName, addOns);
    const addOnText = addOns.length > 0 ? ` with ${addOns.length} add-on(s)` : "";
    toast.success(`${item.name}${addOnText} added to cart!`, {
      description: "Continue browsing or go to cart to checkout.",
    });
    setCustomizingItem(null);
  };


  const handleConfirmConflict = () => {
    clearCart();
    if (pendingItemToAdd) {
      addToCart(pendingItemToAdd.item, restaurantId, restaurantName, pendingItemToAdd.addOns);
      toast.success(`Cart updated with items from ${restaurantName || "this restaurant"}!`);
    }
    setIsConflictModalOpen(false);
    setPendingItemToAdd(null);
  };

  const handleCancelConflict = () => {
    setIsConflictModalOpen(false);
    setPendingItemToAdd(null);
  };

  const incrementAddOnQuantity = (addon: MenuAddOn) => {
    setSelectedAddOns((prev) => {
      const existing = prev.find((a) => a.name === addon.name);
      if (existing) {
        return prev.map((a) =>
          a.name === addon.name ? { ...a, quantity: (a.quantity || 1) + 1 } : a
        );
      } else {
        return [...prev, { ...addon, quantity: 1 }];
      }
    });
  };

  const decrementAddOnQuantity = (addon: MenuAddOn) => {
    setSelectedAddOns((prev) => {
      const existing = prev.find((a) => a.name === addon.name);
      if (!existing) return prev;
      if ((existing.quantity || 1) <= 1) {
        return prev.filter((a) => a.name !== addon.name);
      } else {
        return prev.map((a) =>
          a.name === addon.name ? { ...a, quantity: (a.quantity || 1) - 1 } : a
        );
      }
    });
  };

  const customizationTotal = useMemo(() => {
    if (!customizingItem) return 0;
    const basePrice = Number(customizingItem.price) || 0;
    const addOnsTotal = selectedAddOns.reduce(
      (sum, a) => sum + (Number(a.price) || 0) * (Number(a.quantity) || 1),
      0
    );
    return basePrice + addOnsTotal;
  }, [customizingItem, selectedAddOns]);



  if (!menus || menus.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
        <div className="w-16 h-16 bg-orange-100 dark:bg-orange-950/40 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-orange-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">
          No Menu Items Available
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          This restaurant hasn't listed any items on their menu yet. Please check back later!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="text-center relative">
        <div className="inline-block">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Our Menu & Delicacies
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Discover our carefully crafted dishes with customizable add-ons and fresh ingredients
          </p>
          <div
            className="w-16 sm:w-24 h-1 bg-gradient-to-r from-orange-400 to-orange-600 mx-auto mt-3 sm:mt-4 rounded-full"
          />
        </div>

        <Sparkles
          className="absolute top-0 right-1/4 w-4 h-4 sm:w-6 sm:h-6 text-orange-400 animate-spin opacity-60"
          style={{ animationDuration: "4s" }}
        />
      </div>

      {/* Menu Filters: Dietary Switch (All / Veg / Non-Veg) & Category Pills */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 sm:px-0 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        {/* Category Pills with hidden scrollbar */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-full sm:max-w-[65%] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/20 scale-105"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-orange-100 dark:hover:bg-slate-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 3-Way Dietary Switch: All | Veg | Non-Veg */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-700/80 p-1 rounded-full border border-slate-200 dark:border-slate-600 shadow-inner">
          <button
            onClick={() => setDietaryFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
              dietaryFilter === "all"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
            }`}
          >
            All
          </button>

          <button
            onClick={() => setDietaryFilter("veg")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
              dietaryFilter === "veg"
                ? "bg-green-600 text-white shadow-sm shadow-green-600/30"
                : "text-slate-600 dark:text-slate-300 hover:text-green-600 dark:hover:text-green-400"
            }`}
          >
            <span className="w-3 h-3 rounded-xs border border-current flex items-center justify-center p-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
            </span>
            <span>Veg</span>
          </button>

          <button
            onClick={() => setDietaryFilter("non-veg")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
              dietaryFilter === "non-veg"
                ? "bg-red-600 text-white shadow-sm shadow-red-600/30"
                : "text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400"
            }`}
          >
            <span className="w-3 h-3 rounded-xs border border-current flex items-center justify-center p-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
            </span>
            <span>Non-Veg</span>
          </button>
        </div>
      </div>


      {/* Menu Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 px-4 sm:px-0">
        {filteredMenus.map((menu: MenuItem, index: number) => {
          const isVeg = menu.isVeg !== false;
          const hasAddOns = menu.addOns && menu.addOns.length > 0;

          return (
            <Card
              key={menu._id}
              className={`group bg-white dark:bg-slate-800 border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 rounded-xl sm:rounded-2xl overflow-hidden relative flex flex-col justify-between ${
                visibleItems.has(menu._id)
                  ? "opacity-100 translate-y-0 scale-100"
                  : "opacity-0 translate-y-10 scale-95"
              }`}
              style={{
                transitionDelay: `${index * 50}ms`,
              }}
            >
              {/* Favorite Button */}
              <button
                onClick={() => toggleFavoriteMenu(menu)}
                className={`absolute top-3 right-3 z-10 p-1.5 sm:p-2 rounded-full shadow-lg hover:scale-110 transition-all duration-300 ${
                  isMenuFavorite(menu._id)
                    ? "bg-rose-500 text-white"
                    : "bg-white/90 dark:bg-slate-800/90 text-slate-400 hover:text-red-500"
                }`}
                title={isMenuFavorite(menu._id) ? "Remove from wishlist" : "Save to wishlist"}
              >
                <Heart
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all duration-300 ${
                    isMenuFavorite(menu._id)
                      ? "fill-current text-white"
                      : "text-slate-400 group-hover/fav:text-red-400"
                  }`}
                />
              </button>


              {/* Dietary Indicator Badge */}
              <div className="absolute top-3 left-3 z-10">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold shadow-md backdrop-blur-md ${
                    isVeg
                      ? "bg-white/95 text-green-700 border border-green-500"
                      : "bg-white/95 text-red-700 border border-red-500"
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isVeg ? "bg-green-600" : "bg-red-600"
                    }`}
                  />
                  <span>{isVeg ? "Veg" : "Non-Veg"}</span>
                </span>
              </div>

              {/* Image Container */}
              <div className="relative overflow-hidden">
                <img
                  src={menu?.image || "/placeholder.svg"}
                  alt={menu.name}
                  className="w-full h-44 sm:h-48 md:h-56 object-cover group-hover:scale-110 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
                
                {/* Floating Price Badge */}
                <div className="absolute bottom-3 left-3 bg-orange-500 text-white px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                  <IndianRupee className="w-2.5 h-2.5 sm:w-3 sm:h-3 inline mr-0.5" />
                  {menu?.price}
                </div>

                {hasAddOns && (
                  <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-sm text-orange-300 text-[11px] px-2 py-0.5 rounded-full font-semibold border border-orange-400/30 flex items-center gap-1">
                    <SlidersHorizontal className="w-3 h-3" />
                    <span>Customizable</span>
                  </div>
                )}
              </div>

              <CardContent className="p-4 sm:p-6 space-y-3 flex-grow">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-orange-600 transition-colors duration-300 line-clamp-1">
                    {menu.name}
                  </h3>
                  {menu.category && (
                    <Badge variant="outline" className="text-[10px] px-2 py-0.5 font-medium border-slate-300 dark:border-slate-600">
                      {menu.category}
                    </Badge>
                  )}
                </div>

                {menu.availability && (
                  <div>
                    <Badge
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                        menu.availability === "Available"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                      }`}
                    >
                      {menu.availability}
                    </Badge>
                  </div>
                )}

                <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed line-clamp-2 min-h-[36px]">
                  {menu.description}
                </p>

                <div className="flex items-center gap-1">
                  <IndianRupee className="w-4 h-4 text-orange-600 dark:text-orange-400 font-bold" />
                  <span className="text-xl font-bold text-slate-900 dark:text-white">
                    {menu?.price}
                  </span>
                </div>
              </CardContent>

              <CardFooter className="p-4 sm:p-6 pt-0">
                <Button
                  onClick={() => handleAddToCartClick(menu)}
                  disabled={menu.availability === "Out of Stock" || !isOutletOpen || isKitchenBusy}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-2.5 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-md hover:shadow-orange-500/20 group/btn relative overflow-hidden text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4 mr-2 group-hover/btn:rotate-90 transition-transform duration-300" />
                  <span>
                    {!isOutletOpen
                      ? "Outlet Closed"
                      : isKitchenBusy
                      ? "Kitchen Busy"
                      : menu.availability === "Out of Stock"
                      ? "Out of Stock"
                      : hasAddOns
                      ? "Customize & Add"
                      : "Add to Cart"}
                  </span>
                </Button>
              </CardFooter>

            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredMenus.length === 0 && (
        <div className="text-center py-12 sm:py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 px-4">
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Leaf className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            No Menu Items Available
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Try adjusting your category or Pure Veg filter to see more delicious options.
          </p>

        </div>
      )}

      {/* Item Customization Dialog Modal */}
      <Dialog open={!!customizingItem} onOpenChange={(open) => !open && setCustomizingItem(null)}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  customizingItem?.isVeg !== false ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span>Customize {customizingItem?.name}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="py-3 space-y-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Select optional add-ons to customize your dish:
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {customizingItem?.addOns?.map((addon) => {
                const selected = selectedAddOns.find((a) => a.name === addon.name);
                const qty = selected?.quantity || 0;
                const isSelected = qty > 0;

                return (
                  <div
                    key={addon.name}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isSelected
                        ? "bg-orange-50/80 dark:bg-orange-950/30 border-orange-500 shadow-xs"
                        : "bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">
                        {addon.name}
                      </span>
                      <span className="text-xs text-orange-600 dark:text-orange-400 font-bold">
                        +₹{addon.price} each {qty > 1 ? `(₹${addon.price * qty} total)` : ""}
                      </span>
                    </div>

                    {isSelected ? (
                      <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-orange-300 dark:border-orange-700 rounded-full p-1 shadow-xs">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => decrementAddOnQuantity(addon)}
                          className="h-6 w-6 rounded-full hover:bg-orange-100 dark:hover:bg-slate-700 text-orange-600"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-5 text-center font-extrabold text-xs text-slate-900 dark:text-white">
                          {qty}
                        </span>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => incrementAddOnQuantity(addon)}
                          className="h-6 w-6 rounded-full bg-orange-500 hover:bg-orange-600 text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => incrementAddOnQuantity(addon)}
                        className="h-8 text-xs font-bold bg-white dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-300 dark:border-orange-600 rounded-lg px-3"
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>


            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Price:</span>
              <span className="text-xl font-extrabold text-orange-600 dark:text-orange-400">
                ₹{customizationTotal}
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setCustomizingItem(null)}
              className="rounded-xl border-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={() => customizingItem && processAddToCart(customizingItem, selectedAddOns)}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl"
            >
              Add with Add-ons (₹{customizationTotal})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Multi-Restaurant Conflict Alert Dialog */}
      <AlertDialog open={isConflictModalOpen} onOpenChange={setIsConflictModalOpen}>
        <AlertDialogContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <span>Replace Items in Cart?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 dark:text-slate-300 text-sm">
              Your cart currently contains dishes from{" "}
              <strong className="text-slate-900 dark:text-white font-bold">
                {currentCartRestName || "another restaurant"}
              </strong>
              . You cannot order from multiple restaurants simultaneously.
              <br />
              <br />
              Do you want to discard your current cart and start a fresh order from{" "}
              <strong className="text-orange-600 dark:text-orange-400 font-bold">
                {restaurantName || "this restaurant"}
              </strong>
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-slate-300">
              Keep Current Cart
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmConflict}
              className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl"
            >
              Yes, Discard & Add
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AvailableMenu;
