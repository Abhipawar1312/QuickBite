import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Plus, TrendingUp, Heart } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useRecommendationStore } from "@/store/useRecommendationStore";
import { useCartStore } from "@/store/useCartStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { useUserStore } from "@/store/useUserStore";
import { MenuItem } from "@/types/restaurantType";
import { toast } from "sonner";

interface SmartRecommendationsProps {
  variant: "paired" | "trending" | "personalized";
  menuId?: string;
  restaurantId?: string;
  excludeIds?: string[];
  city?: string;
  title?: string;
  className?: string;
}

export const SmartRecommendations: React.FC<SmartRecommendationsProps> = ({
  variant,
  menuId,
  restaurantId,
  excludeIds,
  city,
  title,
  className = "",
}) => {
  const {
    frequentlyPairedItems,
    trendingDishes,
    personalizedDishes,
    fetchFrequentlyPaired,
    fetchTrending,
    fetchPersonalized,
    loadingPaired,
    loadingTrending,
    loadingPersonalized,
  } = useRecommendationStore();

  const { user } = useUserStore();
  const effectiveCity =
    city ||
    user?.savedAddresses?.find((a) => a.isDefault)?.city ||
    user?.city ||
    "";

  const { addToCart } = useCartStore();
  const { toggleFavoriteMenu, isMenuFavorite } = useFavoritesStore();

  useEffect(() => {
    if (variant === "paired") {
      fetchFrequentlyPaired(menuId, restaurantId, excludeIds);
    } else if (variant === "trending") {
      fetchTrending(effectiveCity);
    } else if (variant === "personalized") {
      fetchPersonalized();
    }
  }, [variant, menuId, restaurantId, effectiveCity, JSON.stringify(excludeIds), fetchFrequentlyPaired, fetchTrending, fetchPersonalized]);


  const rawItems: MenuItem[] =
    variant === "paired"
      ? frequentlyPairedItems
      : variant === "trending"
      ? trendingDishes
      : personalizedDishes;

  // Strictly deduplicate by ID and name, and filter out excluded items
  const seenIds = new Set<string>();
  const items: MenuItem[] = [];
  rawItems.forEach((item) => {
    if (!item) return;
    const itemId = (item._id || item.name).toString();
    if (excludeIds && excludeIds.includes(itemId)) return;
    if (menuId && itemId === menuId.toString()) return;
    if (!seenIds.has(itemId)) {
      seenIds.add(itemId);
      items.push(item);
    }
  });


  const isLoading =
    variant === "paired"
      ? loadingPaired
      : variant === "trending"
      ? loadingTrending
      : loadingPersonalized;

  const handleAdd = (item: MenuItem) => {
    const targetRestId = item.restaurant?._id || restaurantId;
    const targetRestName = item.restaurant?.restaurantName;
    addToCart(item, targetRestId, targetRestName);
    toast.success(`Added ${item.name} to cart!`);
  };


  const defaultTitle =
    variant === "paired"
      ? "🔥 Frequently Paired Together"
      : variant === "trending"
      ? "📈 Trending In Your Area"
      : "✨ Recommended For You";

  if (!isLoading && items.length === 0) {
    return null;
  }

  return (
    <div className={`my-6 p-5 rounded-3xl bg-gradient-to-br from-orange-50/60 via-amber-50/40 to-orange-100/40 dark:from-slate-900 dark:via-slate-800/80 dark:to-orange-950/20 border border-orange-200/70 dark:border-orange-900/40 shadow-lg backdrop-blur-sm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-md">
            {variant === "trending" ? <TrendingUp className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">
              {title || defaultTitle}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {variant === "paired"
                ? "Customers who ordered this also loved:"
                : variant === "trending"
                ? "Popular dishes loved by foodies nearby"
                : "Curated based on your favorite flavors"}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 font-bold border-orange-300">
          Recommended
        </Badge>

      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white/60 dark:bg-slate-800/60 rounded-2xl p-3 border border-slate-200/50 dark:border-slate-700/50 animate-pulse flex gap-3 items-center">
              <div className="w-16 h-16 rounded-xl bg-slate-200 dark:bg-slate-700" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {items.slice(0, 4).map((item) => {
            const isFav = isMenuFavorite(item._id);
            const dishImage = item.image || (item as any).imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c";
            const restName = item.restaurant?.restaurantName;

            return (
              <motion.div
                key={item._id}
                whileHover={{ y: -3, scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="group bg-white dark:bg-slate-800/90 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-700 shadow-sm hover:shadow-md flex flex-col justify-between relative overflow-hidden"
              >
                <div className="flex gap-3 items-center">
                  <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700">
                    <img
                      src={dishImage}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavoriteMenu(item);
                      }}
                      className={`absolute top-1 right-1 p-1 rounded-full backdrop-blur-md transition-all ${
                        isFav
                          ? "bg-red-500 text-white"
                          : "bg-black/30 text-white hover:bg-red-500 hover:text-white"
                      }`}
                      title={isFav ? "Remove from Favorites" : "Add to Favorites"}
                    >
                      <Heart className="w-3 h-3 fill-current" />
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                          item.isVeg !== false ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                        {item.name}
                      </h4>
                    </div>

                    {restName && (
                      <p className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold truncate mt-0.5">
                        🏪 {restName}
                      </p>
                    )}

                    <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {item.description || "Fresh & delicious dish"}
                    </p>
                    <span className="text-xs font-black text-orange-600 dark:text-orange-400 mt-1 block">
                      ₹{item.price}
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => handleAdd(item)}
                    className="h-7 px-3 text-[11px] font-bold rounded-lg bg-orange-500 hover:bg-orange-600 text-white shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

