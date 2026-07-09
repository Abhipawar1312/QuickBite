"use client";

import { Timer, MapPin, Sparkles, Star } from "lucide-react";
import { Badge } from "./ui/badge";
import AvailableMenu from "./AvailableMenu";
import { useRestaurantStore } from "@/store/useRestaurantStore";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { useReviewStore } from "@/store/useReviewStore";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { motion, AnimatePresence } from "framer-motion";

const RestaurantDetail = () => {
  const params = useParams();
  const { singleRestaurant, getSingleRestaurant, updateSingleRestaurantMenu, updateSingleRestaurantRatings } = useRestaurantStore();
  const { reviews, getRestaurantReviews, addLocalReview } = useReviewStore();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    getSingleRestaurant(params.id!);
    getRestaurantReviews(params.id!);
    setTimeout(() => setIsLoaded(true), 100);
  }, [params.id]);

  useEffect(() => {
    if (!params.id) return;

    const socket = io("http://localhost:8000");

    socket.on("restaurant_menu_changed", (data: any) => {
      console.log("Restaurant menu changed in real-time via socket:", data);
      if (data.restaurantId === params.id) {
        updateSingleRestaurantMenu(data);
      }
    });

    socket.on("new_review", (data: any) => {
      console.log("New review received in real-time via socket:", data);
      if (data.review.restaurant === params.id) {
        addLocalReview(data.review);
        if (data.restaurant) {
          updateSingleRestaurantRatings(data.restaurant.averageRating, data.restaurant.numReviews);
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [params.id, updateSingleRestaurantMenu, addLocalReview, updateSingleRestaurantRatings]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Mobile-Optimized Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-black/30 z-10" />

        {/* Animated Background Pattern */}
        <div className="absolute inset-0 z-5">
          <div className="absolute top-4 left-4 md:top-10 md:left-10 w-12 h-12 md:w-20 md:h-20 bg-orange-400/10 rounded-full animate-pulse" />
          <div
            className="absolute top-16 right-8 md:top-32 md:right-20 w-8 h-8 md:w-16 md:h-16 bg-blue-400/10 rounded-full animate-bounce"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute bottom-8 left-1/4 w-6 h-6 md:w-12 md:h-12 bg-purple-400/10 rounded-full animate-ping"
            style={{ animationDelay: "2s" }}
          />
        </div>

        <div
          className={`relative w-full h-[300px] sm:h-[400px] md:h-[500px] transition-all duration-1000 ${
            isLoaded ? "scale-100 opacity-100" : "scale-110 opacity-0"
          }`}
        >
          <img
            src={
              singleRestaurant?.imageUrl ||
              "/placeholder.svg?height=500&width=1200&query=restaurant interior"
            }
            alt="Restaurant"
            className="object-cover w-full h-full transition-transform duration-700 hover:scale-105"
          />
        </div>

        {/* Mobile-Optimized Overlay Content */}
        <div className="absolute inset-0 z-20 flex items-end">
          <div className="w-full bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 sm:p-6 md:p-8">
            <div className="max-w-6xl mx-auto">
              <div
                className={`text-white transition-all duration-1000 delay-300 ${
                  isLoaded
                    ? "translate-y-0 opacity-100"
                    : "translate-y-10 opacity-0"
                }`}
              >
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent animate-pulse leading-tight">
                  {singleRestaurant?.restaurantName || "Loading..."}
                </h1>
                <div
                  className={`flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-4 transition-all duration-1000 delay-500 ${
                    isLoaded
                      ? "translate-x-0 opacity-100"
                      : "-translate-x-10 opacity-0"
                  }`}
                >
                  {singleRestaurant && (
                    <div className="flex items-center gap-1.5 hover:scale-105 transition-transform duration-300 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-sm font-semibold">
                      <Star
                        className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-400 text-yellow-400 animate-pulse"
                      />
                      <span>{singleRestaurant.averageRating || "0.0"}</span>
                      <span className="text-xs text-orange-200">
                        ({singleRestaurant.numReviews || 0} reviews)
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 hover:scale-110 transition-transform duration-300">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 animate-bounce" />
                    <span className="text-sm sm:text-base">
                      {singleRestaurant?.city}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile-Optimized Floating Elements */}
        <div className="absolute top-1/2 right-4 sm:right-10 z-30">
          <Sparkles
            className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400 animate-spin"
            style={{ animationDuration: "4s" }}
          />
        </div>
      </div>

      {/* Mobile-Optimized Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12">
        {/* Mobile-Optimized Restaurant Info Card */}
        <div
          className={`bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 mb-8 sm:mb-10 md:mb-12 border border-slate-200 dark:border-slate-700 transition-all duration-1000 delay-700 hover:shadow-2xl hover:-translate-y-1 sm:hover:-translate-y-2 ${
            isLoaded ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Left Column - Mobile Stacked */}
            <div
              className={`transition-all duration-1000 delay-900 ${
                isLoaded
                  ? "translate-x-0 opacity-100"
                  : "-translate-x-10 opacity-0"
              }`}
            >
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6 hover:text-orange-600 transition-colors duration-300">
                About This Restaurant
              </h2>

              {/* Mobile-Optimized Cuisines */}
              <div className="mb-6">
                <h3 className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-3">
                  Cuisines
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {singleRestaurant?.cuisines.map(
                    (cuisine: string, idx: number) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className={`bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-orange-100 dark:hover:bg-orange-900/30 hover:text-orange-600 dark:hover:text-orange-400 hover:scale-105 sm:hover:scale-110 transition-all duration-300 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium cursor-pointer transform hover:rotate-1 sm:hover:rotate-2`}
                        style={{
                          animationDelay: `${1000 + idx * 100}ms`,
                          animation: isLoaded
                            ? "slideInUp 0.6s ease-out forwards"
                            : "none",
                        }}
                      >
                        {cuisine}
                      </Badge>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Mobile Stacked */}
            <div
              className={`transition-all duration-1000 delay-1100 ${
                isLoaded
                  ? "translate-x-0 opacity-100"
                  : "translate-x-10 opacity-0"
              }`}
            >
              <h3 className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-3">
                Service Info
              </h3>

              {/* Mobile-Optimized Delivery Time */}
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-600 hover:border-orange-300 dark:hover:border-orange-600 transition-all duration-300 hover:shadow-lg group">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 dark:bg-orange-900/30 p-2 sm:p-3 rounded-full group-hover:scale-110 transition-transform duration-300 group-hover:rotate-12">
                    <Timer className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400 group-hover:animate-spin" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 group-hover:text-orange-600 transition-colors duration-300">
                      Delivery Time
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white group-hover:scale-105 transition-transform duration-300">
                      {singleRestaurant?.deliveryTime || "N/A"}
                      <span className="text-base sm:text-lg font-normal text-slate-600 dark:text-slate-400 ml-1">
                        mins
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile-Optimized Available Menu Section */}
        <div
          className={`transition-all duration-1000 delay-1300 mb-10 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
        >
          <AvailableMenu menus={singleRestaurant?.menus} />
        </div>

        {/* Customer Reviews Section */}
        <div
          className={`bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 transition-all duration-1000 delay-1000 hover:shadow-2xl ${
            isLoaded ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
          }`}
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-slate-200 dark:border-slate-700 pb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Customer Reviews & Ratings
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                What other food lovers think of our dishes and service
              </p>
            </div>
            {singleRestaurant && (
              <div className="flex items-center gap-4 bg-orange-50 dark:bg-orange-950/20 px-6 py-4 rounded-2xl border border-orange-100 dark:border-orange-900/50">
                <div className="text-center">
                  <span className="text-4xl font-extrabold text-orange-600 dark:text-orange-400 block">
                    {singleRestaurant.averageRating || "0.0"}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    out of 5
                  </span>
                </div>
                <div className="h-12 w-[2px] bg-slate-200 dark:bg-slate-700" />
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= Math.round(singleRestaurant.averageRating || 0)
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1 block">
                    Based on {singleRestaurant.numReviews || 0} reviews
                  </span>
                </div>
              </div>
            )}
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-medium">
                No reviews yet. Be the first to order and review!
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6 max-h-[500px] overflow-y-auto pr-2">
              <AnimatePresence initial={false}>
                {reviews.map((review, idx) => (
                  <motion.div
                    key={review._id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="p-5 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-all duration-300"
                  >
                    <div className="flex items-start gap-4 mb-3">
                      <Avatar className="w-10 h-10 border-2 border-orange-500 shadow-md">
                        <AvatarImage src={review.user?.profilePicture} alt={review.user?.fullname} />
                        <AvatarFallback className="bg-orange-500 text-white font-bold">
                          {review.user?.fullname?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                            {review.user?.fullname}
                          </h4>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(review.createdAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric"
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed pl-14">
                      "{review.comment}"
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Mobile-Optimized Custom CSS */}
      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default RestaurantDetail;
