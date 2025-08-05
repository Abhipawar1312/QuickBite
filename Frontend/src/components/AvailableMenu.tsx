"use client";

import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter } from "./ui/card";
import type { MenuItem } from "@/types/restaurantType";
import { useCartStore } from "@/store/useCartStore";
import { Plus, IndianRupee, Sparkles, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Badge } from "./ui/badge";

const AvailableMenu = ({ menus }: { menus?: MenuItem[] }) => {
  const navigate = useNavigate();
  const { addToCart } = useCartStore();
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (menus) {
      menus.forEach((menu, index) => {
        setTimeout(() => {
          setVisibleItems((prev) => new Set([...prev, menu._id]));
        }, index * 150);
      });
    }
  }, [menus]);

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

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Mobile-Optimized Section Header */}
      <div className="text-center relative px-4">
        {/* Mobile-Friendly Floating Elements */}
        <div className="absolute -top-2 left-1/4 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-400 rounded-full animate-ping" />
        <div className="absolute -top-1 right-1/3 w-1 h-1 bg-blue-400 rounded-full animate-pulse" />

        <div className="animate-fade-in-up">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 hover:scale-105 transition-transform duration-300">
            Our Menu
          </h2>
          <p
            className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto animate-fade-in-up px-4"
            style={{ animationDelay: "0.2s" }}
          >
            Discover our carefully crafted dishes made with the finest
            ingredients
          </p>
          <div
            className="w-16 sm:w-24 h-1 bg-gradient-to-r from-orange-400 to-orange-600 mx-auto mt-3 sm:mt-4 rounded-full animate-scale-in"
            style={{ animationDelay: "0.4s" }}
          />
        </div>

        {/* Mobile-Optimized Floating Sparkles */}
        <Sparkles
          className="absolute top-0 right-1/4 w-4 h-4 sm:w-6 sm:h-6 text-orange-400 animate-spin opacity-60"
          style={{ animationDuration: "4s" }}
        />
      </div>

      {/* Mobile-Optimized Menu Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 px-4 sm:px-0">
        {menus?.map((menu: MenuItem, index: number) => (
          <Card
            key={menu._id}
            className={`group bg-white dark:bg-slate-800 border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 sm:hover:-translate-y-3 hover:rotate-1 rounded-xl sm:rounded-2xl overflow-hidden relative flex flex-col justify-between ${
              visibleItems.has(menu._id)
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-10 scale-95"
            }`}
            style={{
              transitionDelay: `${index * 100}ms`,
            }}
          >
            {/* Mobile-Optimized Favorite Button */}
            <button
              onClick={() => toggleFavorite(menu._id)}
              className="absolute top-3 right-3 z-10 p-1.5 sm:p-2 bg-white/90 dark:bg-slate-800/90 rounded-full shadow-lg hover:scale-110 transition-all duration-300 group/fav"
            >
              <Heart
                className={`w-3 h-3 sm:w-4 sm:h-4 transition-all duration-300 ${
                  favorites.has(menu._id)
                    ? "fill-red-500 text-red-500 animate-pulse"
                    : "text-slate-400 group-hover/fav:text-red-400"
                }`}
              />
            </button>
            {/* Shimmer Effect */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000" />
            {/* Mobile-Optimized Image Container */}
            <div className="relative overflow-hidden">
              <img
                src={menu?.image || "/placeholder.svg"}
                alt={menu.name}
                className="w-full h-40 sm:h-48 md:h-56 object-cover group-hover:scale-110 sm:group-hover:scale-125 transition-all duration-700 group-hover:rotate-1 sm:group-hover:rotate-2"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
              {/* Mobile-Optimized Floating Price Badge */}
              <div className="absolute bottom-3 left-3 bg-orange-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-200">
                <IndianRupee className="w-2.5 h-2.5 sm:w-3 sm:h-3 inline mr-1" />
                {menu?.price}
              </div>
            </div>
            <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4 flex-grow">
              {/* Mobile-Optimized Menu Name */}
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white group-hover:bg-gradient-to-r group-hover:from-orange-600 group-hover:to-orange-400 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300 line-clamp-2">
                {menu.name}
              </h3>
              {menu.availability && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mb-2" // Added margin-bottom for spacing
                >
                  <Badge
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                      menu.availability === "Available"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                    }`}
                  >
                    {menu.availability}
                  </Badge>
                </motion.div>
              )}
              {/* Mobile-Optimized Description */}
              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed line-clamp-2 group-hover:line-clamp-3 transition-all duration-300 min-h-[40px]">
                {menu.description}
              </p>
              {/* Mobile-Optimized Price */}
              <div className="flex items-center gap-1 group-hover:animate-bounce">
                <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400 group-hover:rotate-12 transition-transform duration-300" />
                <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white group-hover:scale-110 transition-transform duration-300">
                  {menu?.price}
                </span>
              </div>
            </CardContent>
            <CardFooter className="p-4 sm:p-6 pt-0">
              <Button
                onClick={() => {
                  addToCart(menu);
                  navigate("/cart");
                }}
                disabled={menu.availability === "Out of Stock"} // Disable button if unavailable
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl group/btn relative overflow-hidden text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {/* Button Shimmer Effect */}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover/btn:translate-x-full transition-transform duration-700" />
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2 group-hover/btn:rotate-180 transition-transform duration-500" />
                <span className="relative z-10">
                  {menu.availability === "Out of Stock"
                    ? "Out of Stock"
                    : "Add to Cart"}
                </span>
                {/* Ripple Effect */}
                <div className="absolute inset-0 rounded-lg sm:rounded-xl opacity-0 group-hover/btn:opacity-100 group-hover/btn:animate-ping bg-white/20" />
              </Button>
            </CardFooter>
            {/* Card Glow Effect */}
            <div className="absolute inset-0 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
              <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-orange-400/20 to-orange-600/20 blur-xl" />
            </div>
          </Card>
        ))}
      </div>
      {/* Mobile-Optimized Empty State */}
      {(!menus || menus.length === 0) && (
        <div className="text-center py-12 sm:py-16 animate-fade-in px-4">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse hover:animate-bounce transition-all duration-300">
            <Plus
              className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400 animate-spin"
              style={{ animationDuration: "3s" }}
            />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-2 animate-fade-in-up">
            No Menu Items Available
          </h3>
          <p
            className="text-sm sm:text-base text-slate-600 dark:text-slate-400 animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            Check back later for delicious menu options
          </p>
        </div>
      )}
      {/* Mobile-Optimized Custom CSS */}
      <style>{`
      @keyframes fade-in-up {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes scale-in {
        from {
          opacity: 0;
          transform: scaleX(0);
        }
        to {
          opacity: 1;
          transform: scaleX(1);
        }
      }
      @keyframes fade-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      .animate-fade-in-up {
        animation: fade-in-up 0.8s ease-out forwards;
      }
      .animate-scale-in {
        animation: scale-in 0.8s ease-out forwards;
      }
      .animate-fade-in {
        animation: fade-in 1s ease-out forwards;
      }
    `}</style>
    </div>
  );
};

export default AvailableMenu;
