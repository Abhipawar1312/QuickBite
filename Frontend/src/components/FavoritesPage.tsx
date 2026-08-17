import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, UtensilsCrossed, Store, ArrowRight, Plus, Star, Clock, MapPin, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { useCartStore } from "@/store/useCartStore";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { MenuItem, Restaurant } from "@/types/restaurantType";

export const FavoritesPage: React.FC = () => {
  const {
    favoriteRestaurants,
    favoriteMenus,
    fetchFavorites,
    toggleFavoriteRestaurant,
    toggleFavoriteMenu,
    loading,
  } = useFavoritesStore();

  const { addToCart } = useCartStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleAddDish = (dish: MenuItem) => {
    addToCart(dish, dish.restaurant?._id, dish.restaurant?.restaurantName);
    toast.success(`Added ${dish.name} to cart!`, {
      description: dish.restaurant?.restaurantName
        ? `From ${dish.restaurant.restaurantName}`
        : undefined,
    });
  };

  const uniqueRestaurantsCount = React.useMemo(() => {
    const uniqueIds = new Set<string>();
    favoriteRestaurants.forEach((r) => {
      if (r._id) uniqueIds.add(r._id.toString());
      else if (r.restaurantName) uniqueIds.add(r.restaurantName);
    });
    favoriteMenus.forEach((dish) => {
      if (dish.restaurant?._id) {
        uniqueIds.add(dish.restaurant._id.toString());
      } else if (dish.restaurant?.restaurantName) {
        uniqueIds.add(dish.restaurant.restaurantName);
      }
    });
    return uniqueIds.size;
  }, [favoriteRestaurants, favoriteMenus]);

  const hasNoFavorites = favoriteRestaurants.length === 0 && favoriteMenus.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-red-600 text-white flex items-center justify-center shadow-lg">
              <Heart className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                Your Wishlist & Favorites
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Quick 1-tap ordering for your favorite eateries and craving dishes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-3 py-1 rounded-xl text-xs font-bold border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400">
              {uniqueRestaurantsCount} {uniqueRestaurantsCount === 1 ? "Restaurant" : "Restaurants"}
            </Badge>
            <Badge variant="outline" className="px-3 py-1 rounded-xl text-xs font-bold border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400">
              {favoriteMenus.length} {favoriteMenus.length === 1 ? "Dish" : "Dishes"}
            </Badge>
          </div>


        </div>

        {/* Global Empty State */}
        {hasNoFavorites && !loading && (
          <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/30 text-rose-500 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 fill-current" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Your wishlist is empty</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Explore delicious foods and top-rated restaurants, and tap the heart icon on any restaurant or dish to save it here for instant 1-tap re-ordering!
            </p>
            <Button
              onClick={() => navigate("/search/all")}
              className="mt-6 rounded-2xl px-6 h-11 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-lg flex items-center gap-2 mx-auto"
            >
              Discover Food & Restaurants <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Section 1: Favorite Restaurants */}
        {favoriteRestaurants.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <Store className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                Favorite Restaurants ({favoriteRestaurants.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteRestaurants.map((restaurant) => (
                <motion.div
                  key={restaurant._id}
                  whileHover={{ y: -4 }}
                  className="group bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="relative h-44 overflow-hidden bg-slate-100 dark:bg-slate-700">
                    <img
                      src={restaurant.imageUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4"}
                      alt={restaurant.restaurantName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <button
                      onClick={() => toggleFavoriteRestaurant(restaurant)}
                      className="absolute top-3 right-3 p-2 rounded-full bg-white/90 dark:bg-slate-900/90 text-rose-500 backdrop-blur-md shadow-md hover:scale-110 transition-transform"
                      title="Remove from favorites"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </button>
                    <div className="absolute bottom-3 left-3 flex gap-2">
                      <Badge className="bg-black/60 backdrop-blur-md text-white border-0 text-[11px] font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-orange-400" />
                        {restaurant.deliveryTime || 30} mins
                      </Badge>
                      {restaurant.averageRating && restaurant.averageRating > 0 ? (
                        <Badge className="bg-green-600 text-white border-0 text-[11px] font-bold flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" />
                          {restaurant.averageRating.toFixed(1)}
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                        {restaurant.restaurantName}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                        <span className="truncate">{restaurant.address || restaurant.city}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {(restaurant.cuisines || []).slice(0, 3).map((c, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-semibold bg-orange-50 dark:bg-slate-700 text-orange-700 dark:text-orange-300 px-2.5 py-0.5 rounded-full"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500">
                        {restaurant.menus?.length || 0} Menu Items
                      </span>
                      <Button
                        size="sm"
                        onClick={() => navigate(`/restaurant/${restaurant._id}`)}
                        className="rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-xs"
                      >
                        View Menu →
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Section 2: Favorite Dishes with Restaurant Association */}
        {favoriteMenus.length > 0 && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <UtensilsCrossed className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                Favorite Dishes & Menu Items ({favoriteMenus.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {favoriteMenus.map((dish) => (
                <motion.div
                  key={dish._id}
                  whileHover={{ y: -3 }}
                  className="group bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-xl transition-all flex flex-col justify-between"
                >
                  <div className="flex gap-4 items-start">
                    <div className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-700 shadow-sm">
                      <img
                        src={dish.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"}
                        alt={dish.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <button
                        onClick={() => toggleFavoriteMenu(dish)}
                        className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-rose-500 text-white shadow-md hover:scale-110 transition-transform"
                        title="Remove from favorites"
                      >
                        <Heart className="w-3 h-3 fill-current" />
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${
                            dish.isVeg !== false ? "bg-green-500" : "bg-red-500"
                          }`}
                        />
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                          {dish.name}
                        </h4>
                      </div>

                      {/* Display Associated Restaurant Name */}
                      {dish.restaurant && (
                        <Link
                          to={`/restaurant/${dish.restaurant._id}`}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400 mt-1 truncate hover:underline"
                        >
                          <Store className="w-3 h-3 shrink-0" />
                          <span>From {dish.restaurant.restaurantName}</span>
                        </Link>
                      )}

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                        {dish.description || "Fresh and delectable dish"}
                      </p>
                      <span className="text-sm font-black text-orange-600 dark:text-orange-400 mt-1.5 block">
                        ₹{dish.price}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex justify-between items-center">
                    {dish.restaurant ? (
                      <Link
                        to={`/restaurant/${dish.restaurant._id}`}
                        className="text-[11px] font-semibold text-slate-500 hover:text-orange-600"
                      >
                        View Restaurant →
                      </Link>
                    ) : <span />}

                    <Button
                      size="sm"
                      onClick={() => handleAddDish(dish)}
                      className="h-8 px-4 text-xs font-bold rounded-xl bg-orange-500 hover:bg-orange-600 text-white shadow-sm flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add to Cart
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
