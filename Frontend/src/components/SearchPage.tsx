"use client";

import { Link, useParams } from "react-router-dom";
import FilterPage from "./FilterPage";
import { Input } from "./ui/input";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Globe, MapPin, X, Search, Star, Clock } from "lucide-react";
import { Card, CardContent, CardFooter } from "./ui/card";
import { AspectRatio } from "./ui/aspect-ratio";
import { Skeleton } from "./ui/skeleton";
import { useRestaurantStore } from "@/store/useRestaurantStore";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";

const SearchPage = () => {
  const params = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const {
    loading,
    searchedRestaurant,
    searchRestaurant,
    appliedFilter,
    setAppliedFilter,
  } = useRestaurantStore();

  useEffect(() => {
    searchRestaurant(params.text!, searchQuery, appliedFilter);
  }, [params.text!, appliedFilter]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-screen-xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Discover Restaurants
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Search and explore top-rated places to eat around you
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-8">
          {/* Filter Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <FilterPage />
          </motion.div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700"
            >
              <div className="flex gap-4 items-center">
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors duration-300" />
                  <Input
                    value={searchQuery}
                    placeholder="Search restaurants or cuisines..."
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-800 transition-all duration-300"
                  />
                </div>
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={() =>
                      searchRestaurant(params.text!, searchQuery, appliedFilter)
                    }
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </motion.div>
              </div>
            </motion.div>

            {/* Results Header & Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {searchedRestaurant?.data.length || 0} Results Found
                </h2>
                {appliedFilter.length > 0 && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {appliedFilter.length} filter
                    {appliedFilter.length > 1 ? "s" : ""} applied
                  </p>
                )}
              </div>

              {/* Applied Filters */}
              <AnimatePresence>
                {appliedFilter.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-wrap gap-2"
                  >
                    {appliedFilter.map((filter, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="relative group"
                      >
                        <Badge className="pr-8 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 rounded-full font-medium">
                          {filter}
                        </Badge>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setAppliedFilter(filter)}
                          className="absolute -right-1 -top-1 w-5 h-5 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center text-xs transition-colors duration-300"
                        >
                          <X size={12} />
                        </motion.button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Restaurant Grid */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {loading ? (
                <SearchPageSkeleton />
              ) : searchedRestaurant?.data.length === 0 ? (
                <div className="col-span-full">
                  <NoResultFound />
                </div>
              ) : (
                searchedRestaurant?.data.map((restaurant, index) => (
                  <motion.div
                    key={restaurant._id}
                    variants={cardVariants}
                    custom={index}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="group"
                  >
                    <Card className="h-full bg-white dark:bg-slate-800 border-0 shadow-lg hover:shadow-2xl transition-all duration-500 rounded-2xl overflow-hidden">
                      {/* Image */}
                      <div className="relative overflow-hidden">
                        <AspectRatio ratio={16 / 9}>
                          <img
                            src={restaurant.imageUrl || "/placeholder.svg"}
                            alt={restaurant.restaurantName}
                            className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
                          />
                        </AspectRatio>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        {/* Rating Badge */}
                        {/* <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-semibold">4.5</span>
                        </div> */}
                      </div>

                      <CardContent className="p-6 space-y-4">
                        {/* Restaurant Name */}
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-300">
                          {restaurant.restaurantName}
                        </h3>

                        {/* Location */}
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                            <MapPin className="w-4 h-4 mr-2 text-orange-500" />
                            {restaurant.city}
                          </div>
                          <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                            <Globe className="w-4 h-4 mr-2 text-blue-500" />
                            {restaurant.country}
                          </div>
                        </div>

                        {/* Cuisines */}
                        <div className="flex flex-wrap gap-2">
                          {restaurant.cuisines
                            .slice(0, 3)
                            .map((cuisine, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-orange-100 dark:hover:bg-orange-900/30 hover:text-orange-600 dark:hover:text-orange-400 transition-colors duration-300"
                              >
                                {cuisine}
                              </Badge>
                            ))}
                          {restaurant.cuisines.length > 3 && (
                            <Badge
                              variant="secondary"
                              className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                            >
                              +{restaurant.cuisines.length - 3}
                            </Badge>
                          )}
                        </div>

                        {/* Delivery Time */}
                        <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                          <Clock className="w-4 h-4 mr-2 text-green-500" />
                          {restaurant?.deliveryTime} mins delivery
                        </div>
                      </CardContent>

                      <CardFooter className="p-6 pt-0">
                        <Link
                          to={`/restaurant/${restaurant._id}`}
                          className="w-full"
                        >
                          <motion.div whileTap={{ scale: 0.95 }}>
                            <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group">
                              View Menu
                              <motion.div
                                className="ml-2"
                                animate={{ x: [0, 4, 0] }}
                                transition={{
                                  duration: 1.5,
                                  repeat: Number.POSITIVE_INFINITY,
                                }}
                              >
                                →
                              </motion.div>
                            </Button>
                          </motion.div>
                        </Link>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const SearchPageSkeleton = () => (
  <>
    {[...Array(6)].map((_, idx) => (
      <motion.div
        key={idx}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.1 }}
      >
        <Card className="bg-white dark:bg-slate-800 shadow-lg rounded-2xl overflow-hidden">
          <AspectRatio ratio={16 / 9}>
            <Skeleton className="w-full h-full" />
          </AspectRatio>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          </CardContent>
          <CardFooter className="p-6 pt-0">
            <Skeleton className="h-10 w-full rounded-xl" />
          </CardFooter>
        </Card>
      </motion.div>
    ))}
  </>
);

const NoResultFound = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700"
  >
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      className="w-24 h-24 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
    >
      <Search className="w-12 h-12 text-orange-500" />
    </motion.div>
    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
      No results found
    </h2>
    <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
      We couldn't find any restaurants matching your search. Try adjusting your
      filters or search terms.
    </p>
    <Link to="/">
      <motion.div whileTap={{ scale: 0.95 }}>
        <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
          Go Back Home
        </Button>
      </motion.div>
    </Link>
  </motion.div>
);

export default SearchPage;
