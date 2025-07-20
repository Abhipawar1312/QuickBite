// Redesigned UI with same functionality
import { Link, useParams } from "react-router-dom";
import FilterPage from "./FilterPage";
import { Input } from "./ui/input";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Globe, MapPin, X } from "lucide-react";
import { Card, CardContent, CardFooter } from "./ui/card";
import { AspectRatio } from "./ui/aspect-ratio";
import { Skeleton } from "./ui/skeleton";
import { useRestaurantStore } from "@/store/useRestaurantStore";
import { motion } from "framer-motion";

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

  return (
    <div className="max-w-screen-xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-10"
      >
        <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white">
          Discover Restaurants
        </h1>
        <p className="text-center mt-2">
          Search and explore top-rated places to eat around you.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-[250px_1fr] gap-8">
        <FilterPage />
        <div>
          <div className="flex gap-3 items-center mb-6">
            <Input
              value={searchQuery}
              placeholder="Search restaurants or cuisines..."
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-grow border border-gray-300 shadow-sm"
            />
            <Button
              onClick={() =>
                searchRestaurant(params.text!, searchQuery, appliedFilter)
              }
              className="bg-sky-blue hover:bg-sky-blue text-white"
            >
              Search
            </Button>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">
              {searchedRestaurant?.data.length} Results Found
            </h2>
            <div className="flex flex-wrap gap-2">
              {appliedFilter.map((filter, idx) => (
                <div key={idx} className="relative">
                  <Badge className="pr-6 bg-blue-100 text-blue-800 rounded-full">
                    {filter}
                  </Badge>
                  <X
                    size={16}
                    onClick={() => setAppliedFilter(filter)}
                    className="absolute right-1 top-1.5 text-blue-700 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <SearchPageSkeleton />
            ) : searchedRestaurant?.data.length === 0 ? (
              <NoResultFound />
            ) : (
              searchedRestaurant?.data.map((restaurant) => (
                <Card
                  key={restaurant._id}
                  className="transition transform hover:-translate-y-1 shadow-lg rounded-2xl overflow-hidden bg-white dark:bg-gray-900"
                >
                  <AspectRatio ratio={16 / 9}>
                    <img
                      src={restaurant.imageUrl}
                      alt={restaurant.restaurantName}
                      className="object-cover w-full h-full"
                    />
                  </AspectRatio>
                  <CardContent className="p-4 space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {restaurant.restaurantName}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <MapPin size={14} className="mr-1" /> {restaurant.city}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Globe size={14} className="mr-1" /> {restaurant.country}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {restaurant.cuisines.map((cuisine, idx) => (
                        <Badge key={idx} className="bg-gray-100 text-gray-700">
                          {cuisine}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                    <Link to={`/restaurant/${restaurant._id}`}>
                      <Button className="bg-sky-blue hover:bg-sky-blue text-white rounded-full px-4 py-2">
                        View Menus
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;

const SearchPageSkeleton = () => (
  <>
    {[...Array(3)].map((_, idx) => (
      <Card
        key={idx}
        className="bg-white dark:bg-gray-800 shadow rounded-2xl overflow-hidden"
      >
        <AspectRatio ratio={16 / 9}>
          <Skeleton className="w-full h-full" />
        </AspectRatio>
        <CardContent className="p-4 space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <div className="flex gap-2 mt-3">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-20" />
          </div>
        </CardContent>
        <CardFooter className="p-4 flex justify-end">
          <Skeleton className="h-10 w-24 rounded-full" />
        </CardFooter>
      </Card>
    ))}
  </>
);

const NoResultFound = () => (
  <div className="text-center col-span-full">
    <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
      No results found
    </h2>
    <p className="text-gray-600 dark:text-gray-400 mt-2">
      We couldn’t find anything. Try again.
    </p>
    <Link to="/">
      <Button className="mt-4 bg-sky-blue hover:bg-sky-blue text-white">
        Go Back Home
      </Button>
    </Link>
  </div>
);
